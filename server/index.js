const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Function to extract EVE Online showinfo links from text
function extractLinks(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Regex to match EVE Online showinfo links: <a href="showinfo:5//XXXXXX">Name</a>
  // This captures the full link tag and extracts both the ID and the display name
  const eveLinksRegex = /<a href="showinfo:5\/\/(\d+)">([^<]+)<\/a>/gi;
  const links = [];
  const seenLinks = new Set();

  let match;
  while ((match = eveLinksRegex.exec(text)) !== null) {
    const id = match[1];
    const name = match[2];
    const linkKey = `${id}:${name}`;

    // Avoid duplicates
    if (!seenLinks.has(linkKey)) {
      seenLinks.add(linkKey);
      links.push({
        id: id,
        name: name,
        full: `showinfo:5//${id}`,
        display: name
      });
    }
  }

  return links;
}

// Function to find intersection of two link arrays based on IDs
function findIntersection(links1, links2) {
  // Create a map of ID to link object for links1
  const idMap1 = new Map();
  links1.forEach(link => {
    idMap1.set(link.id, link);
  });

  // Find links in links2 that have matching IDs in links1
  const intersection = [];
  const seenIds = new Set();

  links2.forEach(link => {
    if (idMap1.has(link.id) && !seenIds.has(link.id)) {
      seenIds.add(link.id);
      intersection.push(link);
    }
  });

  return intersection;
}

// Function to format links back into EVE Online format and batch by character limit
function formatLinksForExport(links, maxCharsPerBatch = 3900) {
  const batches = [];
  let currentBatch = [];
  let currentLength = 0;

  links.forEach(link => {
    // Format: <a href="showinfo:5//ID">Name</a>
    const formattedLink = `<a href="showinfo:5//${link.id}">${link.name}</a>`;
    const linkLength = formattedLink.length + 2; // +2 for arrow separator "→ "

    // If adding this link would exceed the limit, start a new batch
    if (currentLength + linkLength > maxCharsPerBatch && currentBatch.length > 0) {
      batches.push(currentBatch.join('→ '));
      currentBatch = [];
      currentLength = 0;
    }

    currentBatch.push(formattedLink);
    currentLength += linkLength;
  });

  // Add the last batch if it has any links
  if (currentBatch.length > 0) {
    batches.push(currentBatch.join('→ '));
  }

  return batches;
}

// API endpoint to process link intersection
app.post('/api/intersect', (req, res) => {
  try {
    const { input1, input2 } = req.body;

    if (!input1 || !input2) {
      return res.status(400).json({
        error: 'Both input1 and input2 are required'
      });
    }

    // Extract links from both inputs
    const links1 = extractLinks(input1);
    const links2 = extractLinks(input2);

    // Find intersection
    const commonLinks = findIntersection(links1, links2);

    // Format common links for export (batched by character limit)
    const formattedBatches = formatLinksForExport(commonLinks);

    // Return results
    res.json({
      links1: links1,
      links2: links2,
      intersection: commonLinks,
      formattedBatches: formattedBatches,
      count: {
        input1: links1.length,
        input2: links2.length,
        common: commonLinks.length,
        batches: formattedBatches.length
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
