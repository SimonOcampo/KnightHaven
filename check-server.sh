#!/bin/bash
# Check if KnightHaven server is running

echo "Checking KnightHaven server status..."

if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Server is running on port 3001"
    echo "📊 Current listings:"
    curl -s http://localhost:3001/api/listings | jq '.[] | "• \(.title) - $\(.price) (\(.category))"' 2>/dev/null || curl -s http://localhost:3001/api/listings
else
    echo "❌ Server is not running"
    echo "💡 To start the server, run: ./start-server.sh"
    echo "💡 To restart the server, run: ./restart-server.sh"
fi
