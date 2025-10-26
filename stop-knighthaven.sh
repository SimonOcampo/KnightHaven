#!/bin/bash
# KnightHaven Stop Script
# Stops all KnightHaven services

echo "🛑 Stopping KnightHaven Services"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill processes on specific ports
kill_port() {
    echo -e "${YELLOW}🔄 Stopping services on port $1...${NC}"
    PIDS=$(lsof -ti:$1 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo $PIDS | xargs kill -9
        echo -e "${GREEN}✅ Stopped processes on port $1${NC}"
    else
        echo -e "${BLUE}ℹ️  No processes found on port $1${NC}"
    fi
}

# Stop all services
kill_port 3000  # Frontend
kill_port 3001  # Backend API
kill_port 5001  # Events Scraper API
kill_port 5555  # Prisma Studio

# Also kill any processes related to our project
echo -e "${YELLOW}🔄 Stopping any remaining KnightHaven processes...${NC}"
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "python3 events_api.py" 2>/dev/null || true
pkill -f "prisma studio" 2>/dev/null || true

echo -e "${GREEN}✅ All KnightHaven services stopped${NC}"
echo ""
echo -e "${BLUE}💡 To start again, run: ./start-knighthaven.sh${NC}"
