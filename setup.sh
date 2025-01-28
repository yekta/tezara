#!/bin/bash
set -e  # Exit on error

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local variable="$2"
    read -p "$prompt: " $variable
}

# Ensure we're in the home directory
cd ~

# Update system packages
echo "Updating system packages..."
sudo apt update

# Install NVM
echo "Installing NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # Load NVM

# Ensure NVM is available in the current session
source "$HOME/.nvm/nvm.sh"

# Install Node.js
echo "Installing Node.js 22..."
nvm install 22

# Remove existing tezara-crawler directory if it exists
if [ -d "tezara-crawler" ]; then
    echo "Removing existing tezara-crawler directory..."
    rm -rf tezara-crawler
fi

# Clone repository
echo "Cloning tezara-crawler repository..."
git clone https://github.com/yekta/tezara-crawler.git
cd tezara-crawler

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Install rclone
echo "Installing rclone..."
sudo -v && curl https://rclone.org/install.sh | sudo bash

# Create rclone config directory if it doesn't exist
mkdir -p ~/.config/rclone

# Prompt for AWS credentials
echo "Please enter your Cloudflare R2 credentials:"
prompt_input "Access Key ID" access_key_id
prompt_input "Secret Access Key" secret_access_key
prompt_input "Endpoint (format: https://<accountid>.r2.cloudflarestorage.com)" endpoint

# Create rclone config file
echo "Configuring rclone..."
cat > ~/.config/rclone/rclone.conf << EOL
[tezara]
type = s3
provider = Cloudflare
access_key_id = $access_key_id
secret_access_key = $secret_access_key
endpoint = $endpoint
acl = private
EOL

# Handle .env file
echo "Please paste your environment variables (press Ctrl+D when done):"
env_content=$(cat)

# Create .env file
echo "$env_content" > .env

# Copy files using rclone
echo "Copying files from S3..."
rclone copy tezara:tezara-crawler .

echo "Setup complete! You can now run the crawler."