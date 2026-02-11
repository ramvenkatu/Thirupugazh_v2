# Tamil Font Display Fix for PDF Generation

## Problem
When deploying the Thirupugazh application on Ubuntu, Tamil text in generated PDFs appears as squares (☐) or question marks (?), even though the UI displays correctly. This happens because:

1. **Puppeteer** (headless Chrome) doesn't have access to Tamil fonts in the Ubuntu environment
2. The fonts are loaded from Google Fonts CDN, but Puppeteer needs time to download and render them
3. System-level Tamil fonts are not installed by default on Ubuntu

## Solution

This fix implements three key improvements:

### 1. Font Loading in PDF Template
- Added Google Fonts preconnect and font stylesheet link to the PDF HTML template
- This ensures Puppeteer can download Tamil fonts from Google Fonts CDN

### 2. Comprehensive Font Fallback Stack
Updated the font-family to include multiple Tamil font options:
```css
font-family: 'Noto Sans Tamil', 'Noto Serif Tamil', 'Lohit Tamil', 
             'TSC_Paranar', 'Tamil Sangam MN', 'Nirmala UI', 
             'Arial Unicode MS', sans-serif;
```

### 3. Font Loading Wait in Puppeteer
Added explicit wait for fonts to load before PDF generation:
```javascript
await page.evaluateHandle('document.fonts.ready');
await page.waitForTimeout(1000);
```

## Installation Steps for Ubuntu

### Quick Install (Recommended)

Run the provided installation script:

```bash
# Make the script executable
chmod +x install-tamil-fonts-ubuntu.sh

# Run the script
./install-tamil-fonts-ubuntu.sh
```

### Manual Installation

If you prefer to install manually:

```bash
# Update package list
sudo apt-get update

# Install Tamil fonts
sudo apt-get install -y \
    fonts-noto-core \
    fonts-noto-ui-core \
    fonts-noto-extra \
    fonts-tamil \
    fonts-lohit-taml \
    fonts-lohit-taml-classical \
    fonts-samyak-taml

# Install Puppeteer dependencies
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
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
    lsb-release \
    wget \
    xdg-utils

# Refresh font cache
sudo fc-cache -f -v
```

### After Installation

1. **Verify Font Installation:**
```bash
# Check if Tamil fonts are installed
fc-list | grep -i tamil

# Specifically check for Noto Sans Tamil
fc-list | grep -i "noto.*tamil"
```

2. **Restart Node.js Server:**
```bash
# Stop your current server (Ctrl+C if running in terminal)

# Restart the server
npm start
# or
node server.js
```

3. **Test PDF Generation:**
   - Generate a new playlist with Tamil text
   - Export to PDF
   - Verify that Tamil characters display correctly (not as squares or question marks)

## Verification

### Expected Output from Font Verification

When running `fc-list | grep -i tamil`, you should see output similar to:
```
/usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf: Noto Sans Tamil:style=Regular
/usr/share/fonts/truetype/noto/NotoSansTamil-Bold.ttf: Noto Sans Tamil:style=Bold
/usr/share/fonts/truetype/lohit-tamil/Lohit-Tamil.ttf: Lohit Tamil:style=Regular
...
```

### Test PDF Content

Generated PDFs should now correctly display:
- Tamil song titles (பாடல் தலைப்புகள்)
- Tamil album names (ஆல்பம் பெயர்கள்)
- Tamil raagam names (ராகம் பெயர்கள்)
- Prayer texts (ப்ரார்த்தனை)
- Function names (விழா பெயர்கள்)
- Host member details

## Troubleshooting

### Issue: Fonts still not displaying
**Solution:** 
1. Verify fonts are installed: `fc-list | grep -i tamil`
2. Clear Puppeteer cache: `rm -rf ~/.cache/puppeteer`
3. Reinstall Puppeteer: `npm uninstall puppeteer && npm install puppeteer`
4. Restart server

### Issue: PDF generation is slow
**Solution:**
The 1-second wait for font loading adds minimal delay but ensures proper rendering. If needed, you can reduce it to 500ms in [server.js](server.js#L1397):
```javascript
await page.waitForTimeout(500); // Reduced from 1000ms
```

### Issue: Only some Tamil characters display
**Solution:**
This indicates partial font coverage. Install additional Tamil fonts:
```bash
sudo apt-get install -y fonts-indic fonts-tsc-gargi
sudo fc-cache -f -v
```

### Issue: Puppeteer fails to launch
**Solution:**
Install missing dependencies:
```bash
sudo apt-get install -y libgbm1 libxshmfence1
```

## Alternative: Docker Deployment

If you're using Docker, add this to your Dockerfile:

```dockerfile
FROM node:18

# Install Tamil fonts and Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    fonts-noto-core \
    fonts-noto-ui-core \
    fonts-tamil \
    fonts-lohit-taml \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    && fc-cache -f -v \
    && rm -rf /var/lib/apt/lists/*

# Rest of your Dockerfile...
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Technical Details

### Why This Happens
1. **Web Browser vs Headless Browser:** Regular browsers have access to system fonts; headless Chrome (Puppeteer) in a minimal Ubuntu environment doesn't
2. **Font Rendering Pipeline:** Puppeteer needs time to download web fonts from CDN and render them
3. **Unicode Fallback:** Without proper fonts, browsers show replacement characters (☐ or �)

### What Changed
1. **server.js Lines 1050-1053:** Added Google Fonts link
2. **server.js Line 1066:** Updated font-family with comprehensive fallback
3. **server.js Lines 1395-1397:** Added font loading wait

### Performance Impact
- **Font download:** ~50-100ms (cached after first PDF)
- **Font loading wait:** 1000ms (ensures reliability)
- **Total added time:** ~1-1.1 seconds per PDF
- **Trade-off:** Worth it for correct Tamil character rendering

## Related Files
- [server.js](server.js) - Main server file with PDF generation
- [install-tamil-fonts-ubuntu.sh](install-tamil-fonts-ubuntu.sh) - Font installation script
- [style.css](style.css) - Main stylesheet (UI fonts)
- [index.html](index.html) - Main HTML file (UI fonts)

## Support
If you continue to experience font issues after following these steps, please check:
1. Node.js version (18 or higher recommended)
2. Puppeteer version (should match package.json)
3. Ubuntu version (20.04 LTS or higher recommended)
4. Available disk space (fonts require ~50MB)
5. Internet connectivity (for Google Fonts CDN)
