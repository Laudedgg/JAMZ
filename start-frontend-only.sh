#!/bin/bash

echo "🚀 Starting JAMZ Frontend on port 3000..."
echo ""

cd /Users/rnewed/Downloads/JAMZ

# Run Vite with nohup to prevent it from being stopped
nohup npm run dev > /tmp/jamz-frontend.log 2>&1 < /dev/null &

VITE_PID=$!

echo "✅ Frontend started with PID: $VITE_PID"
echo "📝 Logs: /tmp/jamz-frontend.log"
echo ""

# Wait a bit for it to start
sleep 3

# Check if it's running
if ps -p $VITE_PID > /dev/null; then
    echo "✅ Frontend is running!"
    echo "🌐 Open: http://localhost:3000"
    echo ""
    echo "To view logs: tail -f /tmp/jamz-frontend.log"
    echo "To stop: kill $VITE_PID"
else
    echo "❌ Frontend failed to start. Check logs:"
    cat /tmp/jamz-frontend.log
fi

