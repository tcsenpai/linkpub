# LinkPub - Web Article to EPUB Converter

LinkPub is a comprehensive web application that converts web articles to EPUB format with user authentication, library management, and programmatic API access. It extracts readable content from web pages and packages them into EPUB files for easy reading on e-readers and mobile devices.

## ✨ Features

### Core Functionality
- **Single Article Conversion**: Extract and convert individual web articles to EPUB
- **Collection Builder**: Create custom EPUB collections from multiple articles with drag & drop reordering
- **Karakeep Integration**: Import bookmarks from Karakeep service and convert to EPUBs
- **Bulk Processing**: Process multiple URLs at once with progress tracking

### User Management
- **Authentication System**: Secure user login with session management
- **Personal Libraries**: Save and manage EPUBs in user-specific libraries
- **Theme Support**: Light, Dark, and Sepia themes
- **User Preferences**: Customizable settings and preferences

### Advanced Features
- **URL Tracking**: Optional tracking of converted URLs with toggle control
- **Accurate Page Estimation**: Word count-based page estimation for EPUBs
- **API Access**: RESTful API with API key authentication for programmatic access
- **Docker Support**: Bulletproof containerized deployment with persistent storage

### EPUB Features
- **Rich Metadata**: Customizable titles, authors, and descriptions
- **Table of Contents**: Automatic TOC generation with navigation
- **Cover Pages**: Optional cover page generation for collections
- **URL Listing**: Comprehensive descriptions including source URLs
- **Individual Export**: Export articles individually or as collections

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn (for development)
- Docker & Docker Compose (for containerized deployment)

### Development Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd linkpub
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment (optional):**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start the development server:**
```bash
npm start
```

5. **Access the application:**
   - Open `http://localhost:3000`
   - Default login: `admin` / `changeme` (update in users.json)

### Docker Deployment (Recommended)

1. **Create data directory:**
```bash
mkdir -p data
```

2. **Configure environment:**
```bash
# Create .env file with your settings
echo "SESSION_SECRET=your-secret-key-here" > .env
echo "KARAKEEP_KEY=your-karakeep-api-key" >> .env
echo "KARAKEEP_URL=https://try.karakeep.app/api/v1" >> .env
```

3. **Fix permissions (if needed):**
```bash
# Create data directory and fix permissions
./fix-permissions.sh
```

4. **Start with Docker Compose:**
```bash
docker-compose up -d
```

5. **Check status:**
```bash
docker-compose ps
docker-compose logs linkpub
```

The application will automatically:
- Create required directories (`data/epubs/`)
- Initialize `users.json` from example or create default
- Set up persistent storage for EPUBs and user data

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `SESSION_SECRET` | Session encryption key | Auto-generated |
| `KARAKEEP_KEY` | Karakeep API key | Not set |
| `KARAKEEP_URL` | Karakeep API URL | Not set |

### User Management

**Default User Creation:**
- If `users.json` doesn't exist, a default admin user is created
- Default credentials: `admin` / `changeme`
- Update credentials immediately after first login

**User Configuration:**
Edit `users.json` to add users:
```json
{
  "users": [
    {
      "id": "unique-id",
      "username": "username",
      "password": "password",
      "theme": "light",
      "preferences": {
        "trackUrls": true,
        "defaultAuthor": "LinkPub",
        "autoSave": true
      }
    }
  ]
}
```

## 📚 API Usage

### Authentication
Generate an API key in your user settings, then use it in requests:

```bash
# Header authentication
curl -H "X-API-Key: lp_your_api_key_here" ...

# Query parameter authentication
curl "https://your-instance.com/api/v1/status?apiKey=lp_your_api_key_here"
```

### Generate EPUB from URLs

**Endpoint:** `POST /api/v1/generate-epub`

**Request:**
```json
{
  "urls": [
    "https://example.com/article1",
    "https://example.com/article2"
  ],
  "title": "My Custom Collection",
  "author": "Custom Author",
  "description": "Collection of interesting articles"
}
```

**Response:** EPUB file download

**Example with curl:**
```bash
curl -X POST \
  -H "X-API-Key: lp_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/article"],
    "title": "Test Collection",
    "author": "API User"
  }' \
  -o "collection.epub" \
  "https://your-instance.com/api/v1/generate-epub"
```

**Limits:**
- Maximum 50 URLs per request
- 15-second timeout per URL extraction
- API key required for all requests

### API Status

**Endpoint:** `GET /api/v1/status`

Returns API status, user info, and limits.

## 🐳 Docker

### Container Features
- **Automatic Initialization**: Creates missing directories and files
- **Persistent Storage**: Data survives container restarts
- **Health Checks**: Built-in health monitoring
- **Security**: Runs as non-root user

### File Structure
```
linkpub/
├── data/                    # Persistent data (Docker)
│   ├── epubs/              # User EPUB libraries
│   ├── users.json          # User accounts
│   └── converted_urls.json # URL tracking
├── docker-compose.yml      # Docker configuration
├── Dockerfile             # Container definition
├── users.json.example     # Default user template
└── ...
```

### Docker Commands
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f linkpub

# Restart service
docker-compose restart linkpub

# Update and rebuild
docker-compose pull
docker-compose up -d --build

# Backup data
tar -czf linkpub-backup.tar.gz data/
```

## 🔌 Integrations

### Karakeep
Connect your Karakeep account to import bookmarks:

1. Get your API key from Karakeep
2. Add to `.env`: `KARAKEEP_KEY=your_key` and `KARAKEEP_URL=https://try.karakeep.app/api/v1`
3. Restart the application
4. Use the Karakeep tab to import and convert bookmarks

### n8n Workflow
Use the API with n8n for automated EPUB generation:

1. **HTTP Request Node**: Configure POST to `/api/v1/generate-epub`
2. **Headers**: Add `X-API-Key` with your API key
3. **Body**: JSON with URLs array and metadata
4. **Output**: Save EPUB file or process further

## 🛠️ Development

### Project Structure
```
linkpub/
├── server.js              # Main server application
├── script.js              # Frontend JavaScript
├── style.css              # Styling
├── index.html             # Main HTML page
├── package.json           # Dependencies
└── README.md              # This file
```

### Key Technologies
- **Backend**: Node.js, Express, JSDOM, Readability
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **EPUB**: JSZip for EPUB generation
- **Authentication**: Express sessions
- **Storage**: JSON files (users, URLs, metadata)

### API Endpoints
- `POST /api/extract` - Extract single article
- `GET /api/epubs` - List user's EPUBs
- `POST /api/epubs/save` - Save EPUB to library
- `GET /api/user/converted-urls` - Get URL history
- `POST /api/user/api-key` - Generate API key
- `POST /api/v1/generate-epub` - API EPUB generation
- `GET /api/v1/status` - API status

## 🔒 Security

- **Session Management**: Secure session cookies
- **API Keys**: Cryptographically secure API keys
- **Input Validation**: URL and data validation
- **Rate Limiting**: Built-in extraction timeouts
- **Docker Security**: Non-root container execution
- **Git Security**: Comprehensive .gitignore for sensitive files

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Container won't start:**
- Check Docker logs: `docker-compose logs linkpub`
- Verify .env file format
- Ensure data directory has correct permissions

**Permission denied errors:**
- Run the permission fix script: `./fix-permissions.sh`
- Or manually fix: `sudo chown -R 1001:1001 ./data && chmod -R 755 ./data`
- Restart container: `docker-compose down && docker-compose up -d`

**API key not working:**
- Verify key format starts with `lp_`
- Check user preferences in users.json
- Regenerate key in user settings

**EPUB generation fails:**
- Check URL accessibility
- Verify content is extractable (not behind paywall)
- Check server logs for specific errors

**Karakeep integration not working:**
- Verify KARAKEEP_KEY and KARAKEEP_URL in .env
- Check Karakeep API status
- Restart application after configuration changes

For more help, please open an issue on GitHub.