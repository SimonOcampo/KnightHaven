#!/bin/bash
# KnightHaven Status Script
# Shows the status of all KnightHaven services

echo "📊 KnightHaven Service Status"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Backend API
echo -e "${BLUE}🔧 Backend API (Port 3001):${NC}"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}  ✅ Running - http://localhost:3001${NC}"
    
    # Show some stats
    echo -e "${BLUE}  📊 Database Stats:${NC}"
    curl -s http://localhost:3001/api/stats | jq '.' 2>/dev/null || curl -s http://localhost:3001/api/stats
else
    echo -e "${RED}  ❌ Not running${NC}"
fi

echo ""

# Check Frontend
echo -e "${BLUE}⚛️  Frontend React App (Port 3000):${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}  ✅ Running - http://localhost:3000${NC}"
else
    echo -e "${RED}  ❌ Not running${NC}"
fi

echo ""

# Check Events Scraper API
echo -e "${BLUE}🐍 Events Scraper API (Port 5001):${NC}"
if curl -s http://localhost:5001/api/events/health > /dev/null; then
    echo -e "${GREEN}  ✅ Running - http://localhost:5001${NC}"
    
    # Show some events stats
    echo -e "${BLUE}  📊 Events Stats:${NC}"
    curl -s http://localhost:5001/api/events | jq '.count' 2>/dev/null || echo "  Unable to get events count"
else
    echo -e "${RED}  ❌ Not running${NC}"
fi

echo ""

# Check Prisma Studio
echo -e "${BLUE}🗄️  Prisma Studio (Port 5555):${NC}"
if curl -s http://localhost:5555 > /dev/null; then
    echo -e "${GREEN}  ✅ Running - http://localhost:5555${NC}"
else
    echo -e "${RED}  ❌ Not running${NC}"
fi

echo ""

# Show current listings
echo -e "${BLUE}🛒 Current Marketplace Listings:${NC}"
LISTINGS=$(curl -s http://localhost:3001/api/listings 2>/dev/null)
if [ $? -eq 0 ] && [ "$LISTINGS" != "[]" ]; then
    echo "$LISTINGS" | jq -r '.[] | "  • \(.title) - $\(.price) (\(.category)) by \(.author.displayName)"' 2>/dev/null || echo "  (Unable to parse listings)"
else
    echo -e "${YELLOW}  No listings found or API not responding${NC}"
fi

echo ""
echo -e "${BLUE}💡 Commands:${NC}"
echo "  • Start all:  ./start-knighthaven.sh"
echo "  • Stop all:   ./stop-knighthaven.sh"
echo "  • Check this: ./status-knighthaven.sh"
