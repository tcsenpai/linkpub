#!/bin/bash

# LinkPub Stop Script
# Stops and removes containers

echo "🛑 Stopping LinkPub..."
echo "Stopping containers..."

# Stop containers
docker compose down

echo "Removing containers..."

# Remove containers
docker compose rm -f

if [ $? -eq 0 ]; then
    echo "✅ LinkPub stopped and containers removed successfully!"
    echo "🚀 To start again: ./run.sh"
    echo "🔄 To restart with fresh build: ./restart.sh"
else
    echo "❌ Error occurred while stopping LinkPub"
    exit 1
fi