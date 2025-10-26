#!/bin/bash
# KnightHaven Master Startup Script
# Starts all components: Backend API, Frontend React App, and Prisma Studio

echo "🚀 Starting KnightHaven - Complete Application Stack"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    else
        return 0
    fi
}

# Function to kill processes on specific ports
kill_port() {
    echo -e "${YELLOW}🔄 Stopping any existing processes on port $1...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null || echo "No processes found on port $1"
}

# Kill existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
kill_port 3000  # Frontend
kill_port 3001  # Backend API
kill_port 5001  # Events Scraper API
kill_port 5555  # Prisma Studio

# Set environment variables
export DATABASE_URL="file:./prisma/dev.db"

# Start Backend API Server
echo -e "${BLUE}🔧 Starting Backend API Server...${NC}"
if check_port 3001; then
    node server.js &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Backend API running on http://localhost:3001 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Backend API - port 3001 in use${NC}"
    exit 1
fi

# Wait a moment for backend to start
sleep 2

# Start Frontend React App
echo -e "${BLUE}⚛️  Starting Frontend React App...${NC}"
if check_port 3000; then
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Frontend React App running on http://localhost:3000 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Frontend - port 3000 in use${NC}"
    exit 1
fi

# Wait a moment for frontend to start
sleep 3

# Start Events Scraper API
echo -e "${BLUE}🐍 Starting Events Scraper API...${NC}"
if check_port 5001; then
    cd events_tab/backend
    python3 events_api.py &
    EVENTS_PID=$!
    cd ../..
    echo -e "${GREEN}✅ Events Scraper API running on http://localhost:5001 (PID: $EVENTS_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Events Scraper - port 5001 in use${NC}"
    exit 1
fi

# Wait a moment for events scraper to start
sleep 3

# Start Prisma Studio
echo -e "${BLUE}🗄️  Starting Prisma Studio...${NC}"
if check_port 5555; then
    npx prisma studio --port 5555 &
    STUDIO_PID=$!
    echo -e "${GREEN}✅ Prisma Studio running on http://localhost:5555 (PID: $STUDIO_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma Studio port 5555 in use - skipping${NC}"
fi

# Wait for all services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Health check
echo -e "${BLUE}🏥 Performing health checks...${NC}"

# Check Backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API: Healthy${NC}"
else
    echo -e "${RED}❌ Backend API: Unhealthy${NC}"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend App: Healthy${NC}"
else
    echo -e "${RED}❌ Frontend App: Unhealthy${NC}"
fi

# Check Events Scraper API
if curl -s http://localhost:5001/api/events/health > /dev/null; then
    echo -e "${GREEN}✅ Events Scraper API: Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Events Scraper API: Not responding (may still be starting)${NC}"
fi

# Check Prisma Studio
if curl -s http://localhost:5555 > /dev/null; then
    echo -e "${GREEN}✅ Prisma Studio: Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma Studio: Not responding (may still be starting)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 KnightHaven is now running!${NC}"
echo "=================================================="
echo -e "${BLUE}📱 Frontend (React App):${NC}    http://localhost:3000"
echo -e "${BLUE}🔧 Backend API:${NC}             http://localhost:3001"
echo -e "${BLUE}🐍 Events Scraper API:${NC}      http://localhost:5001"
echo -e "${BLUE}🗄️  Database Studio:${NC}        http://localhost:5555"
echo ""
echo -e "${YELLOW}📊 Quick Commands:${NC}"
echo "  • Check status:     ./check-server.sh"
echo "  • View listings:    curl http://localhost:3001/api/listings"
echo "  • Stop all:         ./stop-knighthaven.sh"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping KnightHaven services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $EVENTS_PID 2>/dev/null
    kill $STUDIO_PID 2>/dev/null
    kill_port 3000
    kill_port 3001
    kill_port 5001
    kill_port 5555
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo -e "${BLUE}🔄 Services are running... Press Ctrl+C to stop${NC}"
wait