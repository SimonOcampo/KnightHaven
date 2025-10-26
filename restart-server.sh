#!/bin/bash
# Restart the KnightHaven server

echo "Stopping any existing server on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No existing server found"

echo "Starting KnightHaven server..."
export DATABASE_URL="file:./prisma/dev.db"
node server.js
