#!/bin/bash

# Tamil Font Verification Script
# Run this script to verify Tamil font installation and system readiness

echo "=========================================="
echo "Tamil Font Verification Script"
echo "=========================================="
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "⚠️  Warning: This script is designed for Ubuntu/Linux systems"
    echo "   Current OS: $OSTYPE"
    echo ""
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check fc-list availability
if ! command_exists fc-list; then
    echo "❌ fc-list not found. Installing fontconfig..."
    sudo apt-get install -y fontconfig
fi

# Check Node.js installation
echo "1. Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi

# Check npm installation
echo ""
echo "2. Checking npm installation..."
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm found: $NPM_VERSION"
else
    echo "❌ npm not found."
    exit 1
fi

# Check Puppeteer installation
echo ""
echo "3. Checking Puppeteer installation..."
if [ -d "node_modules/puppeteer" ]; then
    echo "✅ Puppeteer installed"
else
    echo "⚠️  Puppeteer not found in node_modules"
    echo "   Run: npm install"
fi

# Check for Tamil fonts
echo ""
echo "4. Checking Tamil font installation..."
TAMIL_FONTS=$(fc-list | grep -i tamil | wc -l)

if [ "$TAMIL_FONTS" -gt 0 ]; then
    echo "✅ Found $TAMIL_FONTS Tamil font(s) installed"
    echo ""
    echo "   Installed Tamil fonts:"
    fc-list | grep -i tamil | head -5
else
    echo "❌ No Tamil fonts found!"
    echo ""
    echo "   To fix this, run: ./install-tamil-fonts-ubuntu.sh"
    echo "   or manually install fonts with:"
    echo "   sudo apt-get install fonts-tamil fonts-noto-core fonts-lohit-taml"
fi

# Check specifically for Noto Sans Tamil
echo ""
echo "5. Checking for Noto Sans Tamil (recommended)..."
NOTO_TAMIL=$(fc-list | grep -i "noto.*tamil" | wc -l)

if [ "$NOTO_TAMIL" -gt 0 ]; then
    echo "✅ Noto Sans Tamil found"
    fc-list | grep -i "noto.*tamil" | head -3
else
    echo "⚠️  Noto Sans Tamil not found"
    echo "   Install with: sudo apt-get install fonts-noto-core"
fi

# Check Puppeteer dependencies
echo ""
echo "6. Checking Puppeteer dependencies..."
MISSING_DEPS=()

# Check for common Puppeteer dependencies
if ! dpkg -l | grep -q libgbm1; then
    MISSING_DEPS+=("libgbm1")
fi

if ! dpkg -l | grep -q libnss3; then
    MISSING_DEPS+=("libnss3")
fi

if ! dpkg -l | grep -q libatk1.0-0; then
    MISSING_DEPS+=("libatk1.0-0")
fi

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo "✅ Key Puppeteer dependencies present"
else
    echo "⚠️  Missing Puppeteer dependencies: ${MISSING_DEPS[*]}"
    echo "   Run: ./install-tamil-fonts-ubuntu.sh"
fi

# Check if server.js has been updated
echo ""
echo "7. Checking code updates..."
if grep -q "fonts.googleapis.com/css2?family=Noto+Sans+Tamil" server.js; then
    echo "✅ Google Fonts link present in server.js"
else
    echo "❌ Google Fonts link not found in server.js"
    echo "   Make sure you've applied the latest code changes"
fi

if grep -q "document.fonts.ready" server.js; then
    echo "✅ Font loading wait present in server.js"
else
    echo "⚠️  Font loading wait not found in server.js"
fi

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""

ALL_GOOD=true

if [ "$TAMIL_FONTS" -eq 0 ]; then
    ALL_GOOD=false
    echo "❌ Tamil fonts not installed"
fi

if [ "$NOTO_TAMIL" -eq 0 ]; then
    echo "⚠️  Noto Sans Tamil not installed (recommended)"
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    ALL_GOOD=false
    echo "❌ Missing Puppeteer dependencies"
fi

if [ "$ALL_GOOD" = true ]; then
    echo "✅ System is ready for Tamil PDF generation!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your Node.js server: npm start"
    echo "2. Generate a playlist and export to PDF"
    echo "3. Verify Tamil characters display correctly"
else
    echo ""
    echo "⚠️  System needs configuration"
    echo ""
    echo "To fix issues, run:"
    echo "   chmod +x install-tamil-fonts-ubuntu.sh"
    echo "   ./install-tamil-fonts-ubuntu.sh"
fi

echo ""
echo "=========================================="
