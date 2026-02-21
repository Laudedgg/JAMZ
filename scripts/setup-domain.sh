#!/bin/bash

# Script to set up custom domain (jamz.fun) for Google Cloud App Engine
# This script configures the custom domain and SSL certificate

set -e

echo "🌐 Setting up custom domain jamz.fun for Google Cloud App Engine..."

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

# Check if gcloud is installed and user is authenticated
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK is not installed."
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with Google Cloud. Please run: gcloud auth login"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

print_status "Using Google Cloud Project: $PROJECT_ID"

# Check if App Engine app exists
if ! gcloud app describe &> /dev/null; then
    print_error "No App Engine application found. Please deploy your app first using ./scripts/deploy.sh"
    exit 1
fi

# Add custom domain
print_status "Adding custom domain jamz.fun..."
gcloud app domain-mappings create jamz.fun --certificate-management=AUTOMATIC

print_success "Custom domain jamz.fun has been added!"

# Get the required DNS records
print_status "Getting DNS configuration..."
echo ""
echo "📋 DNS Configuration Required:"
echo "=============================================="
gcloud app domain-mappings describe jamz.fun --format="table(
    id,
    sslSettings.certificateId,
    resourceRecords[].name,
    resourceRecords[].type,
    resourceRecords[].rrdata
)"

echo ""
echo "🔧 DNS Setup Instructions:"
echo "=============================================="
echo "1. Go to your domain registrar's DNS management panel"
echo "2. Add the DNS records shown above"
echo "3. Wait for DNS propagation (can take up to 48 hours)"
echo "4. SSL certificate will be automatically provisioned"
echo ""

# Add www subdomain as well
print_status "Adding www.jamz.fun subdomain..."
gcloud app domain-mappings create www.jamz.fun --certificate-management=AUTOMATIC

print_success "www.jamz.fun subdomain has been added!"

echo ""
echo "✅ Domain setup completed!"
echo ""
echo "📝 Summary:"
echo "   - jamz.fun: Configured"
echo "   - www.jamz.fun: Configured"
echo "   - SSL certificates: Automatic (Google-managed)"
echo ""
echo "⏳ Next steps:"
echo "   1. Configure DNS records with your domain registrar"
echo "   2. Wait for DNS propagation"
echo "   3. Verify SSL certificate provisioning"
echo ""
echo "🔍 Useful commands:"
echo "   - Check domain status: gcloud app domain-mappings list"
echo "   - View SSL certificate: gcloud app ssl-certificates list"
echo "   - Check DNS propagation: dig jamz.fun"
echo ""
