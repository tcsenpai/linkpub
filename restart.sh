#!/bin/bash

# LinkPub Restart Script
# Stops, removes containers, and starts with fresh build

echo "🔄 Restarting LinkPub with fresh build..."
echo "Stopping and removing existing containers..."

# Stop containers
docker compose down

# Remove containers (if any)
docker compose rm -f

echo "Building and starting containers..."

# Start with fresh build
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ LinkPub restarted successfully!"
    echo "📡 Access the application at: http://localhost:3000"
    echo "📊 To view logs: docker compose logs -f"
    echo "🛑 To stop: ./stop.sh"
else
    echo "❌ Failed to restart LinkPub"
    exit 1
fi