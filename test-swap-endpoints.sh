#!/bin/bash

# Currency Swap Feature - API Endpoint Testing Script
# This script tests the swap endpoints to verify they're working

echo "🧪 Testing Currency Swap Endpoints"
echo "=================================="
echo ""

# Configuration
API_URL="http://localhost:3001/api"
TOKEN="" # You'll need to add your auth token here

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "Endpoint: $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
        echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    echo ""
}

# Check if jq is installed (for pretty JSON)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Note: Install 'jq' for prettier JSON output${NC}"
    echo ""
fi

# Check if token is set
if [ -z "$TOKEN" ]; then
    echo -e "${RED}⚠️  Warning: No auth token set!${NC}"
    echo "To test authenticated endpoints, add your token to this script:"
    echo "TOKEN=\"your-jwt-token-here\""
    echo ""
    echo "You can get your token by:"
    echo "1. Login to the app"
    echo "2. Open browser DevTools > Application > Local Storage"
    echo "3. Copy the 'token' value"
    echo ""
    read -p "Press Enter to continue with unauthenticated tests..."
    echo ""
fi

echo "📋 Running Tests..."
echo ""

# Test 1: Get Exchange Rates (User endpoint)
test_endpoint "GET" "/wallets/exchange-rates" \
    "Get current exchange rates (user)"

# Test 2: Get Exchange Rates (Admin endpoint)
test_endpoint "GET" "/admin/settings/exchange-rates" \
    "Get exchange rates (admin)"

# Test 3: Execute Swap (requires auth and balance)
echo -e "${YELLOW}Note:${NC} The following test will fail if you don't have sufficient balance"
test_endpoint "POST" "/wallets/swap" \
    "Execute currency swap" \
    '{"fromCurrency":"USDC","toCurrency":"JAMZ","fromAmount":1}'

# Test 4: Update Exchange Rate (admin only)
echo -e "${YELLOW}Note:${NC} This test requires admin privileges"
test_endpoint "PUT" "/admin/settings/exchange-rates/USDC/JAMZ" \
    "Update exchange rate (admin)" \
    '{"rate":100}'

# Test 5: Update Swap Fee (admin only)
echo -e "${YELLOW}Note:${NC} This test requires admin privileges"
test_endpoint "PUT" "/admin/settings/exchange-rates/fee" \
    "Update swap fee percentage (admin)" \
    '{"swapFeePercentage":0.5}'

# Test 6: Get Rate History (admin only)
echo -e "${YELLOW}Note:${NC} This test requires admin privileges"
test_endpoint "GET" "/admin/settings/exchange-rates/history" \
    "Get exchange rate history (admin)"

echo ""
echo "=================================="
echo "✅ Testing Complete!"
echo ""
echo "Next Steps:"
echo "1. Review the responses above"
echo "2. Check for any errors"
echo "3. Test the UI in the browser"
echo "4. See SWAP_TESTING_GUIDE.md for full testing checklist"

