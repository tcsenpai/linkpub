/**
 * LinkPub - Web Article to EPUB Converter
 * 
 * A comprehensive web application for converting articles to EPUB format
 * with user authentication, library management, and theme support.
 * 
 * Features:
 * - Single article and collection EPUB generation
 * - User authentication and session management
 * - Personal EPUB library with save/delete functionality
 * - Multiple theme support (Light, Dark, Sepia)
 * - Karakeep integration for bookmark imports
 * - Drag & drop article reordering
 * - Bulk URL processing
 * 
 * @author LinkPub Team
 * @version 2.0.0
 */

class LinkPub {
    /**
     * Initialize LinkPub application
     */
    constructor() {
        // =================================================================
        // DOM ELEMENT REFERENCES
        // =================================================================
        
        // Authentication Elements
        this.authOverlay = document.getElementById('authOverlay');
        this.authForm = document.getElementById('authForm');
        this.authError = document.getElementById('authError');
        this.mainContainer = document.getElementById('mainContainer');
        this.currentUserSpan = document.getElementById('currentUser');
        this.themeSelector = document.getElementById('themeSelector');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Single Article Elements
        this.urlInput = document.getElementById('urlInput');
        this.convertBtn = document.getElementById('convertBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.loading = document.getElementById('loading');
        this.previewSection = document.getElementById('previewSection');
        this.articlePreview = document.getElementById('articlePreview');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.saveEpubBtn = document.getElementById('saveEpubBtn');
        
        // Saved EPUBs Elements
        this.refreshEpubsBtn = document.getElementById('refreshEpubsBtn');
        this.epubsGrid = document.getElementById('epubsGrid');
        this.noEpubsMessage = document.getElementById('noEpubsMessage');
        
        // Collection Elements
        this.collectionUrlInput = document.getElementById('collectionUrlInput');
        this.addArticleBtn = document.getElementById('addArticleBtn');
        this.collectionErrorMessage = document.getElementById('collectionErrorMessage');
        this.collectionLoading = document.getElementById('collectionLoading');
        this.loadingText = document.getElementById('loadingText');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.articlesContainer = document.getElementById('articlesContainer');
        this.articlesCount = document.getElementById('articlesCount');
        this.downloadCollectionBtn = document.getElementById('downloadCollectionBtn');
        this.saveCollectionBtn = document.getElementById('saveCollectionBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.collectionTitle = document.getElementById('collectionTitle');
        this.collectionAuthor = document.getElementById('collectionAuthor');
        this.bulkInputBtn = document.getElementById('bulkInputBtn');
        this.bulkUrlInput = document.getElementById('bulkUrlInput');
        this.processBulkBtn = document.getElementById('processBulkBtn');
        this.cancelBulkBtn = document.getElementById('cancelBulkBtn');
        this.exportOptionsBtn = document.getElementById('exportOptionsBtn');
        this.downloadIndividualBtn = document.getElementById('downloadIndividualBtn');
        this.generateCoverBtn = document.getElementById('generateCoverBtn');
        
        // Karakeep Elements
        this.karakeepTabBtn = document.getElementById('karakeepTab');
        this.karakeepLoading = document.getElementById('karakeepLoading');
        this.karakeepError = document.getElementById('karakeepError');
        this.retryKarakeepBtn = document.getElementById('retryKarakeepBtn');
        this.bookmarksControls = document.getElementById('bookmarksControls');
        this.bookmarksGrid = document.getElementById('bookmarksGrid');
        this.selectAllBookmarksBtn = document.getElementById('selectAllBookmarksBtn');
        this.selectNoneBookmarksBtn = document.getElementById('selectNoneBookmarksBtn');
        this.selectedBookmarksCount = document.getElementById('selectedBookmarksCount');
        this.bookmarkSearchInput = document.getElementById('bookmarkSearchInput');
        this.domainFilter = document.getElementById('domainFilter');
        this.karakeepCollectionTitle = document.getElementById('karakeepCollectionTitle');
        this.karakeepCollectionAuthor = document.getElementById('karakeepCollectionAuthor');
        this.downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
        this.processingBookmarks = document.getElementById('processingBookmarks');
        this.processingText = document.getElementById('processingText');
        this.karakeepProgressFill = document.getElementById('karakeepProgressFill');
        this.karakeepProgressText = document.getElementById('karakeepProgressText');
        
        // =================================================================
        // APPLICATION STATE
        // =================================================================
        
        // User & Authentication
        this.currentUser = null;
        
        // Article Processing
        this.currentArticle = null;
        this.articles = []; // Collection articles
        
        // EPUB Library
        this.savedEpubs = [];
        
        // UI State
        this.currentTab = 'single';
        this.sortable = null; // Drag & drop instance
        
        // Karakeep Integration
        this.bookmarks = [];
        this.selectedBookmarks = new Set();
        this.filteredBookmarks = [];
        this.karakeepEnabled = false;
        
        // Initialize application
        this.initApp();
    }
    
    // =================================================================
    // APPLICATION INITIALIZATION
    // =================================================================
    
    /**
     * Initialize the application
     * Checks authentication, sets up event listeners, and configures features
     */
    async initApp() {
        try {
            await this.checkAuthStatus();
            this.initEventListeners();
            this.initDragAndDrop();
            this.checkKarakeepStatus();
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showAuthOverlay();
        }
    }
    
    // =================================================================
    // AUTHENTICATION METHODS
    // =================================================================
    
    /**
     * Check if user is authenticated and restore session
     */
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showMainApp();
                this.updateUserInfo();
                this.loadSavedEpubs();
                console.log('✅ User authenticated:', this.currentUser.username);
            } else {
                this.showAuthOverlay();
            }
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            this.showAuthOverlay();
        }
    }
    
    /**
     * Show authentication overlay
     */
    showAuthOverlay() {
        this.authOverlay.style.display = 'flex';
        this.mainContainer.style.display = 'none';
    }
    
    /**
     * Show main application
     */
    showMainApp() {
        this.authOverlay.style.display = 'none';
        this.mainContainer.style.display = 'block';
    }
    
    /**
     * Update user information in UI
     */
    updateUserInfo() {
        if (this.currentUser) {
            this.currentUserSpan.textContent = this.currentUser.username;
            this.themeSelector.value = this.currentUser.theme || 'light';
            this.applyTheme(this.currentUser.theme || 'light');
        }
    }
    
    /**
     * Apply theme to the document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    // =================================================================
    // EVENT LISTENERS SETUP
    // =================================================================
    
    /**
     * Initialize all event listeners for the application
     */
    initEventListeners() {
        // Authentication Events
        this.authForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.themeSelector.addEventListener('change', (e) => this.handleThemeChange(e.target.value));
        
        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Single Article Events
        this.convertBtn.addEventListener('click', () => this.handleConvert());
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        this.saveEpubBtn.addEventListener('click', () => this.handleSaveEpub());
        
        // Saved EPUBs Events
        this.refreshEpubsBtn.addEventListener('click', () => this.loadSavedEpubs());
        
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleConvert();
            }
        });
        
        this.urlInput.addEventListener('input', () => {
            this.clearError();
        });
        
        // Collection Events
        this.addArticleBtn.addEventListener('click', () => this.handleAddArticle());
        this.downloadCollectionBtn.addEventListener('click', () => this.handleDownloadCollection());
        this.saveCollectionBtn.addEventListener('click', () => this.handleSaveCollection());
        this.clearAllBtn.addEventListener('click', () => this.handleClearAll());
        
        this.collectionUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddArticle();
            }
        });
        
        this.collectionUrlInput.addEventListener('input', () => {
            this.clearCollectionError();
        });
        
        // Bulk Input Events
        this.bulkInputBtn.addEventListener('click', () => this.toggleBulkInput());
        this.processBulkBtn.addEventListener('click', () => this.handleBulkProcess());
        this.cancelBulkBtn.addEventListener('click', () => this.cancelBulkInput());
        
        // Collection Metadata Events
        this.collectionTitle.addEventListener('input', () => this.updateCollectionTitle());
        this.collectionAuthor.addEventListener('input', () => this.updateCollectionTitle());
        
        // Export Options Events
        this.downloadIndividualBtn.addEventListener('click', () => this.handleDownloadIndividual());
        this.generateCoverBtn.addEventListener('click', () => this.handleGenerateCover());
        
        // Karakeep Events
        this.retryKarakeepBtn.addEventListener('click', () => this.loadKarakeepBookmarks());
        this.selectAllBookmarksBtn.addEventListener('click', () => this.selectAllBookmarks());
        this.selectNoneBookmarksBtn.addEventListener('click', () => this.selectNoneBookmarks());
        this.downloadSelectedBtn.addEventListener('click', () => this.handleDownloadSelected());
        this.bookmarkSearchInput.addEventListener('input', () => this.filterBookmarks());
        this.domainFilter.addEventListener('change', () => this.filterBookmarks());
    }
    
    /**
     * Handle user login
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showAuthError('Please enter both username and password');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.showMainApp();
                this.updateUserInfo();
                this.loadSavedEpubs();
                this.clearAuthError();
            } else {
                this.showAuthError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthError('Login failed. Please try again.');
        }
    }
    
    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.currentUser = null;
        this.savedEpubs = [];
        this.showAuthOverlay();
        this.clearAuthError();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
    
    /**
     * Handle theme change
     */
    async handleThemeChange(theme) {
        try {
            const response = await fetch('/api/user/theme', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ theme })
            });
            
            if (response.ok) {
                this.applyTheme(theme);
                this.currentUser.theme = theme;
            } else {
                console.error('Failed to update theme');
            }
        } catch (error) {
            console.error('Theme update error:', error);
        }
    }
    
    /**
     * Show authentication error
     */
    showAuthError(message) {
        this.authError.textContent = message;
    }
    
    /**
     * Clear authentication error
     */
    clearAuthError() {
        this.authError.textContent = '';
    }
    
    // =================================================================
    // ARTICLE EXTRACTION METHODS
    // =================================================================
    
    /**
     * Handle single article conversion
     */
    async handleConvert() {
        const url = this.urlInput.value.trim();
        
        if (!this.validateUrl(url)) {
            this.showError('Please enter a valid URL');
            return;
        }
        
        this.showLoading(true);
        this.clearError();
        
        try {
            const article = await this.extractArticle(url);
            this.currentArticle = article;
            this.showPreview(article);
            console.log('✅ Article extracted:', article.title);
        } catch (error) {
            console.error('❌ Article extraction failed:', error);
            this.showError(`Failed to extract article: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Validate if string is a valid HTTP/HTTPS URL
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    validateUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    async extractArticle(url) {
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ url: url })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const article = await response.json();
            return article;
            
        } catch (error) {
            throw new Error(`Failed to extract article: ${error.message}`);
        }
    }
    
    showPreview(article) {
        this.articlePreview.innerHTML = `
            <h1>${this.escapeHtml(article.title)}</h1>
            <p><strong>Source:</strong> ${this.escapeHtml(article.siteName)}</p>
            ${article.excerpt ? `<p><em>${this.escapeHtml(article.excerpt)}</em></p>` : ''}
            <div>${article.content}</div>
        `;
        
        this.previewSection.style.display = 'block';
    }
    
    async handleDownload() {
        if (!this.currentArticle) return;
        
        try {
            const epub = await this.generateEpub(this.currentArticle);
            this.downloadFile(epub, `${this.sanitizeFilename(this.currentArticle.title)}.epub`);
        } catch (error) {
            this.showError(`Failed to generate EPUB: ${error.message}`);
        }
    }
    
    /**
     * Handle saving EPUB to library
     */
    async handleSaveEpub() {
        if (!this.currentArticle) return;
        
        try {
            const epub = await this.generateEpub(this.currentArticle);
            const epubData = await this.blobToBase64(epub);
            
            const response = await fetch('/api/epubs/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: this.currentArticle.title,
                    description: this.currentArticle.excerpt || '',
                    contents: [{
                        title: this.currentArticle.title,
                        url: this.currentArticle.url,
                        siteName: this.currentArticle.siteName
                    }],
                    epubData: epubData
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('EPUB saved to your library!');
                this.loadSavedEpubs();
            } else {
                throw new Error(result.error || 'Failed to save EPUB');
            }
        } catch (error) {
            console.error('Save EPUB error:', error);
            this.showError(`Failed to save EPUB: ${error.message}`);
        }
    }
    
    /**
     * Convert blob to base64
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // =================================================================
    // EPUB GENERATION METHODS
    // =================================================================
    
    /**
     * Generate EPUB file from article data
     * @param {Object} article - Article object with title, content, etc.
     * @returns {Promise<Blob>} EPUB file as blob
     */
    async generateEpub(article) {
        const zip = new JSZip();
        
        // EPUB mimetype (must be first file, uncompressed)
        zip.file('mimetype', 'application/epub+zip');
        
        const metaInf = zip.folder('META-INF');
        metaInf.file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);
        
        const oebps = zip.folder('OEBPS');
        
        oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:identifier id="BookId">${this.generateUUID()}</dc:identifier>
        <dc:title>${this.escapeHtml(article.title)}</dc:title>
        <dc:creator>LinkPub</dc:creator>
        <dc:language>en</dc:language>
        <dc:source>${this.escapeHtml(article.siteName)}</dc:source>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="content" href="content.html" media-type="application/xhtml+xml"/>
    </manifest>
    <spine toc="ncx">
        <itemref idref="content"/>
    </spine>
</package>`);
        
        oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="${this.generateUUID()}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>${this.escapeHtml(article.title)}</text>
    </docTitle>
    <navMap>
        <navPoint id="navpoint-1" playOrder="1">
            <navLabel>
                <text>${this.escapeHtml(article.title)}</text>
            </navLabel>
            <content src="content.html"/>
        </navPoint>
    </navMap>
</ncx>`);
        
        oebps.file('content.html', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${this.escapeHtml(article.title)}</title>
    <style>
        body { font-family: serif; line-height: 1.6; margin: 2em; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1em; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(article.title)}</h1>
    <p><em>Source: ${this.escapeHtml(article.siteName)}</em></p>
    ${article.content}
</body>
</html>`);
        
        return await zip.generateAsync({type: 'blob'});
    }
    
    // =================================================================
    // UTILITY METHODS
    // =================================================================
    
    /**
     * Download a blob as a file
     * @param {Blob} blob - File blob to download
     * @param {string} filename - Desired filename
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Sanitize filename for safe file system usage
     * @param {string} filename - Original filename
     * @returns {string} Safe filename
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9\s-_]/gi, '')
            .replace(/\s+/g, '_')
            .toLowerCase()
            .substring(0, 50); // Limit length
    }
    
    /**
     * Generate a UUID v4
     * @returns {string} UUID string
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        if (!text || typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // =================================================================
    // ERROR HANDLING METHODS
    // =================================================================
    
    /**
     * Display error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        console.error('❌ UI Error:', message);
    }
    
    /**
     * Clear displayed error message
     */
    clearError() {
        if (this.errorMessage) {
            this.errorMessage.textContent = '';
        }
    }
    
    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.convertBtn.disabled = show;
        this.previewSection.style.display = show ? 'none' : this.previewSection.style.display;
    }
    
    // Tab Management
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
        
        // Load Karakeep bookmarks if switching to Karakeep tab
        if (tabName === 'karakeep' && this.karakeepEnabled && this.bookmarks.length === 0) {
            this.loadKarakeepBookmarks();
        }
    }
    
    // Collection Management
    async handleAddArticle() {
        const url = this.collectionUrlInput.value.trim();
        
        if (!this.validateUrl(url)) {
            this.showCollectionError('Please enter a valid URL');
            return;
        }
        
        if (this.articles.some(article => article.url === url)) {
            this.showCollectionError('This article is already in the collection');
            return;
        }
        
        this.clearCollectionError();
        this.collectionUrlInput.value = '';
        
        await this.addArticleToCollection(url);
    }
    
    async addArticleToCollection(url) {
        const articleId = this.generateUUID();
        const articleItem = this.createArticleItem(articleId, url, 'Processing...');
        
        try {
            articleItem.classList.add('processing');
            const article = await this.extractArticle(url);
            
            article.id = articleId;
            this.articles.push(article);
            
            this.updateArticleItem(articleId, article);
            articleItem.classList.remove('processing');
            articleItem.classList.add('success');
            
            this.updateCollectionUI();
            
        } catch (error) {
            this.updateArticleItemError(articleId, error.message);
            articleItem.classList.remove('processing');
            articleItem.classList.add('error');
        }
    }
    
    createArticleItem(id, url, title) {
        const item = document.createElement('div');
        item.className = 'article-item';
        item.dataset.id = id;
        
        item.innerHTML = `
            <div class="drag-handle">⋮⋮</div>
            <div class="article-info">
                <div class="article-title">${this.escapeHtml(title)}</div>
                <div class="article-url">${this.escapeHtml(url)}</div>
            </div>
            <div class="article-actions">
                <button class="article-btn edit-btn" onclick="linkPub.editArticleTitle('${id}')">Edit</button>
                <button class="article-btn remove-btn" onclick="linkPub.removeArticle('${id}')">Remove</button>
            </div>
        `;
        
        this.articlesContainer.appendChild(item);
        document.querySelector('.articles-header').style.display = 'flex';
        
        return item;
    }
    
    updateArticleItem(id, article) {
        const item = this.articlesContainer.querySelector(`[data-id="${id}"]`);
        if (item) {
            const titleEl = item.querySelector('.article-title');
            titleEl.textContent = article.title;
        }
    }
    
    updateArticleItemError(id, error) {
        const item = this.articlesContainer.querySelector(`[data-id="${id}"]`);
        if (item) {
            const titleEl = item.querySelector('.article-title');
            titleEl.textContent = `Error: ${error}`;
        }
    }
    
    removeArticle(id) {
        this.articles = this.articles.filter(article => article.id !== id);
        const item = this.articlesContainer.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.remove();
        }
        this.updateCollectionUI();
    }
    
    editArticleTitle(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) return;
        
        const newTitle = prompt('Edit article title:', article.title);
        if (newTitle && newTitle.trim()) {
            article.title = newTitle.trim();
            this.updateArticleItem(id, article);
        }
    }
    
    // =================================================================
    // COLLECTION MANAGEMENT METHODS
    // =================================================================
    
    /**
     * Update collection UI state based on articles array
     */
    updateCollectionUI() {
        this.articlesCount.textContent = this.articles.length;
        this.downloadCollectionBtn.disabled = this.articles.length === 0;
        this.saveCollectionBtn.disabled = this.articles.length === 0;
        this.exportOptionsBtn.disabled = this.articles.length === 0;
        
        if (this.articles.length === 0) {
            document.querySelector('.articles-header').style.display = 'none';
        }
    }
    
    /**
     * Handle saving collection to library
     */
    async handleSaveCollection() {
        if (this.articles.length === 0) return;
        
        try {
            const title = this.collectionTitle.value.trim() || 'Article Collection';
            const author = this.collectionAuthor.value.trim() || 'LinkPub';
            
            const epub = await this.generateCollectionEpub(this.articles, title, author);
            const epubData = await this.blobToBase64(epub);
            
            const response = await fetch('/api/epubs/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: title,
                    description: this.generateCollectionDescription(this.articles),
                    contents: this.articles.map(article => ({
                        title: article.title,
                        url: article.url,
                        siteName: article.siteName
                    })),
                    epubData: epubData
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Collection saved to your library!');
                this.loadSavedEpubs();
            } else {
                throw new Error(result.error || 'Failed to save collection');
            }
        } catch (error) {
            console.error('Save collection error:', error);
            this.showCollectionError(`Failed to save collection: ${error.message}`);
        }
    }
    
    // =================================================================
    // EPUB LIBRARY MANAGEMENT
    // =================================================================
    
    /**
     * Load saved EPUBs from server
     */
    async loadSavedEpubs() {
        try {
            const response = await fetch('/api/epubs', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.savedEpubs = data.epubs || [];
                this.renderSavedEpubs();
            } else {
                console.error('Failed to load saved EPUBs');
            }
        } catch (error) {
            console.error('Load EPUBs error:', error);
        }
    }
    
    /**
     * Render saved EPUBs in the UI
     */
    renderSavedEpubs() {
        if (this.savedEpubs.length === 0) {
            this.epubsGrid.innerHTML = '<div class="no-epubs-message">No saved EPUBs yet. Start by converting some articles!</div>';
            return;
        }
        
        this.epubsGrid.innerHTML = '';
        
        this.savedEpubs.forEach(epub => {
            const card = this.createEpubCard(epub);
            this.epubsGrid.appendChild(card);
        });
    }
    
    /**
     * Create EPUB card element
     */
    createEpubCard(epub) {
        const card = document.createElement('div');
        card.className = 'epub-card';
        
        const createdDate = new Date(epub.createdAt).toLocaleDateString();
        const fileSize = this.formatFileSize(epub.size);
        
        // Show description if it's a collection with multiple articles
        const descriptionHtml = epub.contents && epub.contents.length > 1 && epub.description 
            ? `<div class="epub-description" title="${this.escapeHtml(epub.description)}">${this.escapeHtml(epub.description.substring(0, 150))}${epub.description.length > 150 ? '...' : ''}</div>`
            : '';
        
        card.innerHTML = `
            <div class="epub-title">${this.escapeHtml(epub.title)}</div>
            <div class="epub-meta">
                <div>Created: ${createdDate}</div>
                <div>Size: ${fileSize}</div>
                ${epub.contents && epub.contents.length > 1 ? `<div>${epub.contents.length} articles</div>` : ''}
            </div>
            ${descriptionHtml}
            <div class="epub-actions">
                <button class="epub-download-btn" onclick="linkPub.downloadSavedEpub('${epub.filename}', '${this.escapeHtml(epub.title)}')">Download</button>
                <button class="epub-delete-btn" onclick="linkPub.deleteSavedEpub('${epub.filename}')">Delete</button>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Download saved EPUB
     */
    async downloadSavedEpub(filename, title) {
        try {
            const response = await fetch(`/api/epubs/${filename}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const blob = await response.blob();
                this.downloadFile(blob, filename);
            } else {
                alert('Failed to download EPUB');
            }
        } catch (error) {
            console.error('Download EPUB error:', error);
            alert('Failed to download EPUB');
        }
    }
    
    /**
     * Delete saved EPUB
     */
    async deleteSavedEpub(filename) {
        if (!confirm('Are you sure you want to delete this EPUB?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/epubs/${filename}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.loadSavedEpubs();
            } else {
                alert('Failed to delete EPUB');
            }
        } catch (error) {
            console.error('Delete EPUB error:', error);
            alert('Failed to delete EPUB');
        }
    }
    
    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Generate a description for collections that lists all article titles
     */
    generateCollectionDescription(articles) {
        if (articles.length === 0) return 'Empty collection';
        if (articles.length === 1) return articles[0].title;
        
        const titles = articles.map((article, index) => `${index + 1}. ${article.title}`);
        return `This collection contains ${articles.length} articles:\n\n${titles.join('\n')}`;
    }
    
    handleClearAll() {
        if (this.articles.length === 0) return;
        
        if (confirm('Are you sure you want to remove all articles?')) {
            this.articles = [];
            this.articlesContainer.innerHTML = '';
            this.updateCollectionUI();
        }
    }
    
    // Bulk Processing
    toggleBulkInput() {
        const textarea = this.bulkUrlInput;
        const actions = document.querySelector('.bulk-actions');
        const isVisible = textarea.style.display !== 'none';
        
        textarea.style.display = isVisible ? 'none' : 'block';
        actions.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
            textarea.focus();
        }
    }
    
    cancelBulkInput() {
        this.bulkUrlInput.style.display = 'none';
        document.querySelector('.bulk-actions').style.display = 'none';
        this.bulkUrlInput.value = '';
    }
    
    async handleBulkProcess() {
        const urls = this.bulkUrlInput.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url && this.validateUrl(url))
            .filter(url => !this.articles.some(article => article.url === url));
            
        if (urls.length === 0) {
            this.showCollectionError('No valid URLs found');
            return;
        }
        
        this.cancelBulkInput();
        await this.processBulkUrls(urls);
    }
    
    async processBulkUrls(urls) {
        this.showCollectionLoading(true);
        this.updateProgress(0, urls.length);
        
        for (let i = 0; i < urls.length; i++) {
            this.loadingText.textContent = `Processing article ${i + 1} of ${urls.length}...`;
            this.updateProgress(i, urls.length);
            
            await this.addArticleToCollection(urls[i]);
            
            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.updateProgress(urls.length, urls.length);
        this.showCollectionLoading(false);
    }
    
    showCollectionLoading(show) {
        this.collectionLoading.style.display = show ? 'block' : 'none';
        this.addArticleBtn.disabled = show;
    }
    
    updateProgress(current, total) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        this.progressFill.style.width = percentage + '%';
        this.progressText.textContent = `${current} / ${total}`;
    }
    
    // Collection Download
    async handleDownloadCollection() {
        if (this.articles.length === 0) return;
        
        try {
            const title = this.collectionTitle.value.trim() || 'Article Collection';
            const author = this.collectionAuthor.value.trim() || 'LinkPub';
            
            const epub = await this.generateCollectionEpub(this.articles, title, author);
            this.downloadFile(epub, `${this.sanitizeFilename(title)}.epub`);
        } catch (error) {
            this.showCollectionError(`Failed to generate EPUB: ${error.message}`);
        }
    }
    
    async generateCollectionEpub(articles, title, author) {
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
        
        oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:identifier id="BookId">${this.generateUUID()}</dc:identifier>
        <dc:title>${this.escapeHtml(title)}</dc:title>
        <dc:creator>${this.escapeHtml(author)}</dc:creator>
        <dc:language>en</dc:language>
        <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
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
                <text>${this.escapeHtml(article.title)}</text>
            </navLabel>
            <content src="chapter${index + 1}.html"/>
        </navPoint>`).join('');
        
        oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="${this.generateUUID()}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>${this.escapeHtml(title)}</text>
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
    <title>${this.escapeHtml(article.title)}</title>
    <style>
        body { font-family: serif; line-height: 1.6; margin: 2em; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1em; }
        img { max-width: 100%; height: auto; }
        .chapter-meta { color: #666; font-style: italic; margin-bottom: 2em; border-bottom: 1px solid #eee; padding-bottom: 1em; }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(article.title)}</h1>
    <div class="chapter-meta">
        <p>Source: ${this.escapeHtml(article.siteName)}</p>
        <p>URL: ${this.escapeHtml(article.url)}</p>
    </div>
    ${article.content}
</body>
</html>`);
        });
        
        return await zip.generateAsync({type: 'blob'});
    }
    
    updateCollectionTitle() {
        // This could be used to auto-update UI elements based on collection metadata
    }
    
    // Error Handling
    /**
     * Display collection-specific error message
     * @param {string} message - Error message to display
     */
    showCollectionError(message) {
        if (this.collectionErrorMessage) {
            this.collectionErrorMessage.textContent = message;
        }
        console.error('❌ Collection Error:', message);
    }
    
    /**
     * Clear collection error message
     */
    clearCollectionError() {
        if (this.collectionErrorMessage) {
            this.collectionErrorMessage.textContent = '';
        }
    }
    
    // Drag and Drop
    initDragAndDrop() {
        if (typeof Sortable !== 'undefined') {
            this.sortable = new Sortable(this.articlesContainer, {
                handle: '.drag-handle',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                onEnd: (evt) => {
                    this.reorderArticles(evt.oldIndex, evt.newIndex);
                }
            });
        }
    }
    
    reorderArticles(oldIndex, newIndex) {
        if (oldIndex !== newIndex && this.articles.length > oldIndex && this.articles.length > newIndex) {
            const movedArticle = this.articles.splice(oldIndex, 1)[0];
            this.articles.splice(newIndex, 0, movedArticle);
            console.log(`Moved article from position ${oldIndex} to ${newIndex}`);
        }
    }
    
    // Export Options
    async handleDownloadIndividual() {
        if (this.articles.length === 0) return;
        
        this.showCollectionLoading(true);
        this.loadingText.textContent = 'Generating individual EPUBs...';
        
        try {
            for (let i = 0; i < this.articles.length; i++) {
                const article = this.articles[i];
                this.updateProgress(i, this.articles.length);
                
                const epub = await this.generateEpub(article);
                this.downloadFile(epub, `${this.sanitizeFilename(article.title)}.epub`);
                
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            this.updateProgress(this.articles.length, this.articles.length);
        } catch (error) {
            this.showCollectionError(`Failed to generate individual EPUBs: ${error.message}`);
        } finally {
            this.showCollectionLoading(false);
        }
    }
    
    async handleGenerateCover() {
        if (this.articles.length === 0) return;
        
        try {
            const title = this.collectionTitle.value.trim() || 'Article Collection';
            const author = this.collectionAuthor.value.trim() || 'LinkPub';
            
            const epub = await this.generateCollectionEpubWithCover(this.articles, title, author);
            this.downloadFile(epub, `${this.sanitizeFilename(title)}_with_cover.epub`);
        } catch (error) {
            this.showCollectionError(`Failed to generate EPUB with cover: ${error.message}`);
        }
    }
    
    async generateCollectionEpubWithCover(articles, title, author) {
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
        
        // Generate manifest items
        const manifestItems = [
            `<item id="cover" href="cover.html" media-type="application/xhtml+xml"/>`,
            `<item id="toc-page" href="toc.html" media-type="application/xhtml+xml"/>`,
            ...articles.map((article, index) => 
                `<item id="chapter${index + 1}" href="chapter${index + 1}.html" media-type="application/xhtml+xml"/>`
            )
        ].join('\n        ');
        
        // Generate spine items
        const spineItems = [
            `<itemref idref="cover"/>`,
            `<itemref idref="toc-page"/>`,
            ...articles.map((article, index) => 
                `<itemref idref="chapter${index + 1}"/>`
            )
        ].join('\n        ');
        
        oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:identifier id="BookId">${this.generateUUID()}</dc:identifier>
        <dc:title>${this.escapeHtml(title)}</dc:title>
        <dc:creator>${this.escapeHtml(author)}</dc:creator>
        <dc:language>en</dc:language>
        <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
        <dc:description>Collection of ${articles.length} articles compiled by LinkPub</dc:description>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        ${manifestItems}
    </manifest>
    <spine toc="ncx">
        ${spineItems}
    </spine>
</package>`);
        
        // Generate cover page
        oebps.file('cover.html', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Cover</title>
    <style>
        body { 
            font-family: serif; 
            text-align: center; 
            padding: 4em 2em; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        h1 { 
            font-size: 3em; 
            margin-bottom: 0.5em; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .author { 
            font-size: 1.5em; 
            margin-bottom: 2em; 
            opacity: 0.9;
        }
        .meta { 
            font-size: 1.2em; 
            opacity: 0.8; 
            margin-top: 3em;
        }
        .article-count {
            font-size: 1.1em;
            margin-top: 1em;
            background: rgba(255,255,255,0.2);
            padding: 1em;
            border-radius: 10px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(title)}</h1>
    <div class="author">by ${this.escapeHtml(author)}</div>
    <div class="article-count">${articles.length} Articles</div>
    <div class="meta">
        Generated on ${new Date().toLocaleDateString()}<br/>
        Created with LinkPub
    </div>
</body>
</html>`);
        
        // Generate table of contents page
        const tocItems = articles.map((article, index) => 
            `<li><a href="chapter${index + 1}.html">${this.escapeHtml(article.title)}</a></li>`
        ).join('\n            ');
        
        oebps.file('toc.html', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Table of Contents</title>
    <style>
        body { font-family: serif; line-height: 1.6; margin: 2em; }
        h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 0.5em; }
        ul { list-style: none; padding: 0; }
        li { margin: 1em 0; padding: 0.5em; border-left: 3px solid #667eea; }
        a { text-decoration: none; color: #333; font-size: 1.1em; }
        a:hover { color: #667eea; }
    </style>
</head>
<body>
    <h1>Table of Contents</h1>
    <ul>
        ${tocItems}
    </ul>
</body>
</html>`);
        
        // Generate NCX
        const navPoints = [
            `<navPoint id="navpoint-0" playOrder="1">
                <navLabel><text>Table of Contents</text></navLabel>
                <content src="toc.html"/>
            </navPoint>`,
            ...articles.map((article, index) => `
            <navPoint id="navpoint-${index + 1}" playOrder="${index + 2}">
                <navLabel><text>${this.escapeHtml(article.title)}</text></navLabel>
                <content src="chapter${index + 1}.html"/>
            </navPoint>`)
        ].join('');
        
        oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="${this.generateUUID()}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>${this.escapeHtml(title)}</text>
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
    <title>${this.escapeHtml(article.title)}</title>
    <style>
        body { font-family: serif; line-height: 1.6; margin: 2em; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1em; }
        img { max-width: 100%; height: auto; }
        .chapter-meta { 
            color: #666; 
            font-style: italic; 
            margin-bottom: 2em; 
            border-bottom: 1px solid #eee; 
            padding-bottom: 1em; 
        }
        .chapter-number {
            color: #667eea;
            font-size: 0.9em;
            font-weight: bold;
            margin-bottom: 0.5em;
        }
    </style>
</head>
<body>
    <div class="chapter-number">Chapter ${index + 1}</div>
    <h1>${this.escapeHtml(article.title)}</h1>
    <div class="chapter-meta">
        <p>Source: ${this.escapeHtml(article.siteName)}</p>
        <p>URL: ${this.escapeHtml(article.url)}</p>
        ${article.wordCount ? `<p>Word count: ${article.wordCount} words</p>` : ''}
    </div>
    ${article.content}
</body>
</html>`);
        });
        
        return await zip.generateAsync({type: 'blob'});
    }
    
    // =================================================================
    // KARAKEEP INTEGRATION METHODS
    // =================================================================
    
    /**
     * Check if Karakeep integration is enabled
     */
    async checkKarakeepStatus() {
        try {
            const response = await fetch('/api/karakeep/status', {
                credentials: 'include'
            });
            const data = await response.json();
            this.karakeepEnabled = data.enabled;
            
            if (this.karakeepEnabled) {
                this.karakeepTabBtn.style.display = 'block';
                console.log('Karakeep integration enabled');
            } else {
                console.log('Karakeep integration disabled - check .env configuration');
            }
        } catch (error) {
            console.error('Failed to check Karakeep status:', error);
        }
    }
    
    async loadKarakeepBookmarks() {
        this.showKarakeepLoading(true);
        this.showKarakeepError(false);
        
        try {
            const response = await fetch('/api/karakeep/bookmarks', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.bookmarks = data.bookmarks || [];
            this.filteredBookmarks = [...this.bookmarks];
            
            this.renderBookmarks();
            this.updateDomainFilter();
            this.showKarakeepControls(true);
            
            console.log(`Loaded ${this.bookmarks.length} bookmarks from Karakeep`);
            
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
            this.showKarakeepError(true, error.message);
        } finally {
            this.showKarakeepLoading(false);
        }
    }
    
    renderBookmarks() {
        this.bookmarksGrid.innerHTML = '';
        
        this.filteredBookmarks.forEach(bookmark => {
            const card = this.createBookmarkCard(bookmark);
            this.bookmarksGrid.appendChild(card);
        });
        
        this.updateSelectedCount();
    }
    
    createBookmarkCard(bookmark) {
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        card.dataset.id = bookmark.id;
        
        const isSelected = this.selectedBookmarks.has(bookmark.id);
        if (isSelected) {
            card.classList.add('selected');
        }
        
        const formattedDate = bookmark.created_at ? 
            new Date(bookmark.created_at).toLocaleDateString() : '';
        
        const publishedDate = bookmark.datePublished ? 
            new Date(bookmark.datePublished).toLocaleDateString() : '';
        
        const tags = bookmark.tags && bookmark.tags.length > 0 ? 
            `<div class="bookmark-tags">${bookmark.tags.map(tag => 
                `<span class="bookmark-tag">${this.escapeHtml(tag)}</span>`
            ).join('')}</div>` : '';
        
        const authorInfo = bookmark.author && bookmark.publisher ? 
            `<div class="bookmark-author">by ${this.escapeHtml(bookmark.author)} • ${this.escapeHtml(bookmark.publisher)}</div>` :
            bookmark.author ? `<div class="bookmark-author">by ${this.escapeHtml(bookmark.author)}</div>` :
            bookmark.publisher ? `<div class="bookmark-author">${this.escapeHtml(bookmark.publisher)}</div>` : '';
        
        card.innerHTML = `
            <div class="bookmark-status" style="display: none;"></div>
            <div class="bookmark-header">
                <input type="checkbox" class="bookmark-checkbox" ${isSelected ? 'checked' : ''}>
                <div class="bookmark-content">
                    <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
                    <div class="bookmark-url">${this.escapeHtml(bookmark.url)}</div>
                    ${bookmark.description ? `<div class="bookmark-description">${this.escapeHtml(bookmark.description)}</div>` : ''}
                    ${authorInfo}
                    <div class="bookmark-meta">
                        <span class="bookmark-domain">${this.escapeHtml(bookmark.domain)}</span>
                        ${publishedDate ? `<span class="bookmark-date">Published: ${publishedDate}</span>` : ''}
                        ${formattedDate ? `<span class="bookmark-date">Saved: ${formattedDate}</span>` : ''}
                        ${bookmark.favourited ? `<span class="bookmark-favourite">⭐ Favourited</span>` : ''}
                    </div>
                    ${tags}
                </div>
            </div>
        `;
        
        // Add click event listeners
        card.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                this.toggleBookmarkSelection(bookmark.id);
            }
        });
        
        const checkbox = card.querySelector('.bookmark-checkbox');
        checkbox.addEventListener('change', () => {
            this.toggleBookmarkSelection(bookmark.id);
        });
        
        return card;
    }
    
    toggleBookmarkSelection(bookmarkId) {
        if (this.selectedBookmarks.has(bookmarkId)) {
            this.selectedBookmarks.delete(bookmarkId);
        } else {
            this.selectedBookmarks.add(bookmarkId);
        }
        
        // Update UI
        const card = this.bookmarksGrid.querySelector(`[data-id="${bookmarkId}"]`);
        if (card) {
            const checkbox = card.querySelector('.bookmark-checkbox');
            const isSelected = this.selectedBookmarks.has(bookmarkId);
            
            card.classList.toggle('selected', isSelected);
            checkbox.checked = isSelected;
        }
        
        this.updateSelectedCount();
    }
    
    selectAllBookmarks() {
        this.filteredBookmarks.forEach(bookmark => {
            this.selectedBookmarks.add(bookmark.id);
        });
        this.renderBookmarks();
    }
    
    selectNoneBookmarks() {
        this.selectedBookmarks.clear();
        this.renderBookmarks();
    }
    
    updateSelectedCount() {
        const count = this.selectedBookmarks.size;
        this.selectedBookmarksCount.textContent = count;
        this.downloadSelectedBtn.disabled = count === 0;
    }
    
    filterBookmarks() {
        const searchTerm = this.bookmarkSearchInput.value.toLowerCase();
        const selectedDomain = this.domainFilter.value;
        
        this.filteredBookmarks = this.bookmarks.filter(bookmark => {
            const matchesSearch = !searchTerm || 
                bookmark.title.toLowerCase().includes(searchTerm) ||
                bookmark.url.toLowerCase().includes(searchTerm) ||
                bookmark.description.toLowerCase().includes(searchTerm);
            
            const matchesDomain = !selectedDomain || bookmark.domain === selectedDomain;
            
            return matchesSearch && matchesDomain;
        });
        
        this.renderBookmarks();
    }
    
    updateDomainFilter() {
        const domains = [...new Set(this.bookmarks.map(b => b.domain))].sort();
        
        this.domainFilter.innerHTML = '<option value="">All domains</option>';
        domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain;
            option.textContent = domain;
            this.domainFilter.appendChild(option);
        });
    }
    
    async handleDownloadSelected() {
        if (this.selectedBookmarks.size === 0) return;
        
        const selectedBookmarksList = this.bookmarks.filter(b => 
            this.selectedBookmarks.has(b.id)
        );
        
        const title = this.karakeepCollectionTitle.value.trim() || 
            `Karakeep Collection (${selectedBookmarksList.length} articles)`;
        const author = this.karakeepCollectionAuthor.value.trim() || 'Karakeep';
        
        // Reset all bookmark statuses
        this.resetAllBookmarkStatuses();
        this.showProcessingBookmarks(true);
        
        try {
            const articles = [];
            
            for (let i = 0; i < selectedBookmarksList.length; i++) {
                const bookmark = selectedBookmarksList[i];
                
                // Update progress
                this.updateKarakeepProgress(i, selectedBookmarksList.length);
                this.processingText.textContent = `Processing: ${bookmark.title}`;
                
                // Set bookmark status to processing
                this.updateBookmarkStatus(bookmark.id, 'processing');
                
                try {
                    const article = await this.extractArticle(bookmark.url);
                    article.id = bookmark.id;
                    article.title = bookmark.title; // Use bookmark title
                    articles.push(article);
                    
                    // Mark as successful
                    this.updateBookmarkStatus(bookmark.id, 'success');
                    
                } catch (error) {
                    console.error(`Failed to extract ${bookmark.url}:`, error);
                    
                    // Mark as failed
                    this.updateBookmarkStatus(bookmark.id, 'error');
                    
                    // Continue with other bookmarks
                }
                
                // Small delay to prevent overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.updateKarakeepProgress(selectedBookmarksList.length, selectedBookmarksList.length);
            
            if (articles.length === 0) {
                throw new Error('No articles could be extracted from selected bookmarks');
            }
            
            this.processingText.textContent = 'Generating EPUB...';
            const epub = await this.generateCollectionEpubWithCover(articles, title, author);
            
            // Save to library if user wants
            if (confirm(`EPUB generated with ${articles.length} articles! Would you like to save it to your library?`)) {
                try {
                    const epubData = await this.blobToBase64(epub);
                    
                    const response = await fetch('/api/epubs/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            title: title,
                            description: this.generateCollectionDescription(articles),
                            contents: articles.map(article => ({
                                title: article.title,
                                url: article.url,
                                siteName: article.siteName || 'Unknown'
                            })),
                            epubData: epubData
                        })
                    });
                    
                    if (response.ok) {
                        this.loadSavedEpubs();
                    }
                } catch (saveError) {
                    console.error('Failed to save EPUB:', saveError);
                }
            }
            
            this.downloadFile(epub, `${this.sanitizeFilename(title)}.epub`);
            
            console.log(`Successfully generated EPUB with ${articles.length} articles`);
            
            // Show completion message
            const successCount = articles.length;
            const failCount = selectedBookmarksList.length - successCount;
            
            if (failCount > 0) {
                alert(`EPUB generated! Successfully processed ${successCount} articles. ${failCount} articles failed to extract.`);
            }
            
        } catch (error) {
            console.error('Failed to process selected bookmarks:', error);
            alert(`Failed to generate EPUB: ${error.message}`);
        } finally {
            this.showProcessingBookmarks(false);
            
            // Auto-hide status indicators after 3 seconds
            setTimeout(() => {
                this.resetAllBookmarkStatuses();
            }, 3000);
        }
    }
    
    showKarakeepLoading(show) {
        this.karakeepLoading.style.display = show ? 'block' : 'none';
    }
    
    showKarakeepError(show, message = '') {
        this.karakeepError.style.display = show ? 'block' : 'none';
        if (show && message) {
            this.karakeepError.querySelector('.error-message').textContent = 
                `Failed to load bookmarks: ${message}`;
        }
    }
    
    showKarakeepControls(show) {
        this.bookmarksControls.style.display = show ? 'block' : 'none';
    }
    
    showProcessingBookmarks(show) {
        this.processingBookmarks.style.display = show ? 'block' : 'none';
    }
    
    updateKarakeepProgress(current, total) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        this.karakeepProgressFill.style.width = percentage + '%';
        this.karakeepProgressText.textContent = `${current} / ${total}`;
    }
    
    // Bookmark Status Management
    updateBookmarkStatus(bookmarkId, status, message = '') {
        const card = this.bookmarksGrid.querySelector(`[data-id="${bookmarkId}"]`);
        if (!card) return;
        
        const statusEl = card.querySelector('.bookmark-status');
        
        // Remove all status classes
        card.classList.remove('processing', 'success', 'error');
        statusEl.classList.remove('processing', 'success', 'error');
        
        if (status === 'none') {
            statusEl.style.display = 'none';
            return;
        }
        
        // Add new status
        card.classList.add(status);
        statusEl.classList.add(status);
        statusEl.style.display = 'block';
        
        // Set status text
        switch (status) {
            case 'processing':
                statusEl.textContent = 'Processing...';
                break;
            case 'success':
                statusEl.textContent = 'Done';
                break;
            case 'error':
                statusEl.textContent = 'Failed';
                break;
        }
    }
    
    resetAllBookmarkStatuses() {
        const cards = this.bookmarksGrid.querySelectorAll('.bookmark-card');
        cards.forEach(card => {
            const bookmarkId = card.dataset.id;
            this.updateBookmarkStatus(bookmarkId, 'none');
        });
    }
}

// =================================================================
// APPLICATION BOOTSTRAP
// =================================================================

/**
 * Global LinkPub instance for onclick handlers
 * @type {LinkPub}
 */
let linkPub;

/**
 * Initialize LinkPub when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        linkPub = new LinkPub();
        console.log('✨ LinkPub initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize LinkPub:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
});