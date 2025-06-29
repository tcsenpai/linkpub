#!/bin/bash

# Fix Docker permissions for LinkPub data directory
echo "🔧 Fixing Docker permissions for LinkPub..."

# Create data directory structure if it doesn't exist
if [ ! -d "./data" ]; then
    echo "📁 Creating data directory structure..."
    mkdir -p ./data/epubs
fi

# Create subdirectories
mkdir -p ./data/epubs

# Set proper ownership for Docker container (UID 1001)
echo "🔒 Setting ownership to UID 1001:1001 (Docker user)..."
sudo chown -R 1001:1001 ./data

# Set proper permissions recursively
echo "📝 Setting permissions (755 for directories, 644 for files)..."
find ./data -type d -exec chmod 755 {} \;
find ./data -type f -exec chmod 644 {} \;

# Ensure data directory itself has correct permissions
chmod 755 ./data

echo "✅ Permissions fixed!"
echo "   Data directory: $(ls -la ./data)"
echo "   You can now restart the container:"
echo "   ./restart.sh"