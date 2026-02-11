#!/bin/bash

# Tamil Fonts Installation Script for Ubuntu
# This script installs comprehensive Tamil font support for Puppeteer PDF generation

echo "=========================================="
echo "Tamil Fonts Installation for Ubuntu"
echo "=========================================="
echo ""

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install Tamil fonts
echo ""
echo "Installing Tamil fonts..."
sudo apt-get install -y \
    fonts-noto-core \
    fonts-noto-ui-core \
    fonts-noto-extra \
    fonts-noto-unhinted \
    fonts-tamil \
    fonts-lohit-taml \
    fonts-lohit-taml-classical \
    fonts-samyak-taml \
    fonts-tsc-gargi \
    fonts-indic

# Install additional dependencies for Puppeteer
echo ""
echo "Installing Puppeteer dependencies..."
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget

# Refresh font cache
echo ""
echo "Refreshing font cache..."
sudo fc-cache -f -v

# Verify font installation
echo ""
echo "=========================================="
echo "Font Installation Complete!"
echo "=========================================="
echo ""
echo "Verifying Tamil font installation..."
fc-list | grep -i tamil | head -5

echo ""
echo "Checking for Noto Sans Tamil..."
fc-list | grep -i "noto.*tamil"

echo ""
echo "=========================================="
echo "Installation Summary:"
echo "- Tamil fonts installed"
echo "- Puppeteer dependencies installed"
echo "- Font cache refreshed"
echo ""
echo "You may need to restart your Node.js server"
echo "for the changes to take effect."
echo "=========================================="
