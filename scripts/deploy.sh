#!/bin/bash

# Deployment script for jamz.fun to Google Cloud Compute Engine instance "allround"
# This script deploys from GitHub repository to the running instance

set -e

echo "🚀 Starting deployment of jamz.fun to Google Cloud Compute Engine instance 'allround'..."

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with Google Cloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "All prerequisites met!"

# Get project ID
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$PROJECT_ID" ]; then
        read -p "Enter your Google Cloud Project ID: " PROJECT_ID
        gcloud config set project $PROJECT_ID
    fi
else
    PROJECT_ID=$GOOGLE_CLOUD_PROJECT
fi

print_status "Using Google Cloud Project: $PROJECT_ID"

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com

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

# Deploy to App Engine
print_status "Deploying to Google Cloud App Engine..."
gcloud app deploy --quiet

# Get the deployed URL
APP_URL=$(gcloud app browse --no-launch-browser)

print_success "Deployment completed successfully!"
echo ""
echo "🎉 jamz.fun has been deployed!"
echo ""
echo "📍 Application URL: $APP_URL"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure custom domain (jamz.fun) if not already done"
echo "   2. Set up SSL certificate"
echo "   3. Test all functionality"
echo ""
echo "📊 Useful commands:"
echo "   - View logs: gcloud app logs tail -s default"
echo "   - View app: gcloud app browse"
echo "   - Check status: gcloud app versions list"
echo ""
