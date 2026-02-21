#!/bin/bash

# Kill any existing processes
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Wait a moment
sleep 1

# Start backend
cd backend
node server.js > ../backend-output.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Backend started (PID: $BACKEND_PID)"
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:3001"
else
    echo "❌ Backend failed to start. Check backend-output.log"
    exit 1
fi

# Start frontend
npm run dev > frontend-output.log 2>&1 &
FRONTEND_PID=$!

echo "Frontend started (PID: $FRONTEND_PID)"
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend failed to start. Check frontend-output.log"
    exit 1
fi

echo ""
echo "🎉 Both servers are running!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "To stop servers: pkill -f 'node server.js' && pkill -f vite"

