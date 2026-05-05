#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "  Shishu Arogaya - Development Start"
echo "========================================"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Node.js is installed:"
node --version
echo ""

# Check if MongoDB is reachable
echo -e "${YELLOW}[INFO]${NC} Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    mongosh --eval "db.adminCommand('ping')" &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK]${NC} MongoDB is running"
    else
        echo -e "${YELLOW}[WARN]${NC} MongoDB may not be running on localhost:27017"
    fi
else
    echo -e "${YELLOW}[WARN]${NC} mongosh not found, skipping MongoDB check"
fi

echo ""
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start Backend Server
echo -e "${BLUE}Starting Backend Server (Port 5000)...${NC}"
(cd server && npm run dev) &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to be ready
sleep 3

# Start Frontend Client
echo -e "${BLUE}Starting Frontend Client (Port 5175)...${NC}"
(cd client && npm run dev) &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

echo ""
echo -e "${GREEN}========================================"
echo "  Servers Starting..."
echo "========================================${NC}"
echo ""
echo -e "${BLUE}Backend Server:${NC}  http://localhost:5000"
echo -e "${BLUE}Frontend Client:${NC} http://localhost:5175"
echo ""
echo -e "${YELLOW}Demo Credentials:${NC}"
echo "  Parent: parent@sishu.gov.in / Parent@123"
echo "  ASHA:   asha@sishu.gov.in / Asha@123"
echo "  Admin:  admin@sishu.gov.in / Admin@123"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
wait
