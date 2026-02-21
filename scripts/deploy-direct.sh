#!/bin/bash

# Direct deployment script for jamz.fun to Google Cloud Compute Engine
# This script builds locally and uploads to the instance

set -e

# Configuration
INSTANCE_NAME="stayon"
ZONE="us-central1-c"
DOMAIN="jamz.fun"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🚀 Starting deployment to jamz.fun (instance: $INSTANCE_NAME)"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK is not installed."
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
print_status "Using Google Cloud Project: $PROJECT_ID"

# Check if instance exists and is running
print_status "Checking instance status..."
INSTANCE_STATUS=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="value(status)" 2>/dev/null || echo "NOT_FOUND")

if [ "$INSTANCE_STATUS" = "NOT_FOUND" ]; then
    print_error "Instance '$INSTANCE_NAME' not found in zone '$ZONE'"
    exit 1
elif [ "$INSTANCE_STATUS" != "RUNNING" ]; then
    print_error "Instance '$INSTANCE_NAME' is not running (status: $INSTANCE_STATUS)"
    exit 1
fi

print_success "Instance '$INSTANCE_NAME' is running"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf backend/public/dist/

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm ci

# Build frontend
print_status "Building frontend..."
npm run build

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --only=production
cd ..

# Copy built frontend to backend public directory
print_status "Copying frontend build to backend..."
mkdir -p backend/public/dist
cp -r dist/* backend/public/dist/

# Create deployment package (COPYFILE_DISABLE prevents macOS ._ metadata files)
print_status "Creating deployment package..."
COPYFILE_DISABLE=1 tar -czf /tmp/jamz-deployment.tar.gz --exclude='backend/.env' backend/

# Upload deployment package to instance
print_status "Uploading deployment package to instance..."
gcloud compute scp /tmp/jamz-deployment.tar.gz $INSTANCE_NAME:/tmp/ --zone=$ZONE

# Deploy on the instance
print_status "Deploying on instance..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    set -e
    echo '📦 Extracting deployment package...'
    sudo mkdir -p /var/www/jamz.fun
    cd /var/www/jamz.fun
    sudo tar -xzf /tmp/jamz-deployment.tar.gz --overwrite --no-same-owner 2>&1 | grep -v 'LIBARCHIVE.xattr' || true
    sudo chown -R \$USER:\$USER /var/www/jamz.fun

    echo '📁 Copying frontend files to web root...'
    cp -r backend/public/dist/* /var/www/jamz.fun/

    echo '🔧 Rebuilding native modules for Linux...'
    cd backend
    npm rebuild

    echo '🔄 Restarting backend with PM2...'
    pm2 stop jamz-backend || true
    pm2 delete jamz-backend || true
    pm2 start server.js --name jamz-backend --env production
    pm2 save

    echo '✅ Deployment complete!'
    pm2 status jamz-backend
"

# Clean up
rm -f /tmp/jamz-deployment.tar.gz

# Get instance external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📍 Instance: $INSTANCE_NAME"
echo "📍 External IP: $EXTERNAL_IP"
echo "📍 Domain: https://$DOMAIN"
echo ""
echo "🔍 Verify deployment:"
echo "   - Visit: https://$DOMAIN/discover"
echo "   - Check logs: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='pm2 logs jamz-backend'"
echo ""

