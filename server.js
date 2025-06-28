const express = require('express');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/extract', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        console.log(`Fetching: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        const dom = new JSDOM(html, { url: url });
        const document = dom.window.document;
        
        const reader = new Readability(document);
        const article = reader.parse();
        
        if (!article) {
            throw new Error('Could not extract readable content from this page');
        }
        
        const result = {
            title: article.title || 'Untitled Article',
            content: article.content,
            excerpt: article.excerpt || '',
            siteName: article.siteName || new URL(url).hostname,
            url: url
        };
        
        console.log(`Successfully extracted: ${result.title}`);
        res.json(result);
        
    } catch (error) {
        console.error('Extraction error:', error.message);
        res.status(500).json({ 
            error: `Failed to extract article: ${error.message}` 
        });
    }
});

app.listen(PORT, () => {
    console.log(`LinkPub server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});