#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Deploying to Production Server      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Configuration
SERVER="ubuntu@54.164.143.46"
KEY="~/Downloads/vibenow.pem"
REMOTE_PATH="/home/ubuntu/jamz.fun"

# Step 1: Build the frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend build successful${NC}"
echo ""

# Step 2: Deploy frontend build
echo -e "${YELLOW}🚀 Deploying frontend build to production...${NC}"
scp -i $KEY -r dist/* $SERVER:$REMOTE_PATH/dist/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend deployed${NC}"
echo ""

# Step 3: Deploy modified backend files (if any)
echo -e "${YELLOW}🔧 Checking for backend changes...${NC}"
if [ -f "backend/services/kickoffService.js" ]; then
    echo -e "${YELLOW}📤 Deploying backend services...${NC}"
    scp -i $KEY backend/services/kickoffService.js $SERVER:$REMOTE_PATH/backend/services/
    echo -e "${GREEN}✅ Backend services deployed${NC}"
else
    echo -e "${BLUE}ℹ️  No backend changes to deploy${NC}"
fi
echo ""

# Step 4: Restart the backend server
echo -e "${YELLOW}🔄 Restarting backend server...${NC}"
ssh -i $KEY $SERVER "pm2 restart jamz-backend"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend restart failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend restarted${NC}"
echo ""

# Step 5: Check server status
echo -e "${YELLOW}🔍 Checking server status...${NC}"
ssh -i $KEY $SERVER "pm2 status jamz-backend"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment Complete! 🎉              ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Production URL: http://54.164.143.46${NC}"
echo ""

