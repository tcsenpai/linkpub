#!/bin/bash

# LinkPub Run Script
# Starts the application with latest build

echo "🚀 Starting LinkPub with fresh build..."

# Create data directory and fix permissions if needed
if [ ! -d "./data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p ./data/epubs
    
    # Set ownership if we can (ignore errors if not root/sudo)
    if command -v sudo >/dev/null && sudo -n true 2>/dev/null; then
        echo "🔒 Setting permissions..."
        sudo chown -R 1001:1001 ./data 2>/dev/null || true
    fi
    
    chmod -R 755 ./data 2>/dev/null || true
fi

echo "🔨 Building and starting containers..."
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ LinkPub started successfully!"
    echo "📡 Access the application at: http://localhost:3000"
    echo "📊 To view logs: docker compose logs -f linkpub"
    echo "⚙️  For first-time setup, follow the web interface"
    echo "🛑 To stop: ./stop.sh"
    echo ""
    echo "💡 If you encounter permission issues, run: ./fix-permissions.sh"
else
    echo "❌ Failed to start LinkPub"
    exit 1
fi