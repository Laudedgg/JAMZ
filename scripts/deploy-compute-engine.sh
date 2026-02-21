#!/bin/bash

# Deployment script for jamz.fun to Google Cloud Compute Engine instance "allround"
# This script deploys from GitHub repository to the running instance

set -e

# Configuration
INSTANCE_NAME="stayon"
ZONE="us-central1-c"
GITHUB_REPO="https://github.com/bitsportgaming/jamz.fun.git"
GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting deployment to Google Cloud Compute Engine instance: $INSTANCE_NAME"

# Check if gcloud is installed and authenticated
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
    print_error "No project set. Please run: gcloud config set project PROJECT_ID"
    exit 1
fi

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

# Create deployment script to run on the instance
print_status "Creating deployment script..."
cat > /tmp/deploy_jamz.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting jamz.fun deployment on instance..."

# Update system packages
sudo apt-get update

# Install Node.js 20 if not present
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | cut -d'v' -f2)" -lt "18" ]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    sudo apt-get install -y nginx
fi

# Install MongoDB if not present
if ! command -v mongod &> /dev/null; then
    echo "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

# Create application directory
sudo mkdir -p /var/www/jamz.fun
sudo chown $USER:$USER /var/www/jamz.fun
cd /var/www/jamz.fun

# Clone or update repository
if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git fetch origin
    git reset --hard origin/main
else
    echo "Cloning repository..."
    git clone https://github.com/bitsportgaming/jamz.fun.git .
fi

# Install frontend dependencies and build
echo "Building frontend..."
npm ci
npm run build

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --only=production

# Copy frontend build to backend public directory
echo "Copying frontend build..."
mkdir -p public/dist
cp -r ../dist/* public/dist/

# Create production environment file
echo "Creating production environment..."
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/jamz
JWT_SECRET=jamz-production-secret-2025-$(openssl rand -base64 32)
MAGIC_SECRET_KEY=sk_live_placeholder_replace_with_real_key
ENVEOF

# Stop existing PM2 processes
pm2 stop jamz-backend || true
pm2 delete jamz-backend || true

# Start the backend with PM2
echo "Starting backend with PM2..."
pm2 start server.js --name jamz-backend --env production

# Save PM2 configuration
pm2 save
pm2 startup | grep -E '^sudo' | bash || true

echo "✅ Application deployed successfully!"
EOF

# Copy and execute the deployment script on the instance
print_status "Copying deployment script to instance..."
gcloud compute scp /tmp/deploy_jamz.sh $INSTANCE_NAME:/tmp/deploy_jamz.sh --zone=$ZONE

print_status "Executing deployment on instance..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="chmod +x /tmp/deploy_jamz.sh && /tmp/deploy_jamz.sh"

# Configure nginx
print_status "Configuring nginx..."
cat > /tmp/nginx_jamz.conf << 'EOF'
server {
    listen 80;
    server_name jamz.fun www.jamz.fun;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jamz.fun www.jamz.fun;

    # SSL configuration (you'll need to add your SSL certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;

    # For now, we'll serve HTTP only
    listen 80;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Copy nginx configuration
gcloud compute scp /tmp/nginx_jamz.conf $INSTANCE_NAME:/tmp/nginx_jamz.conf --zone=$ZONE

# Configure nginx on the instance
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    sudo cp /tmp/nginx_jamz.conf /etc/nginx/sites-available/jamz.fun
    sudo ln -sf /etc/nginx/sites-available/jamz.fun /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
"

# Get instance external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

print_success "Deployment completed successfully!"
echo ""
echo "🎉 jamz.fun has been deployed to Google Cloud Compute Engine!"
echo ""
echo "📍 Instance: $INSTANCE_NAME"
echo "📍 External IP: $EXTERNAL_IP"
echo "📍 Domain: https://$DOMAIN (if DNS is configured)"
echo ""
echo "🔧 Next steps:"
echo "   1. Verify DNS points $DOMAIN to $EXTERNAL_IP"
echo "   2. Set up SSL certificate for HTTPS"
echo "   3. Configure production MongoDB connection"
echo "   4. Set up proper environment variables"
echo ""
echo "📊 Useful commands:"
echo "   - SSH to instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "   - View logs: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='pm2 logs jamz-backend'"
echo "   - Restart app: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='pm2 restart jamz-backend'"
echo ""

# Clean up temporary files
rm -f /tmp/deploy_jamz.sh /tmp/nginx_jamz.conf

print_success "Deployment script completed!"
