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
    const rawName = match[2];

    // Check if name ends with * (hot system marker)
    const isHot = rawName.endsWith('*');
    const name = isHot ? rawName.slice(0, -1) : rawName;
    const linkKey = `${id}:${name}`;

    // Avoid duplicates
    if (!seenLinks.has(linkKey)) {
      seenLinks.add(linkKey);
      links.push({
        id: id,
        name: name,
        full: `showinfo:5//${id}`,
        display: name,
        isHot: isHot
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
// NOTE: Game client adds exactly 82 characters of overhead per link (color codes, formatting, etc)
// Separators do NOT get overhead - they are counted at face value (2 chars)
// We need to stay under 3900 chars total in-game
function formatLinksForExport(links, maxInGameChars = 3900) {
  const OVERHEAD_PER_LINK = 82;
  const SEPARATOR_LENGTH = 2; // '→ ' is 2 characters (no overhead added by game)

  const batches = [];
  const batchMetadata = [];
  let currentBatch = [];
  let currentInGameLength = 0;

  links.forEach(link => {
    // Format: <a href="showinfo:5//ID">Name</a>
    const formattedLink = `<a href="showinfo:5//${link.id}">${link.name}</a>`;
    const linkLength = formattedLink.length;
    const linkInGameLength = linkLength + OVERHEAD_PER_LINK;

    // Calculate what the in-game length would be if we add this link
    // Separator does NOT get the 82 char overhead, just its raw 2 chars
    const separatorInGame = currentBatch.length > 0 ? SEPARATOR_LENGTH : 0;
    const testInGameLength = currentInGameLength + separatorInGame + linkInGameLength;

    // If adding this link would exceed the in-game limit, start a new batch
    if (testInGameLength > maxInGameChars && currentBatch.length > 0) {
      const batchText = currentBatch.join('→ ');
      batches.push(batchText);
      batchMetadata.push({
        text: batchText,
        rawChars: batchText.length,
        inGameChars: currentInGameLength,
        linkCount: currentBatch.length
      });
      currentBatch = [formattedLink];
      currentInGameLength = linkInGameLength;
    } else {
      currentBatch.push(formattedLink);
      currentInGameLength = testInGameLength;
    }
  });

  // Add the last batch if it has any links
  if (currentBatch.length > 0) {
    const batchText = currentBatch.join('→ ');
    batches.push(batchText);
    batchMetadata.push({
      text: batchText,
      rawChars: batchText.length,
      inGameChars: currentInGameLength,
      linkCount: currentBatch.length
    });
  }

  return { batches, metadata: batchMetadata };
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
    const { batches: formattedBatches, metadata: batchMetadata } = formatLinksForExport(commonLinks);

    // Return results
    res.json({
      links1: links1,
      links2: links2,
      intersection: commonLinks,
      formattedBatches: formattedBatches,
      batchMetadata: batchMetadata,
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
