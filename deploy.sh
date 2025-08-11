#!/bin/bash

# Storage Server Deployment Script
# This script helps deploy the storage server with nginx

set -e

echo "🚀 Storage Server Deployment Script"
echo "=================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Installing dependencies..."
npm install

print_status "Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

print_status "Setting up nginx configuration..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "nginx is not installed. Installing nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Copy nginx configuration
NGINX_CONF="/etc/nginx/sites-available/storage-server"
NGINX_ENABLED="/etc/nginx/sites-enabled/storage-server"

print_status "Creating nginx configuration..."
sudo cp nginx.conf $NGINX_CONF

# Enable the site
if [ -L $NGINX_ENABLED ]; then
    sudo rm $NGINX_ENABLED
fi
sudo ln -s $NGINX_CONF $NGINX_ENABLED

# Test nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid. Please check the configuration."
    exit 1
fi

# Create systemd service for the Node.js app
print_status "Creating systemd service..."
SERVICE_FILE="/etc/systemd/system/storage-server.service"

sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Storage Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
print_status "Enabling and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable storage-server
sudo systemctl start storage-server
sudo systemctl reload nginx

# Check if services are running
if sudo systemctl is-active --quiet storage-server; then
    print_status "Storage server is running"
else
    print_error "Storage server failed to start"
    sudo systemctl status storage-server
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx failed to start"
    sudo systemctl status nginx
    exit 1
fi

print_status "Deployment completed successfully!"
echo ""
echo "🌐 Your storage server is now available at:"
echo "   http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📁 Upload directory: $(pwd)/uploads"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: sudo journalctl -u storage-server -f"
echo "   - Restart server: sudo systemctl restart storage-server"
echo "   - Restart nginx: sudo systemctl restart nginx"
echo "   - Check status: sudo systemctl status storage-server"
echo ""
echo "📝 For SSL setup, use the nginx-ssl.conf file and configure your domain." 