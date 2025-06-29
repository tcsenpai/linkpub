/**
 * LinkPub Server - Convert web articles to EPUB format with user authentication
 * 
 * Features:
 * - User authentication and session management
 * - Article extraction from URLs
 * - EPUB generation (single articles and collections)
 * - User-specific EPUB storage and management
 * - Theme preferences per user
 * - Karakeep integration for bookmark imports
 * 
 * @author LinkPub Team
 * @version 2.0.0
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const KARAKEEP_ENABLED = !!(process.env.KARAKEEP_KEY && process.env.KARAKEEP_URL);
const SESSION_SECRET = process.env.SESSION_SECRET || 'linkpub-secret-key-change-in-production';

console.log('🚀 LinkPub Server Starting...');
console.log('📚 Karakeep integration:', KARAKEEP_ENABLED ? 'ENABLED' : 'DISABLED');

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// Enable CORS with credentials for authentication
app.use(cors({
    origin: true,
    credentials: true
}));

// Parse JSON bodies (increased limit for EPUB data)
app.use(express.json({ limit: '50mb' }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('.'));

// Session management for user authentication
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Load users from JSON file
 * @returns {Promise<Object>} User data object with users array
 */
async function loadUsers() {
    try {
        const data = await fs.readFile('users.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error loading users:', error.message);
        return { users: [] };
    }
}

/**
 * Save users to JSON file
 * @param {Object} userData - User data object to save
 * @returns {Promise<boolean>} Success status
 */
async function saveUsers(userData) {
    try {
        await fs.writeFile('users.json', JSON.stringify(userData, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving users:', error.message);
        return false;
    }
}

/**
 * Ensure user's EPUB directory exists
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Directory path or null if error
 */
async function ensureUserEpubsDir(userId) {
    const dir = path.join(__dirname, 'epubs', userId);
    try {
        await fs.mkdir(dir, { recursive: true });
        return dir;
    } catch (error) {
        console.error('❌ Error creating epubs directory:', error.message);
        return null;
    }
}

/**
 * Get user's stored EPUBs with metadata
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of EPUB objects
 */
async function getUserEpubs(userId) {
    try {
        const dir = path.join(__dirname, 'epubs', userId);
        const files = await fs.readdir(dir);
        const epubs = [];
        
        for (const file of files) {
            if (file.endsWith('.epub')) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);
                const metadataPath = path.join(dir, file.replace('.epub', '.json'));
                
                // Default metadata
                let metadata = {
                    title: file.replace('.epub', ''),
                    description: '',
                    contents: [],
                    createdAt: stats.birthtime
                };
                
                // Try to load saved metadata
                try {
                    const metadataContent = await fs.readFile(metadataPath, 'utf8');
                    metadata = { ...metadata, ...JSON.parse(metadataContent) };
                } catch (e) {
                    // Metadata file doesn't exist, use defaults
                }
                
                epubs.push({
                    filename: file,
                    ...metadata,
                    size: stats.size,
                    modifiedAt: stats.mtime
                });
            }
        }
        
        // Sort by modification date (newest first)
        return epubs.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    } catch (error) {
        console.error('❌ Error getting user EPUBs:', error.message);
        return [];
    }
}

/**
 * Authentication middleware - ensures user is logged in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * Serve main application page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

/**
 * User login endpoint
 */
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
        const userData = await loadUsers();
        const user = userData.users.find(u => 
            u.username === username && u.password === password
        );
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create user session
        req.session.user = {
            id: user.id,
            username: user.username,
            theme: user.theme || 'light',
            preferences: user.preferences || {}
        };
        
        // Ensure user's EPUB directory exists
        await ensureUserEpubsDir(user.id);
        
        console.log(`✅ User logged in: ${username}`);
        
        res.json({
            success: true,
            user: req.session.user
        });
        
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * User logout endpoint
 */
app.post('/api/auth/logout', (req, res) => {
    const username = req.session.user?.username;
    req.session.destroy(err => {
        if (err) {
            console.error('❌ Logout error:', err.message);
            return res.status(500).json({ error: 'Logout failed' });
        }
        if (username) {
            console.log(`✅ User logged out: ${username}`);
        }
        res.json({ success: true });
    });
});

/**
 * Get current user information
 */
app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
});

// =============================================================================
// USER PREFERENCE ROUTES
// =============================================================================

/**
 * Update user theme preference
 */
app.put('/api/user/theme', requireAuth, async (req, res) => {
    const { theme } = req.body;
    
    // Validate theme value
    if (!['light', 'dark', 'sepia'].includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme. Must be: light, dark, or sepia' });
    }
    
    try {
        const userData = await loadUsers();
        const userIndex = userData.users.findIndex(u => u.id === req.session.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update theme in file and session
        userData.users[userIndex].theme = theme;
        await saveUsers(userData);
        req.session.user.theme = theme;
        
        console.log(`✨ Theme updated to ${theme} for user: ${req.session.user.username}`);
        
        res.json({ success: true, theme });
    } catch (error) {
        console.error('❌ Theme update error:', error.message);
        res.status(500).json({ error: 'Failed to update theme' });
    }
});

// =============================================================================
// ARTICLE EXTRACTION ROUTES
// =============================================================================

/**
 * Extract article content from URL using Readability
 */
app.post('/api/extract', requireAuth, async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    // User agents for anti-bot handling
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
            console.log(`Extracting: ${url} (attempt ${i + 1})`);
            
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
            
            // Domain-specific headers
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
                signal: AbortSignal.timeout(15000)
            });
            
            if (response.status === 403 && i < userAgents.length - 1) {
                console.log(`Got 403, trying next user agent...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
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
            
            const reader = new Readability(document.cloneNode(true));
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
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
        }
    }
    
    console.error('❌ All extraction attempts failed:', lastError.message);
    res.status(500).json({ 
        error: `Failed to extract article after ${userAgents.length} attempts: ${lastError.message}. This website may be blocking automated access.` 
    });
});

// =============================================================================
// EPUB STORAGE ROUTES
// =============================================================================

/**
 * Save EPUB to user's library
 */
app.post('/api/epubs/save', requireAuth, async (req, res) => {
    const { title, description, contents, epubData } = req.body;
    
    // Validate required fields
    if (!title || !epubData) {
        return res.status(400).json({ error: 'Title and EPUB data required' });
    }
    
    try {
        const userId = req.session.user.id;
        const epubsDir = await ensureUserEpubsDir(userId);
        
        if (!epubsDir) {
            return res.status(500).json({ error: 'Failed to create storage directory' });
        }
        
        // Create safe filename (remove special chars, limit length)
        const safeTitle = title.replace(/[^a-z0-9\s-_]/gi, '').replace(/\s+/g, '_').substring(0, 50);
        const filename = safeTitle + '.epub';
        const epubPath = path.join(epubsDir, filename);
        const metadataPath = path.join(epubsDir, filename.replace('.epub', '.json'));
        
        // Convert base64 to buffer and save EPUB file
        const epubBuffer = Buffer.from(epubData.split(',')[1], 'base64');
        await fs.writeFile(epubPath, epubBuffer);
        
        // Save metadata for library display
        const metadata = {
            title,
            description: description || '',
            contents: contents || [],
            createdAt: new Date().toISOString(),
            userId
        };
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log(`📚 EPUB saved: ${filename} for user ${req.session.user.username}`);
        
        res.json({ 
            success: true, 
            filename,
            message: 'EPUB saved successfully' 
        });
        
    } catch (error) {
        console.error('❌ EPUB save error:', error.message);
        res.status(500).json({ error: 'Failed to save EPUB' });
    }
});

/**
 * Get user's EPUB library
 */
app.get('/api/epubs', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const epubs = await getUserEpubs(userId);
        res.json({ epubs });
    } catch (error) {
        console.error('❌ Error fetching EPUBs:', error.message);
        res.status(500).json({ error: 'Failed to fetch EPUBs' });
    }
});

/**
 * Download EPUB from user's library
 */
app.get('/api/epubs/:filename', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const filename = req.params.filename;
        
        // Security validation - prevent directory traversal
        if (!filename.endsWith('.epub') || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        
        const epubPath = path.join(__dirname, 'epubs', userId, filename);
        
        // Check if file exists and is accessible
        await fs.access(epubPath);
        
        console.log(`📁 EPUB downloaded: ${filename} by user ${req.session.user.username}`);
        res.download(epubPath);
        
    } catch (error) {
        console.error('❌ Error downloading EPUB:', error.message);
        res.status(404).json({ error: 'EPUB not found' });
    }
});

/**
 * Delete EPUB from user's library
 */
app.delete('/api/epubs/:filename', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const filename = req.params.filename;
        
        // Security validation
        if (!filename.endsWith('.epub') || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        
        const epubPath = path.join(__dirname, 'epubs', userId, filename);
        const metadataPath = path.join(__dirname, 'epubs', userId, filename.replace('.epub', '.json'));
        
        // Delete EPUB file
        await fs.unlink(epubPath);
        
        // Delete metadata file (if exists)
        try {
            await fs.unlink(metadataPath);
        } catch (e) {
            // Metadata file might not exist, ignore error
        }
        
        console.log(`🗑️ EPUB deleted: ${filename} by user ${req.session.user.username}`);
        res.json({ success: true, message: 'EPUB deleted successfully' });
        
    } catch (error) {
        console.error('❌ Error deleting EPUB:', error.message);
        res.status(500).json({ error: 'Failed to delete EPUB' });
    }
});

// =============================================================================
// KARAKEEP INTEGRATION ROUTES
// =============================================================================

/**
 * Get Karakeep integration status
 */
app.get('/api/karakeep/status', (req, res) => {
    res.json({ enabled: KARAKEEP_ENABLED });
});

/**
 * Fetch bookmarks from Karakeep service
 */
app.get('/api/karakeep/bookmarks', requireAuth, async (req, res) => {
    if (!KARAKEEP_ENABLED) {
        return res.status(503).json({ error: 'Karakeep integration not configured' });
    }
    
    try {
        console.log('📑 Fetching Karakeep bookmarks...');
        
        const url = new URL(`${process.env.KARAKEEP_URL}/bookmarks`);
        url.searchParams.set('includeContent', 'false');
        url.searchParams.set('limit', '100');
        url.searchParams.set('archived', 'false');
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.KARAKEEP_KEY}`,
                'Accept': 'application/json',
                'User-Agent': 'LinkPub/2.0'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🔴 Karakeep API error response:', errorText);
            throw new Error(`Karakeep API error: ${response.status} ${response.statusText}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`📚 Retrieved ${data.bookmarks?.length || 0} bookmarks from Karakeep`);
        
        // Transform and normalize bookmark data
        const bookmarks = (data.bookmarks || []).map(bookmark => {
            const content = bookmark.content || {};
            const url = content.url || bookmark.url || '';
            const title = content.title || bookmark.title || content.url || 'Untitled Bookmark';
            const description = content.description || bookmark.description || bookmark.summary || '';
            
            let domain = 'unknown';
            if (url) {
                try {
                    domain = new URL(url).hostname;
                } catch (e) {
                    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
                    if (match) domain = match[1];
                }
            }
            
            let tags = [];
            if (bookmark.tags) {
                if (Array.isArray(bookmark.tags)) {
                    tags = bookmark.tags.filter(tag => tag && typeof tag === 'string');
                } else if (typeof bookmark.tags === 'object' && bookmark.tags.length) {
                    tags = Object.values(bookmark.tags).filter(tag => tag && typeof tag === 'string');
                }
            }
            
            return {
                id: bookmark.id,
                url: url,
                title: title,
                description: description,
                tags: tags,
                created_at: bookmark.createdAt || bookmark.created_at || bookmark.modifiedAt,
                domain: domain,
                favourited: bookmark.favourited || false,
                author: content.author || '',
                publisher: content.publisher || '',
                imageUrl: content.imageUrl || '',
                datePublished: content.datePublished || ''
            };
        });
        
        res.json({ bookmarks });
        
    } catch (error) {
        console.error('❌ Karakeep API error:', error.message);
        res.status(500).json({ 
            error: `Failed to fetch bookmarks: ${error.message}` 
        });
    }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
    console.log('\n🚀 LinkPub Server Started Successfully!');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log('👤 Check users.json for login credentials');
    console.log('📚 Features: Authentication, EPUB Storage, Theme Management');
    if (KARAKEEP_ENABLED) {
        console.log('🔗 Karakeep integration: ENABLED');
    }
    console.log('\n✨ Ready to convert articles to EPUBs!');
    console.log('Press Ctrl+C to stop the server\n');
});