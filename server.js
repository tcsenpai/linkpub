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
    
    // Different user agents to try if 403 occurs
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const domain = new URL(url).hostname;
    let lastError;
    
    for (let i = 0; i < userAgents.length; i++) {
        try {
            console.log(`Attempt ${i + 1} for ${url} with user agent: ${userAgents[i].substring(0, 50)}...`);
            
            const headers = {
                'User-Agent': userAgents[i],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Connection': 'keep-alive'
            };
            
            // Add domain-specific headers for known problematic sites
            if (domain.includes('medium.com') || domain.includes('substack.com')) {
                headers['Referer'] = `https://${domain}/`;
                headers['Sec-Ch-Ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
                headers['Sec-Ch-Ua-Mobile'] = '?0';
                headers['Sec-Ch-Ua-Platform'] = '"Windows"';
            }
            
            if (domain.includes('nytimes.com') || domain.includes('wsj.com')) {
                headers['Referer'] = 'https://www.google.com/';
            }
            
            const response = await fetch(url, {
                headers,
                redirect: 'follow',
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            
            if (response.status === 403 && i < userAgents.length - 1) {
                console.log(`Got 403, trying next user agent...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                continue;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            
            if (html.length < 100) {
                throw new Error('Response too short, possible blocking');
            }
            
            const dom = new JSDOM(html, { 
                url: url,
                resources: "usable",
                runScripts: "outside-only"
            });
            const document = dom.window.document;
            
            // Try to clean up common anti-bot elements
            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
                if (script.textContent.includes('bot') || script.textContent.includes('robot')) {
                    script.remove();
                }
            });
            
            const reader = new Readability(document);
            const article = reader.parse();
            
            if (!article || !article.content || article.content.length < 100) {
                throw new Error('Could not extract readable content from this page');
            }
            
            const result = {
                title: article.title || 'Untitled Article',
                content: article.content,
                excerpt: article.excerpt || '',
                siteName: article.siteName || domain,
                url: url,
                wordCount: article.textContent ? article.textContent.split(/\s+/).length : 0
            };
            
            console.log(`Successfully extracted: "${result.title}" (${result.wordCount} words)`);
            return res.json(result);
            
        } catch (error) {
            lastError = error;
            console.log(`Attempt ${i + 1} failed: ${error.message}`);
            
            if (i < userAgents.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                continue;
            }
        }
    }
    
    console.error('All extraction attempts failed:', lastError.message);
    res.status(500).json({ 
        error: `Failed to extract article after ${userAgents.length} attempts: ${lastError.message}. This website may be blocking automated access.` 
    });
});

app.listen(PORT, () => {
    console.log(`LinkPub server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});