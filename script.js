class LinkPub {
    constructor() {
        // Single Article Elements
        this.urlInput = document.getElementById('urlInput');
        this.convertBtn = document.getElementById('convertBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.loading = document.getElementById('loading');
        this.previewSection = document.getElementById('previewSection');
        this.articlePreview = document.getElementById('articlePreview');
        this.downloadBtn = document.getElementById('downloadBtn');
        
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
        
        // State
        this.currentArticle = null;
        this.articles = [];
        this.currentTab = 'single';
        this.sortable = null;
        
        this.initEventListeners();
        this.initDragAndDrop();
    }
    
    initEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Single Article Events
        this.convertBtn.addEventListener('click', () => this.handleConvert());
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        
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
    }
    
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
        } catch (error) {
            this.showError(`Failed to extract article: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    validateUrl(url) {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    }
    
    async extractArticle(url) {
        try {
            const response = await fetch('/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
    
    async generateEpub(article) {
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
    
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
    }
    
    clearError() {
        this.errorMessage.textContent = '';
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
    
    updateCollectionUI() {
        this.articlesCount.textContent = this.articles.length;
        this.downloadCollectionBtn.disabled = this.articles.length === 0;
        this.exportOptionsBtn.disabled = this.articles.length === 0;
        
        if (this.articles.length === 0) {
            document.querySelector('.articles-header').style.display = 'none';
        }
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
    showCollectionError(message) {
        this.collectionErrorMessage.textContent = message;
    }
    
    clearCollectionError() {
        this.collectionErrorMessage.textContent = '';
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
}

// Make linkPub globally accessible for onclick handlers
let linkPub;

document.addEventListener('DOMContentLoaded', () => {
    linkPub = new LinkPub();
});