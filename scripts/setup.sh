#!/bin/bash
# Sentio Setup Script
# Automates the setup of the development environment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ███████╗███████╗███╗   ██╗████████╗██╗ ██████╗ "
echo "  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║██╔═══██╗"
echo "  ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██║   ██║"
echo "  ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║   ██║"
echo "  ███████║███████╗██║ ╚████║   ██║   ██║╚██████╔╝"
echo "  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ "
echo -e "${NC}"
echo "AI-Powered Chat Application - Setup Script"
echo "============================================"

# Check dependencies
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓ $1 found${NC}"
    else
        echo -e "${RED}✗ $1 not found. Please install it first.${NC}"
        exit 1
    fi
}

echo ""
echo "Checking dependencies..."
check_command python3
check_command pip3
check_command node
check_command npm
check_command docker
check_command docker-compose

# Setup environment file
echo ""
echo "Setting up configuration..."
if [ ! -f "config/.env" ]; then
    cp config/.env.example config/.env
    echo -e "${YELLOW}⚠ Created config/.env from template. Please fill in your API keys!${NC}"
else
    echo -e "${GREEN}✓ config/.env already exists${NC}"
fi

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend/mobile
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ../..

# Start Docker services
echo ""
echo "Starting Docker services (PostgreSQL + Redis)..."
docker-compose -f config/docker-compose.yml up -d postgres redis
echo -e "${GREEN}✓ Database services started${NC}"

# Wait for PostgreSQL
echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Sentio setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit config/.env with your API keys"
echo "  2. Start backend: cd backend && uvicorn app.main:app --reload"
echo "  3. Start frontend: cd frontend/mobile && npx expo start"
echo "  4. Or run everything: docker-compose -f config/docker-compose.yml up"
echo ""
echo "API Documentation: http://localhost:8000/docs"
echo "WebSocket: ws://localhost:8000/api/chat/ws/{user_id}"
echo ""
