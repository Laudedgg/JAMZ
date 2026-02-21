#!/bin/bash

echo "🔍 JAMZ.fun Server Diagnostics"
echo "================================"
echo ""

echo "1️⃣ Checking ports..."
echo "Port 3000:"
lsof -i :3000 || echo "  ❌ Nothing listening on port 3000"
echo ""
echo "Port 3001:"
lsof -i :3001 || echo "  ❌ Nothing listening on port 3001"
echo ""
echo "Port 3002:"
lsof -i :3002 || echo "  ❌ Nothing listening on port 3002"
echo ""

echo "2️⃣ Checking Node processes..."
ps aux | grep node | grep -v grep | grep -E "(vite|server\.js)" || echo "  ❌ No JAMZ node processes running"
echo ""

echo "3️⃣ Testing connectivity..."
echo "Testing localhost:3000..."
curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:3000 || echo "  ❌ Cannot connect"
echo "Testing localhost:3001..."
curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:3001/api/health || echo "  ❌ Cannot connect"
echo "Testing localhost:3002..."
curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:3002 || echo "  ❌ Cannot connect"
echo ""

echo "4️⃣ Checking for crashes in system log (last 5 min)..."
log show --predicate 'process == "node"' --last 5m --info 2>/dev/null | grep -i "kill\|crash\|signal\|term" | tail -5 || echo "  ℹ️  No crash logs found"
echo ""

echo "5️⃣ Checking if something is killing processes..."
ps aux | grep -i "kill\|monitor" | grep -v grep | head -5 || echo "  ℹ️  No suspicious processes found"
echo ""

echo "================================"
echo "✅ Diagnostics complete"

