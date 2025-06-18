#!/bin/bash

# Solbot V2 Production Startup Script
echo "🚀 Starting Solbot V2 in Production Mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Set production environment
export NODE_ENV=production

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "web-dashboard/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd web-dashboard && npm install && cd ..
fi

# Build frontend for production
echo "🏗️ Building frontend for production..."
cd web-dashboard && npm run build && cd ..

# Create sessions directory if it doesn't exist
mkdir -p sessions

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Copying from .env.production..."
    cp .env.production .env
fi

# Start the API server in background
echo "🔧 Starting API server on port 12001..."
API_PORT=12001 npm run api:prod &
API_PID=$!

# Wait for API server to start
sleep 5

# Check if API server is running
if curl -s http://localhost:12001/api/health > /dev/null; then
    echo "✅ API server is running successfully"
else
    echo "❌ API server failed to start"
    kill $API_PID 2>/dev/null
    exit 1
fi

# Start the frontend server
echo "🌐 Starting frontend server on port 12000..."
cd web-dashboard && npm run start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if curl -s -I http://localhost:12000 > /dev/null; then
    echo "✅ Frontend server is running successfully"
else
    echo "❌ Frontend server failed to start"
    kill $API_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Solbot V2 is now running in production mode!"
echo ""
echo "📊 Dashboard: http://localhost:12000"
echo "🔗 API: http://localhost:12001/api"
echo "💚 Health Check: http://localhost:12001/api/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Solbot V2..."
    kill $API_PID $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait