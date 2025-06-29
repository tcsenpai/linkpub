# 📚 LinkPub v2.0

Transform web articles into your personal EPUB library with authentication, themes, and management features. LinkPub is a modern web application that converts online articles into professionally formatted EPUB files with user accounts, persistent storage, and a clean bookworm-friendly interface.

![LinkPub v2.0](https://img.shields.io/badge/Version-2.0.0-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Authenticated](https://img.shields.io/badge/Features-Authenticated-orange)

## ✨ What's New in v2.0

### 🔐 **User Authentication**
- Secure login system with session management
- Individual user accounts and preferences
- Protected EPUB libraries per user
- Guest access disabled for enhanced security

### 📚 **Personal EPUB Library**
- Save EPUBs directly to your personal library
- View, download, and delete saved EPUBs
- Automatic metadata preservation
- Collection descriptions with article lists
- File size and creation date tracking

### 🎨 **Theme System**
- **Light Theme**: Clean, modern reading experience
- **Dark Theme**: Eye-friendly dark interface
- **Sepia Theme**: Warm, vintage book aesthetic
- Per-user theme preferences saved automatically

### 🖥️ **Redesigned Interface**
- Clean "bookworm" aesthetic (goodbye cyberpunk!)
- Typography-focused design with Crimson Text
- Improved usability and accessibility
- Responsive design for all devices
- Semantic HTML markup

## ✨ Core Features

### 📖 **Single Article Conversion**
- Extract readable content from any web article
- Intelligent content cleaning using Mozilla's Readability
- Generate professional EPUB files with proper metadata
- Preview articles before download or saving
- Save to personal library or download immediately

### 📑 **Collection Mode**
- Create multi-article EPUB collections
- Drag & drop reordering of articles
- Bulk URL processing with progress tracking
- Custom collection titles and author metadata
- Save collections to library with detailed descriptions
- Professional table of contents generation

### 🔖 **Karakeep Integration** *(Optional)*
- Direct integration with your Karakeep bookmarks
- Visual bookmark selection with rich metadata
- Batch processing with real-time status indicators
- Filter bookmarks by domain or search terms
- Option to save Karakeep collections to library

### 🎯 **Library Management**
- Personal EPUB storage per user
- Browse saved EPUBs with metadata
- Download any saved EPUB anytime
- Delete unwanted EPUBs
- Collection descriptions showing included articles

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

### First Login

1. **Check `users.json`** for login credentials
2. **Default setup**: Edit the users.json file to add your credentials
3. **Login** using the authentication form
4. **Select your theme** from the dropdown menu
5. **Start converting articles** to your personal library!

## 👤 User Management

### Setting Up Users

Edit the `users.json` file to add user accounts:

```json
{
  "users": [
    {
      "id": "your_user_id",
      "username": "your_username", 
      "password": "your_password",
      "theme": "light",
      "preferences": {
        "defaultAuthor": "Your Name",
        "autoSave": true
      }
    }
  ]
}
```

### User Features
- **Individual Libraries**: Each user has their own EPUB storage
- **Theme Preferences**: Automatically saved and restored
- **Session Management**: Secure 24-hour sessions
- **Personal Settings**: Customizable preferences per user

## ⚙️ Configuration

### Environment Variables

Create a `.env` file for configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-secret-key-here

# Karakeep Integration (Optional)
KARAKEEP_KEY=your_api_key_here
KARAKEEP_URL=https://try.karakeep.app/api/v1
```

### Karakeep Integration (Optional)

To enable Karakeep bookmark integration:

1. **Get your API key** from [Karakeep](https://karakeep.app)
2. **Add to `.env` file** with your credentials
3. **Restart the server** - the Karakeep tab will automatically appear
4. **Access bookmarks** after logging in

## 📁 File Structure

### Directory Layout
```
linkpub/
├── index.html          # Main application interface
├── style.css           # Clean bookworm theme styles
├── script.js           # Frontend application logic
├── server.js           # Backend API server with auth
├── users.json          # User accounts and preferences
├── package.json        # Dependencies and metadata
├── epubs/              # User EPUB storage (auto-created)
│   ├── user1/          # Individual user directories
│   ├── user2/          # EPUB files + metadata
│   └── ...
├── Dockerfile          # Docker container config
├── docker-compose.yml  # Docker orchestration
├── .env.example        # Environment template
└── README.md           # This file
```

### Data Storage
- **User Data**: `users.json` (JSON file)
- **EPUB Files**: `epubs/{user_id}/` directories
- **Metadata**: Stored alongside EPUBs as JSON files
- **Sessions**: In-memory (resets on server restart)

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express framework
- **express-session** for authentication
- **Mozilla Readability** for content extraction
- **JSDOM** for HTML parsing
- **File system** for EPUB storage
- **dotenv** for environment configuration

### Frontend
- **Vanilla JavaScript** (no framework dependencies)
- **Modern CSS** with custom properties for theming
- **JSZip** for EPUB generation
- **SortableJS** for drag & drop functionality
- **Semantic HTML** for accessibility

### Security Features
- **Session-based authentication**
- **Per-user data isolation**
- **Input validation and sanitization**
- **Secure file handling**
- **XSS protection**

## 🎨 Theme System

### Available Themes

**Light Theme (Default)**
- Clean white background
- Dark text on light surfaces
- Professional appearance

**Dark Theme**
- Dark blue-gray backgrounds
- Light text for reduced eye strain
- Modern dark interface

**Sepia Theme**
- Warm, book-like colors
- Vintage paper aesthetic
- Perfect for reading enthusiasts

### Theme Management
- Themes are automatically saved per user
- Instant switching via dropdown menu
- CSS custom properties for consistent theming
- Accessible color contrasts in all themes

## 📖 API Documentation

### Authentication Endpoints

#### `POST /api/auth/login`
User login
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

#### `POST /api/auth/logout`
User logout (destroys session)

#### `GET /api/auth/me`
Get current user information

### Article Endpoints

#### `POST /api/extract`
Extract article content (requires authentication)
```json
{
  "url": "https://example.com/article"
}
```

### EPUB Library Endpoints

#### `GET /api/epubs`
Get user's saved EPUBs (requires authentication)

#### `POST /api/epubs/save`
Save EPUB to library (requires authentication)
```json
{
  "title": "Article Title",
  "description": "Article description or collection list",
  "contents": [{"title": "...", "url": "...", "siteName": "..."}],
  "epubData": "data:application/epub+zip;base64,..."
}
```

#### `GET /api/epubs/:filename`
Download EPUB from library (requires authentication)

#### `DELETE /api/epubs/:filename`
Delete EPUB from library (requires authentication)

### User Preferences

#### `PUT /api/user/theme`
Update user theme preference (requires authentication)
```json
{
  "theme": "light|dark|sepia"
}
```

### Karakeep Integration

#### `GET /api/karakeep/status`
Check if Karakeep integration is enabled

#### `GET /api/karakeep/bookmarks`
Fetch bookmarks from Karakeep (requires authentication)

## 🔧 Development

### Development Commands

```bash
# Local development
npm start               # Start the server
npm run dev             # Start with development settings

# Docker development  
docker-compose up --build    # Build and start containers
docker-compose logs -f       # View logs
docker-compose down          # Stop services
```

### Adding New Features

1. **Backend changes**: Modify `server.js`
2. **Frontend logic**: Update `script.js`
3. **Styling**: Edit `style.css`
4. **UI elements**: Modify `index.html`
5. **User data**: Update `users.json` structure if needed

### Code Organization

**Frontend (script.js)**
- Organized by feature sections
- Comprehensive error handling
- JSDoc documentation
- Modular class-based structure

**Backend (server.js)**
- RESTful API design
- Authentication middleware
- File-based user management
- Comprehensive logging

**Styling (style.css)**
- CSS custom properties for theming
- Organized by component sections
- Responsive design patterns
- Semantic class naming

## 🐛 Troubleshooting

### Authentication Issues
- **Login Failed**: Check username/password in `users.json`
- **Session Expired**: Sessions last 24 hours, login again
- **Theme Not Saving**: Ensure user is properly authenticated

### EPUB Library Issues
- **Can't Save EPUBs**: Check authentication and file permissions
- **EPUBs Not Loading**: Verify `epubs/` directory exists and is writable
- **Missing EPUBs**: Check user-specific subdirectory

### Article Extraction Issues
- **Extraction Failed**: Some sites block automated access
- **Invalid URL**: Ensure URL is valid HTTP/HTTPS
- **Network Errors**: Check server logs for detailed errors

### Karakeep Integration
- **Tab Not Appearing**: Check `.env` configuration
- **API Errors**: Verify API key and URL are correct
- **No Bookmarks**: Ensure bookmarks exist in Karakeep

### General Issues
- **Server Won't Start**: Check port 3000 is available
- **CORS Errors**: LinkPub includes its own backend
- **Permission Errors**: Ensure write access to project directory

## 🤝 Contributing

Contributions are welcome! Please:

1. **Follow existing code style** and patterns
2. **Test authentication flows** thoroughly
3. **Verify all themes** work correctly
4. **Test EPUB library** functionality
5. **Update documentation** for new features
6. **Ensure responsive design** compatibility

### Development Guidelines
- Use semantic HTML markup
- Follow CSS custom property patterns
- Implement proper error handling
- Add comprehensive logging
- Test with multiple user accounts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- **Mozilla Readability** for excellent content extraction
- **Karakeep** for bookmark management integration
- **Express.js** community for authentication patterns
- **EPUB specification** maintainers
- **Open source community** for foundational libraries

---

**LinkPub v2.0** - Your authenticated personal library for web articles 📚🔐✨