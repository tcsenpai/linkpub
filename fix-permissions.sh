#!/bin/bash

# Fix Docker permissions for LinkPub data directory
echo "🔧 Fixing Docker permissions for LinkPub..."

# Create data directory if it doesn't exist
if [ ! -d "./data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p ./data
fi

# Set proper ownership for Docker container (UID 1001)
echo "🔒 Setting ownership to UID 1001 (Docker user)..."
sudo chown -R 1001:1001 ./data

# Set proper permissions
echo "📝 Setting permissions..."
chmod -R 755 ./data

echo "✅ Permissions fixed! You can now restart the container:"
echo "   docker-compose down && docker-compose up -d"