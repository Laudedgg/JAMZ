#!/bin/bash

# Setup environment variables for jamz.fun production deployment
# This script configures the necessary environment variables for Google Cloud App Engine

set -e

echo "🔧 Setting up environment variables for jamz.fun production deployment..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Prompt for project ID if not set
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    export GOOGLE_CLOUD_PROJECT=$PROJECT_ID
else
    PROJECT_ID=$GOOGLE_CLOUD_PROJECT
fi

echo "📋 Using Google Cloud Project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Prompt for MongoDB URI
echo ""
echo "🗄️  MongoDB Configuration"
echo "Please provide your MongoDB connection string."
echo "For MongoDB Atlas, it should look like:"
echo "mongodb+srv://username:password@cluster.mongodb.net/jamz?retryWrites=true&w=majority"
echo ""
read -p "MongoDB URI: " MONGODB_URI

# Generate a secure JWT secret if not provided
echo ""
echo "🔐 JWT Secret Configuration"
read -p "Enter JWT Secret (leave empty to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT Secret: $JWT_SECRET"
fi

# Prompt for Magic Secret Key
echo ""
echo "🪄 Magic Secret Key Configuration"
echo "Enter your Magic Secret Key (from Magic.link dashboard):"
read -p "Magic Secret Key: " MAGIC_SECRET_KEY

# Set environment variables in App Engine
echo ""
echo "🚀 Setting environment variables in Google Cloud App Engine..."

gcloud app deploy --set-env-vars="MONGODB_URI=$MONGODB_URI,JWT_SECRET=$JWT_SECRET,MAGIC_SECRET_KEY=$MAGIC_SECRET_KEY,NODE_ENV=production" --no-promote --quiet

echo ""
echo "✅ Environment variables configured successfully!"
echo ""
echo "📝 Summary:"
echo "   - MongoDB URI: [CONFIGURED]"
echo "   - JWT Secret: [CONFIGURED]"
echo "   - Magic Secret Key: [CONFIGURED]"
echo "   - Node Environment: production"
echo ""
echo "🎯 Next steps:"
echo "   1. Run the deployment script: ./scripts/deploy.sh"
echo "   2. Configure your custom domain"
echo ""
