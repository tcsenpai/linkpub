# 📚 LinkPub

Transform web articles into beautiful EPUB books with ease. LinkPub is a modern web application that converts any online article into a properly formatted EPUB file, complete with metadata, table of contents, and professional styling.

![LinkPub Demo](https://img.shields.io/badge/Status-Ready-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green)

## ✨ Features

### 📖 **Single Article Conversion**
- Extract readable content from any web article
- Intelligent content cleaning using Mozilla's Readability
- Generate professional EPUB files with proper metadata
- Preview articles before download
- Support for complex layouts and embedded media

### 📑 **Collection Mode**
- Create multi-article EPUB collections
- Drag & drop reordering of articles
- Bulk URL processing with progress tracking
- Custom collection titles and author metadata
- Professional table of contents generation

### 🔖 **Karakeep Integration** *(Optional)*
- Direct integration with your Karakeep bookmarks
- Visual bookmark selection with rich metadata
- Batch processing with real-time status indicators
- Filter bookmarks by domain or search terms
- Preserve bookmark titles and descriptions

### 🎨 **Export Options**
- Standard EPUB with basic formatting
- Enhanced EPUB with custom cover pages
- Individual article downloads
- Collection EPUBs with professional styling
- Responsive design for all devices

## 🚀 Quick Start

### Prerequisites
- **Option 1**: Node.js 18+ and npm
- **Option 2**: Docker and Docker Compose

### Installation Methods

#### 🐳 **Docker (Recommended)**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd linkpub
   ```

2. **Configure environment (optional)**
   ```bash
   cp .env.example .env
   # Edit .env with your Karakeep credentials if needed
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

#### 📦 **Local Development**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd linkpub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Basic Usage

1. **Single Article**: Enter any article URL and click "Convert to EPUB"
2. **Collection**: Switch to the Collection tab to build multi-article EPUBs
3. **Karakeep**: Configure Karakeep integration to access your bookmarks

## ⚙️ Configuration

### Karakeep Integration (Optional)

To enable Karakeep bookmark integration:

1. **Create `.env` file** (copy from `.env.example`)
   ```env
   KARAKEEP_KEY=your_api_key_here
   KARAKEEP_URL=https://try.karakeep.app/api/v1
   ```

2. **Get your API key** from [Karakeep](https://karakeep.app)

3. **Restart the server** - the Karakeep tab will automatically appear

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express framework
- **Mozilla Readability** for content extraction
- **JSDOM** for HTML parsing
- **dotenv** for environment configuration

### Frontend
- **Vanilla JavaScript** (no framework dependencies)
- **Modern CSS** with flexbox and grid layouts
- **JSZip** for EPUB generation
- **SortableJS** for drag & drop functionality

### Key Libraries
- `@mozilla/readability` - Intelligent article extraction
- `jsdom` - Server-side DOM manipulation
- `jszip` - Client-side EPUB generation
- `express` - Web server framework
- `cors` - Cross-origin resource sharing

## 📖 API Documentation

### Endpoints

#### `POST /extract`
Extract article content from a URL
```json
{
  "url": "https://example.com/article"
}
```

#### `GET /api/karakeep/status`
Check if Karakeep integration is enabled

#### `GET /api/karakeep/bookmarks`
Fetch bookmarks from Karakeep (requires authentication)

## 🎯 How It Works

### Content Extraction Process
1. **URL Fetching**: Server fetches article content with proper headers
2. **Anti-Bot Handling**: Multiple user agents and smart retry logic
3. **Content Parsing**: Mozilla Readability extracts clean article content
4. **Metadata Enrichment**: Automatic title, author, and publication info
5. **EPUB Generation**: Client-side EPUB creation with proper structure

### Error Handling
- **403 Errors**: Automatic retry with different user agents
- **Network Issues**: Graceful degradation with helpful error messages
- **Invalid URLs**: Real-time validation and user feedback
- **Content Extraction**: Fallback strategies for difficult sites

## 🐳 Docker Deployment

### Docker Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f linkpub

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Update and restart
docker-compose pull && docker-compose up -d
```

### Docker Configuration

The Docker setup includes:
- **Multi-stage build** for optimal image size
- **Non-root user** for security
- **Health checks** for reliability
- **Environment configuration** via .env file
- **Automatic restart** on failure

### Environment Variables

```bash
# .env file
NODE_ENV=production
PORT=3000
KARAKEEP_KEY=your_api_key_here
KARAKEEP_URL=https://try.karakeep.app/api/v1
```

## 🔧 Development

### Project Structure
```
linkpub/
├── index.html          # Main application interface
├── style.css           # Cyberpunk-themed stylesheet
├── script.js           # Frontend JavaScript logic
├── server.js           # Backend API server
├── package.json        # Dependencies and scripts
├── Dockerfile          # Docker container configuration
├── docker-compose.yml  # Docker Compose orchestration
├── .dockerignore       # Docker build exclusions
├── .env.example        # Environment configuration template
└── README.md           # This file
```

### Development Commands

#### Local Development
```bash
npm start               # Start the server
npm run dev             # Start with development settings
```

#### Docker Development
```bash
docker-compose up --build    # Build and start with live reload
docker-compose exec linkpub sh  # Shell into container
```

### Adding New Features
1. Backend changes go in `server.js`
2. Frontend logic in `script.js`
3. Styling in `style.css`
4. UI elements in `index.html`
5. Test with Docker: `docker-compose up --build`

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- LinkPub runs its own backend to avoid CORS issues
- Make sure the server is running on port 3000

**Karakeep Integration Not Working**
- Check your `.env` file configuration
- Verify your API key is valid
- Ensure `KARAKEEP_URL` is set to `https://try.karakeep.app/api/v1`

**Article Extraction Failures**
- Some sites block automated access
- Try different articles to verify functionality
- Check server console for detailed error messages

**Performance Issues**
- Large collections may take time to process
- Each article is processed sequentially to avoid overwhelming servers
- Consider smaller batches for better performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines
- Follow existing code style and patterns
- Test with multiple article sources
- Ensure responsive design compatibility
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- **Mozilla Readability** for excellent content extraction
- **Karakeep** for bookmark management integration
- **EPUB specification** maintainers for format documentation
- Open source community for the foundational libraries

---

**LinkPub** - Transform the web into your personal library 📚✨