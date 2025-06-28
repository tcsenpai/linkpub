# LinkPub

Convert web articles to EPUB format with a clean, modern interface.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser to `http://localhost:3000`

4. Enter any article URL and click "Convert to EPUB"

## Features

- Extract readable content from any web article
- Clean, responsive UI
- Generate proper EPUB files with metadata
- Preview articles before download
- Mobile-friendly design

## How it works

1. Backend fetches the article content directly (no CORS issues)
2. Uses Mozilla's Readability library for content extraction
3. Frontend generates EPUB files using JSZip
4. Downloads as properly formatted `.epub` files

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express
- **Libraries**: JSZip, JSDOM, Mozilla Readability

Simple and reliable!