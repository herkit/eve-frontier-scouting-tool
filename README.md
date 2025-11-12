# Scout Intersect Tool

A specialized web-based tool designed for EVE Online scout route data that extracts system links from two text inputs and finds the common systems between them.

## Architecture

- **Server Side**: Node.js with Express
- **Client Side**: React

## Features

- Extract EVE Online system links from scout route data (showinfo format)
- Find intersection of systems between two route outputs
- Display statistics showing system counts
- Clean, modern UI with responsive design
- View all extracted system links from both inputs
- Shows both system names and IDs for easy identification

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Install server dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
cd ..
```

Or use the combined command:
```bash
npm run install-all
```

### Running the Application

#### Option 1: Development Mode with Auto-Reload (Recommended)

Run both server and client with automatic reload:
```bash
npm run dev
```
This will start:
- Server on http://localhost:3001 (auto-reloads on file changes)
- React client on http://localhost:3000 (auto-reloads on file changes)

#### Option 2: Run Both Server and Client Separately

1. Start the server (in one terminal):
```bash
npm start
```
The server will run on http://localhost:3001

2. Start the client (in another terminal):
```bash
npm run client
```
The React app will open in your browser at http://localhost:3000

#### Option 3: Production Build

1. Build the React app:
```bash
cd client
npm run build
cd ..
```

2. Serve both from the Node.js server by updating server/index.js to serve static files

## Usage

1. Open the application in your browser (http://localhost:3000)
2. Paste EVE Online scout route data into "Input 1" (from tools like Tripwire, Pathfinder, etc.)
3. Paste another scout route output into "Input 2"
4. Click "Find Common Links"
5. View the results:
   - Statistics showing system counts from each input
   - List of common systems found in both routes
   - Expandable section showing all extracted systems from both inputs

### Example Input Format

The tool expects EVE Online system links in the following format:
```
<a href="showinfo:5//30015856">Y:S638</a>
<a href="showinfo:5//30015857">Q:KKR4</a>
<a href="showinfo:5//30015849">J:RS4O</a>
```

These are typically found in scout route outputs from various EVE Online mapping tools.

## API Endpoints

### POST /api/intersect

Processes two text inputs and returns the intersection of links.

**Request Body:**
```json
{
  "input1": "Text with links...",
  "input2": "Text with more links..."
}
```

**Response:**
```json
{
  "links1": [
    { "id": "30015856", "name": "Y:S638", "full": "showinfo:5//30015856", "display": "Y:S638" },
    { "id": "30015857", "name": "Q:KKR4", "full": "showinfo:5//30015857", "display": "Q:KKR4" }
  ],
  "links2": [
    { "id": "30015856", "name": "Y:S638", "full": "showinfo:5//30015856", "display": "Y:S638" },
    { "id": "30015849", "name": "J:RS4O", "full": "showinfo:5//30015849", "display": "J:RS4O" }
  ],
  "intersection": [
    { "id": "30015856", "name": "Y:S638", "full": "showinfo:5//30015856", "display": "Y:S638" }
  ],
  "count": {
    "input1": 2,
    "input2": 2,
    "common": 1
  }
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Link Extraction Details

The tool extracts EVE Online system links in the showinfo format:
- Pattern: `<a href="showinfo:5//XXXXXX">System Name</a>`
- Extracts both the system ID (XXXXXX) and system name
- Duplicate systems are automatically filtered out
- Intersection is based on system ID matching

## Project Structure

```
scout-intersect-tool/
├── server/
│   └── index.js          # Node.js Express server
├── client/
│   ├── public/
│   │   └── index.html    # HTML template
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Component styles
│   │   ├── index.js      # React entry point
│   │   └── index.css     # Global styles
│   └── package.json      # Client dependencies
├── package.json          # Server dependencies
├── .gitignore
├── CLAUDE.md            # Project instructions
└── README.md            # This file
```

## License

MIT
