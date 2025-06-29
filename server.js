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
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * Initialize application - create required directories and default files
 */
async function initializeApp() {
    try {
        console.log('🔧 Initializing application...');
        
        // Determine if running in Docker (check for /app/data mount)
        const isDocker = await fs.access('/app/data').then(() => true).catch(() => false);
        const dataDir = isDocker ? '/app/data' : __dirname;
        
        console.log(`📁 Using data directory: ${dataDir}`);
        
        // Create data directory if needed (Docker mode)
        if (isDocker) {
            try {
                await fs.mkdir(dataDir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.error('❌ Failed to create data directory:', error.message);
                }
            }
        }
        
        // Create epubs directory if it doesn't exist
        const epubsDir = path.join(dataDir, 'epubs');
        try {
            await fs.access(epubsDir);
        } catch {
            await fs.mkdir(epubsDir, { recursive: true });
            console.log('📁 Created epubs directory');
        }
        
        // Set global paths for Docker compatibility
        global.USERS_FILE = path.join(dataDir, 'users.json');
        global.URLS_FILE = path.join(dataDir, 'converted_urls.json');
        global.EPUBS_DIR = epubsDir;
        
        // Initialize users.json if it doesn't exist
        try {
            await fs.access(global.USERS_FILE);
        } catch {
            try {
                // Try to copy from example file
                const exampleContent = await fs.readFile('users.json.example', 'utf8');
                await fs.writeFile(global.USERS_FILE, exampleContent);
                console.log('👥 Created users.json from example file');
            } catch {
                // Create default users.json if example doesn't exist
                const defaultUsers = {
                    users: [
                        {
                            id: "admin",
                            username: "admin",
                            password: "changeme",
                            theme: "light",
                            preferences: {
                                trackUrls: true,
                                defaultAuthor: "LinkPub",
                                autoSave: true
                            }
                        }
                    ]
                };
                await fs.writeFile(global.USERS_FILE, JSON.stringify(defaultUsers, null, 2));
                console.log('👥 Created default users.json (username: admin, password: changeme)');
            }
        }
        
        // Initialize converted_urls.json if it doesn't exist
        try {
            await fs.access(global.URLS_FILE);
        } catch {
            const defaultUrls = { urls: [] };
            await fs.writeFile(global.URLS_FILE, JSON.stringify(defaultUrls, null, 2));
            console.log('📝 Created converted_urls.json');
        }
        
        console.log('✅ Application initialization complete');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error.message);
        process.exit(1);
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Load users from JSON file
 * @returns {Promise<Object>} User data object with users array
 */
async function loadUsers() {
    try {
        const userFile = global.USERS_FILE || 'users.json';
        const data = await fs.readFile(userFile, 'utf8');
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
        const userFile = global.USERS_FILE || 'users.json';
        await fs.writeFile(userFile, JSON.stringify(userData, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving users:', error.message);
        return false;
    }
}

/**
 * Load converted URLs from JSON file
 * @returns {Promise<Object>} Converted URLs data object
 */
async function loadConvertedUrls() {
    try {
        const urlsFile = global.URLS_FILE || 'converted_urls.json';
        const data = await fs.readFile(urlsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error loading converted URLs:', error.message);
        return { urls: [] };
    }
}

/**
 * Save converted URLs to JSON file
 * @param {Object} urlsData - URLs data object to save
 * @returns {Promise<boolean>} Success status
 */
async function saveConvertedUrls(urlsData) {
    try {
        const urlsFile = global.URLS_FILE || 'converted_urls.json';
        await fs.writeFile(urlsFile, JSON.stringify(urlsData, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving converted URLs:', error.message);
        return false;
    }
}

/**
 * Add a URL to the converted URLs tracking
 * @param {string} userId - User ID
 * @param {string} url - URL that was converted
 * @param {string} title - Article title
 * @param {string} siteName - Site name
 * @param {string} method - Conversion method (single/collection/karakeep)
 */
async function trackConvertedUrl(userId, url, title, siteName, method) {
    try {
        const urlsData = await loadConvertedUrls();
        
        const urlEntry = {
            id: generateUniqueId(),
            userId,
            url,
            title,
            siteName,
            method,
            convertedAt: new Date().toISOString()
        };
        
        // Remove existing entry for same URL by same user to avoid duplicates
        urlsData.urls = urlsData.urls.filter(entry => !(entry.url === url && entry.userId === userId));
        
        urlsData.urls.push(urlEntry);
        
        // Keep only last 1000 entries per user to prevent unlimited growth
        const userUrls = urlsData.urls.filter(entry => entry.userId === userId);
        if (userUrls.length > 1000) {
            const urlsToKeep = userUrls.sort((a, b) => new Date(b.convertedAt) - new Date(a.convertedAt)).slice(0, 1000);
            urlsData.urls = urlsData.urls.filter(entry => entry.userId !== userId).concat(urlsToKeep);
        }
        
        await saveConvertedUrls(urlsData);
        console.log(`📝 Tracked URL conversion: ${title} by user ${userId}`);
    } catch (error) {
        console.error('❌ Error tracking converted URL:', error.message);
    }
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a secure API key
 * @returns {string} API key
 */
function generateApiKey() {
    const crypto = require('crypto');
    return 'lp_' + crypto.randomBytes(32).toString('hex');
}

/**
 * API key authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
async function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    
    try {
        const userData = await loadUsers();
        const user = userData.users.find(u => u.preferences?.apiKey === apiKey);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }
        
        // Set user context for the request
        req.apiUser = {
            id: user.id,
            username: user.username,
            preferences: user.preferences || {}
        };
        
        next();
    } catch (error) {
        console.error('❌ API key validation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Ensure user's EPUB directory exists
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Directory path or null if error
 */
async function ensureUserEpubsDir(userId) {
    const epubsDir = global.EPUBS_DIR || path.join(__dirname, 'epubs');
    const dir = path.join(epubsDir, userId);
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
        const epubsDir = global.EPUBS_DIR || path.join(__dirname, 'epubs');
        const dir = path.join(epubsDir, userId);
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
 * Update user preferences
 */
app.put('/api/user/preferences', requireAuth, async (req, res) => {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: 'Invalid preferences object' });
    }
    
    try {
        const userData = await loadUsers();
        const userIndex = userData.users.findIndex(u => u.id === req.session.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update preferences in file and session
        userData.users[userIndex].preferences = { 
            ...userData.users[userIndex].preferences, 
            ...preferences 
        };
        await saveUsers(userData);
        req.session.user.preferences = userData.users[userIndex].preferences;
        
        console.log(`⚙️ Preferences updated for user: ${req.session.user.username}`);
        
        res.json({ success: true, preferences: req.session.user.preferences });
    } catch (error) {
        console.error('❌ Preferences update error:', error.message);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

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

/**
 * Get user's converted URLs history
 */
app.get('/api/user/converted-urls', requireAuth, async (req, res) => {
    try {
        const urlsData = await loadConvertedUrls();
        const userUrls = urlsData.urls
            .filter(entry => entry.userId === req.session.user.id)
            .sort((a, b) => new Date(b.convertedAt) - new Date(a.convertedAt));
        
        res.json({ urls: userUrls });
    } catch (error) {
        console.error('❌ Error fetching converted URLs:', error.message);
        res.status(500).json({ error: 'Failed to fetch converted URLs' });
    }
});

/**
 * Clear user's converted URLs history
 */
app.delete('/api/user/converted-urls', requireAuth, async (req, res) => {
    try {
        const urlsData = await loadConvertedUrls();
        urlsData.urls = urlsData.urls.filter(entry => entry.userId !== req.session.user.id);
        await saveConvertedUrls(urlsData);
        
        console.log(`🗑️ Cleared URL history for user: ${req.session.user.username}`);
        res.json({ success: true, message: 'URL history cleared' });
    } catch (error) {
        console.error('❌ Error clearing converted URLs:', error.message);
        res.status(500).json({ error: 'Failed to clear URL history' });
    }
});

/**
 * Generate/regenerate user API key
 */
app.post('/api/user/api-key', requireAuth, async (req, res) => {
    try {
        const userData = await loadUsers();
        const userIndex = userData.users.findIndex(u => u.id === req.session.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate new API key
        const apiKey = generateApiKey();
        
        // Update user preferences
        if (!userData.users[userIndex].preferences) {
            userData.users[userIndex].preferences = {};
        }
        userData.users[userIndex].preferences.apiKey = apiKey;
        
        await saveUsers(userData);
        req.session.user.preferences = userData.users[userIndex].preferences;
        
        console.log(`🔑 API key generated for user: ${req.session.user.username}`);
        
        res.json({ success: true, apiKey });
    } catch (error) {
        console.error('❌ API key generation error:', error.message);
        res.status(500).json({ error: 'Failed to generate API key' });
    }
});

/**
 * Get user's API key
 */
app.get('/api/user/api-key', requireAuth, async (req, res) => {
    try {
        const userData = await loadUsers();
        const user = userData.users.find(u => u.id === req.session.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const apiKey = user.preferences?.apiKey;
        
        if (!apiKey) {
            return res.json({ hasApiKey: false });
        }
        
        // Return masked API key for security
        const maskedKey = apiKey.substring(0, 8) + '*'.repeat(apiKey.length - 8);
        
        res.json({ 
            hasApiKey: true, 
            apiKey: maskedKey,
            fullKey: apiKey // Only return full key to authenticated user
        });
    } catch (error) {
        console.error('❌ API key fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch API key' });
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
            
            // Track the URL conversion if user has tracking enabled
            if (req.session.user && req.session.user.preferences?.trackUrls !== false) {
                await trackConvertedUrl(
                    req.session.user.id, 
                    url, 
                    result.title, 
                    result.siteName, 
                    'extraction'
                );
            }
            
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
        
        const epubsDir = global.EPUBS_DIR || path.join(__dirname, 'epubs');
        const epubPath = path.join(epubsDir, userId, filename);
        
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
        
        const epubsDir = global.EPUBS_DIR || path.join(__dirname, 'epubs');
        const epubPath = path.join(epubsDir, userId, filename);
        const metadataPath = path.join(epubsDir, userId, filename.replace('.epub', '.json'));
        
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
// PROGRAMMATIC API ROUTES (API Key Authentication)
// =============================================================================

/**
 * Extract article content from URL (programmatic access)
 * @param {string} url - URL to extract
 * @returns {Promise<Object>} Article data
 */
async function extractArticleForApi(url) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    
    const domain = new URL(url).hostname;
    
    for (let i = 0; i < userAgents.length; i++) {
        try {
            const headers = {
                'User-Agent': userAgents[i],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            };
            
            const response = await fetch(url, {
                headers,
                redirect: 'follow',
                signal: AbortSignal.timeout(15000)
            });
            
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
            
            return {
                title: article.title || 'Untitled Article',
                content: article.content,
                excerpt: article.excerpt || '',
                siteName: article.siteName || domain,
                url: url,
                wordCount: article.textContent ? article.textContent.split(/\s+/).length : 0
            };
            
        } catch (error) {
            if (i === userAgents.length - 1) {
                throw error;
            }
            continue;
        }
    }
}

/**
 * Generate EPUB from list of URLs (API endpoint)
 */
app.post('/api/v1/generate-epub', requireApiKey, async (req, res) => {
    try {
        const { urls, title, author, description } = req.body;
        
        // Validate input
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ 
                error: 'urls array is required and must contain at least one URL' 
            });
        }
        
        if (urls.length > 50) {
            return res.status(400).json({ 
                error: 'Maximum 50 URLs allowed per request' 
            });
        }
        
        // Validate URLs
        for (const url of urls) {
            try {
                new URL(url);
            } catch {
                return res.status(400).json({ 
                    error: `Invalid URL: ${url}` 
                });
            }
        }
        
        const epubTitle = title || `Generated Collection (${urls.length} articles)`;
        const epubAuthor = author || 'LinkPub API';
        const epubDescription = description || '';
        
        console.log(`📚 API: Generating EPUB for ${urls.length} URLs by user ${req.apiUser.username}`);
        
        // Extract articles
        const articles = [];
        const errors = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                console.log(`📄 API: Extracting ${i + 1}/${urls.length}: ${url}`);
                const article = await extractArticleForApi(url);
                articles.push(article);
                
                // Track URL conversion if enabled
                if (req.apiUser.preferences?.trackUrls !== false) {
                    await trackConvertedUrl(
                        req.apiUser.id, 
                        url, 
                        article.title, 
                        article.siteName, 
                        'api'
                    );
                }
            } catch (error) {
                console.error(`❌ API: Failed to extract ${url}:`, error.message);
                errors.push({ url, error: error.message });
            }
        }
        
        if (articles.length === 0) {
            return res.status(422).json({ 
                error: 'No articles could be extracted from the provided URLs',
                errors 
            });
        }
        
        // Generate EPUB
        console.log(`📖 API: Generating EPUB with ${articles.length} articles`);
        const epub = await generateCollectionEpubForApi(articles, epubTitle, epubAuthor, epubDescription);
        
        // Set appropriate headers for EPUB download
        res.setHeader('Content-Type', 'application/epub+zip');
        res.setHeader('Content-Disposition', `attachment; filename="${epubTitle.replace(/[^a-z0-9\s-_]/gi, '').replace(/\s+/g, '_')}.epub"`);
        
        // Send the EPUB file
        res.send(epub);
        
        console.log(`✅ API: EPUB generated successfully for user ${req.apiUser.username}`);
        
    } catch (error) {
        console.error('❌ API: EPUB generation error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate EPUB',
            details: error.message 
        });
    }
});

/**
 * Generate collection EPUB for API (returns Buffer)
 */
async function generateCollectionEpubForApi(articles, title, author, description) {
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    zip.file('mimetype', 'application/epub+zip');
    
    const metaInf = zip.folder('META-INF');
    metaInf.file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);
    
    const oebps = zip.folder('OEBPS');
    
    // Generate manifest items for each article
    const manifestItems = articles.map((article, index) => 
        `<item id="chapter${index + 1}" href="chapter${index + 1}.html" media-type="application/xhtml+xml"/>`
    ).join('\n        ');
    
    // Generate spine items for each article
    const spineItems = articles.map((article, index) => 
        `<itemref idref="chapter${index + 1}"/>`
    ).join('\n        ');
    
    function escapeXml(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    function generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:identifier id="BookId">${generateUuid()}</dc:identifier>
        <dc:title>${escapeXml(title)}</dc:title>
        <dc:creator>${escapeXml(author)}</dc:creator>
        <dc:language>en</dc:language>
        <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
        ${description ? `<dc:description>${escapeXml(description)}</dc:description>` : ''}
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        ${manifestItems}
    </manifest>
    <spine toc="ncx">
        ${spineItems}
    </spine>
</package>`);
    
    // Generate TOC
    const navPoints = articles.map((article, index) => `
        <navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">
            <navLabel>
                <text>${escapeXml(article.title)}</text>
            </navLabel>
            <content src="chapter${index + 1}.html"/>
        </navPoint>`).join('');
    
    const totalWords = articles.reduce((sum, article) => sum + (article.wordCount || 1000), 0);
    const estimatedPages = Math.max(1, Math.ceil(totalWords / 250));
    
    oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="${generateUuid()}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="${estimatedPages}"/>
        <meta name="dtb:maxPageNumber" content="${estimatedPages}"/>
    </head>
    <docTitle>
        <text>${escapeXml(title)}</text>
    </docTitle>
    <navMap>${navPoints}
    </navMap>
</ncx>`);
    
    // Generate individual chapter files
    articles.forEach((article, index) => {
        oebps.file(`chapter${index + 1}.html`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${escapeXml(article.title)}</title>
    <style>
        body { font-family: serif; line-height: 1.6; margin: 2em; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1em; }
        img { max-width: 100%; height: auto; }
        .chapter-meta { color: #666; font-style: italic; margin-bottom: 2em; border-bottom: 1px solid #eee; padding-bottom: 1em; }
    </style>
</head>
<body>
    <h1>${escapeXml(article.title)}</h1>
    <div class="chapter-meta">
        <p>Source: ${escapeXml(article.siteName)}</p>
        <p>URL: ${escapeXml(article.url)}</p>
        ${article.wordCount ? `<p>Word count: ${article.wordCount} words</p>` : ''}
    </div>
    ${article.content}
</body>
</html>`);
    });
    
    return await zip.generateAsync({type: 'nodebuffer'});
}

/**
 * API status endpoint
 */
app.get('/api/v1/status', requireApiKey, (req, res) => {
    res.json({
        status: 'ok',
        user: req.apiUser.username,
        version: '2.0.0',
        features: ['epub-generation', 'url-tracking'],
        limits: {
            maxUrlsPerRequest: 50,
            timeout: 15000
        }
    });
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

async function startServer() {
    // Initialize application
    await initializeApp();
    
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
}

startServer();