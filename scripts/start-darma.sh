#!/bin/bash

# Darma Platform Startup Script
# Starts all services: contracts, backend, frontend, agents, and sandbox

set -e  # Exit on any error

echo ""
echo "🚀 Starting Darma Platform - Cross-Chain Credit Oracle"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3001
FRONTEND_PORT=3000
AGENT_ADVISOR_PORT=8000
AGENT_AUDITOR_PORT=8001
AGENT_ANALYST_PORT=8002
CONTRACT_NETWORK="sepolia"

# Function to print status
print_status() {
    echo -e "${BLUE}[STATUS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service is ready!"
            return 0
        fi
        print_status "Attempt $attempt/$max_attempts: $service not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service failed to start within expected time"
    return 1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command_exists python; then
    print_error "Python is not installed. Please install Python 3.8+"
    exit 1
fi

if ! command_exists forge; then
    print_warning "Foundry is not installed. Installing..."
    curl -L https://foundry.paradigm.xyz | bash
    $HOME/.foundry/bin/foundryup
    export PATH="$HOME/.foundry/bin:$PATH"
fi

# Check ports
print_status "Checking port availability..."

if ! port_available $BACKEND_PORT; then
    print_error "Port $BACKEND_PORT is already in use (Backend)"
    exit 1
fi

if ! port_available $FRONTEND_PORT; then
    print_error "Port $FRONTEND_PORT is already in use (Frontend)"
    exit 1
fi

# Check environment variables
print_status "Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found. Creating from template..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "Please create backend/.env manually"
fi

if [ -z "$PRIVATE_KEY" ]; then
    print_warning "PRIVATE_KEY environment variable not set"
    print_warning "Some features requiring blockchain interaction may not work"
fi

# Install dependencies
print_status "Installing dependencies..."

# Backend dependencies
print_status "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    print_status "Backend dependencies already installed"
fi
cd ..

# Frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    print_status "Frontend dependencies already installed"
fi
cd ..

# Python agent dependencies
print_status "Installing Python agent dependencies..."
cd agents
if [ ! -d "venv" ]; then
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    print_status "Python dependencies already installed"
    source venv/bin/activate
fi
cd ..

# Build contracts
print_status "Building smart contracts..."
cd contracts
if command_exists forge; then
    forge build
    print_success "Contracts built successfully"
else
    print_warning "Foundry not available, skipping contract build"
fi
cd ..

# Create log directory
mkdir -p logs

# Start services
print_status "Starting Darma services..."

# Function to start service and capture PID
start_service() {
    local name=$1
    local command=$2
    local log_file=$3
    
    print_status "Starting $name..."
    $command > "logs/$log_file" 2>&1 &
    local pid=$!
    echo $pid > "logs/${name}.pid"
    echo $pid
}

# Kill any existing processes
print_status "Cleaning up existing processes..."
pkill -f "npm run dev" || true
pkill -f "python.*credit_advisor" || true
pkill -f "python.*risk_auditor" || true

# Start Backend
print_status "Starting backend server..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo $BACKEND_PID > logs/backend.pid

# Wait for backend to be ready
if wait_for_service "Backend" "http://localhost:$BACKEND_PORT/health"; then
    print_success "Backend started successfully (PID: $BACKEND_PID)"
else
    print_error "Backend failed to start"
    tail -20 logs/backend.log
    exit 1
fi

# Start AI Agents
print_status "Starting AI agents..."

cd agents
source venv/bin/activate

# Start Credit Advisor Agent
print_status "Starting Credit Advisor Agent..."
python credit_advisor.py > ../logs/credit_advisor.log 2>&1 &
ADVISOR_PID=$!
echo $ADVISOR_PID > ../logs/credit_advisor.pid

# Start Risk Auditor Agent
print_status "Starting Risk Auditor Agent..."
python risk_auditor.py > ../logs/risk_auditor.log 2>&1 &
AUDITOR_PID=$!
echo $AUDITOR_PID > ../logs/risk_auditor.pid

# Start Protocol Analyst Agent
print_status "Starting Protocol Analyst Agent..."
python protocol_analyst.py > ../logs/protocol_analyst.log 2>&1 &
ANALYST_PID=$!
echo $ANALYST_PID > ../logs/protocol_analyst.pid

cd ..

# Wait a moment for agents to start
sleep 3

# Start Frontend
print_status "Starting frontend application..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > logs/frontend.pid

# Wait for frontend to be ready
sleep 5

# Display startup information
echo ""
echo "======================================================"
echo -e "${GREEN}🎉 Darma Platform Started Successfully!${NC}"
echo "======================================================"
echo ""
echo -e "${BLUE}🌐 Services Running:${NC}"
echo -e "  Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:     ${GREEN}http://localhost:3001${NC}"
echo -e "  Credit Data: ${GREEN}http://localhost:3001/api/credit-data/{address}${NC}"
echo -e "  Health:      ${GREEN}http://localhost:3001/health${NC}"
echo ""
echo -e "${BLUE}🤖 AI Agents:${NC}"
echo -e "  Credit Advisor: ${GREEN}http://localhost:8000${NC}"
echo -e "  Risk Auditor:   ${GREEN}http://localhost:8001${NC}"
echo -e "  Protocol Analyst: ${GREEN}http://localhost:8002${NC}"
echo ""
echo -e "${BLUE}🔗 Key Endpoints:${NC}"
echo -e "  Real Credit Data:  ${GREEN}/api/credit-data/0xYourAddress${NC}"
echo -e "  Sandbox Simulation: ${GREEN}/api/sandbox/credit-data/0xYourAddress?simulation=ideal${NC}"
echo -e "  Real Protocols:    ${GREEN}/api/execute-real-protocol-actions${NC}"
echo -e "  Enhanced Access:   ${GREEN}/api/enhanced-access/0xYourAddress${NC}"
echo ""
echo -e "${BLUE}🛠 Features Available:${NC}"
echo -e "  ✅ Real MetaMask wallet connection"
echo -e "  ✅ Cross-chain credit scoring (6 EVM chains)"
echo -e "  ✅ Real Aave/Morpho transactions on Sepolia"
echo -e "  ✅ AI agents with MeTTa reasoning"
echo -e "  ✅ P2P undercollateralized lending"
echo -e "  ✅ Real-time credit monitoring"
echo -e "  ✅ Pyth price feed integration"
echo ""
echo -e "${YELLOW}📝 Quick Start:${NC}"
echo -e "  1. Open ${GREEN}http://localhost:3000${NC} in your browser"
echo -e "  2. Connect your MetaMask wallet"
echo -e "  3. View your cross-chain credit score"
echo -e "  4. Chat with AI agents for improvement advice"
echo -e "  5. Execute real Aave/Morpho transactions"
echo -e "  6. Access enhanced lending terms"
echo ""
echo -e "${YELLOW}⚡ Demo Modes:${NC}"
echo -e "  • Real Data: Your actual on-chain activity"
echo -e "  • Ideal Borrower: Perfect credit history simulation"
echo -e "  • Real Protocols: Actual Aave/Morpho transactions"
echo ""
echo -e "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup processes on exit
cleanup() {
    echo ""
    print_status "Shutting down Darma Platform..."
    
    # Read PIDs from files and kill processes
    if [ -f "logs/backend.pid" ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
    fi
    if [ -f "logs/frontend.pid" ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
    fi
    if [ -f "logs/credit_advisor.pid" ]; then
        kill $(cat logs/credit_advisor.pid) 2>/dev/null || true
    fi
    if [ -f "logs/risk_auditor.pid" ]; then
        kill $(cat logs/risk_auditor.pid) 2>/dev/null || true
    fi
    if [ -f "logs/protocol_analyst.pid" ]; then
        kill $(cat logs/protocol_analyst.pid) 2>/dev/null || true
    fi
    
    # Kill any npm processes
    pkill -f "npm run dev" 2>/dev/null || true
    
    print_success "All services stopped. Goodbye!"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup INT TERM

# Wait for processes
wait