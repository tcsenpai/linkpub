class LinkPub {
    constructor() {
        this.urlInput = document.getElementById('urlInput');
        this.convertBtn = document.getElementById('convertBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.loading = document.getElementById('loading');
        this.previewSection = document.getElementById('previewSection');
        this.articlePreview = document.getElementById('articlePreview');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        this.currentArticle = null;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
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
}

document.addEventListener('DOMContentLoaded', () => {
    new LinkPub();
});