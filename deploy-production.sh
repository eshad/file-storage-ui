#!/bin/bash

# Production Deployment Script for Storage Server
# This script sets up a complete production environment

set -e

echo "🚀 Storage Server Production Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Configuration
DOMAIN=""
EMAIL=""
APP_DIR=$(pwd)
NGINX_CONF="/etc/nginx/sites-available/storage-server"
NGINX_ENABLED="/etc/nginx/sites-enabled/storage-server"

# Get domain and email
read -p "Enter your domain name (e.g., example.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
    print_error "Domain and email are required"
    exit 1
fi

print_step "1. Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "nginx is not installed. Installing nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    print_warning "certbot is not installed. Installing certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

print_step "2. Installing dependencies..."

# Install production dependencies
print_status "Installing Node.js dependencies..."
npm install --production

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

print_step "3. Setting up application directories..."

# Create necessary directories
print_status "Creating application directories..."
mkdir -p uploads logs
chmod 755 uploads
chmod 755 logs

# Create .env file if it doesn't exist
if [[ ! -f .env ]]; then
    print_status "Creating .env file..."
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
EOF
fi

print_step "4. Setting up nginx configuration..."

# Update nginx configuration with domain
print_status "Creating nginx configuration..."
sudo cp nginx-production.conf $NGINX_CONF

# Replace domain placeholder
sudo sed -i "s/your-domain.com/$DOMAIN/g" $NGINX_CONF

# Enable the site
if [[ -L $NGINX_ENABLED ]]; then
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

print_step "5. Setting up SSL certificate..."

# Get SSL certificate
print_status "Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

print_step "6. Setting up PM2 process manager..."

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'storage-server',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s',
    env_file: '.env',
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
};
EOF

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

print_step "7. Starting services..."

# Reload nginx
print_status "Reloading nginx..."
sudo systemctl reload nginx

# Check if services are running
if pm2 list | grep -q "storage-server.*online"; then
    print_status "Storage server is running with PM2"
else
    print_error "Storage server failed to start"
    pm2 logs storage-server
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx failed to start"
    sudo systemctl status nginx
    exit 1
fi

print_step "8. Setting up firewall..."

# Configure UFW firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

print_step "9. Setting up automatic SSL renewal..."

# Create SSL renewal script
sudo tee /etc/cron.d/ssl-renewal << EOF
# SSL Certificate Renewal
0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF

print_status "Deployment completed successfully!"
echo ""
echo "🌐 Your storage server is now available at:"
echo "   https://$DOMAIN"
echo ""
echo "📁 Upload directory: $APP_DIR/uploads"
echo "📊 Logs directory: $APP_DIR/logs"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: pm2 logs storage-server"
echo "   - Restart server: pm2 restart storage-server"
echo "   - Stop server: pm2 stop storage-server"
echo "   - Monitor: pm2 monit"
echo "   - Restart nginx: sudo systemctl restart nginx"
echo "   - Check SSL: sudo certbot certificates"
echo ""
echo "📝 SSL certificate will auto-renew every 60 days"
echo "🔒 Firewall is configured to allow only SSH and HTTPS"
echo ""
echo "✅ Production deployment complete!" 