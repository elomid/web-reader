#!/bin/bash

# WebReader Extension Build Script
echo "Building WebReader Extension..."

# Remove existing production build
if [ -d "webreader-production-build" ]; then
    echo "Removing existing production build..."
    rm -rf webreader-production-build
fi

# Create production build directory
echo "Creating production build directory..."
mkdir -p webreader-production-build

# Copy main files
echo "Copying main files..."
cp background.js webreader-production-build/
cp content.js webreader-production-build/
cp popup.html webreader-production-build/
cp popup.js webreader-production-build/
cp manifest.json webreader-production-build/

# Copy directories
echo "Copying directories..."
cp -r icons webreader-production-build/
cp -r images webreader-production-build/

# Remove existing zip file
if [ -f "webreader-production-build.zip" ]; then
    echo "Removing existing zip file..."
    rm webreader-production-build.zip
fi

# Create zip file
echo "Creating zip file..."
cd webreader-production-build
zip -r ../webreader-production-build.zip . -x "*.DS_Store"
cd ..

# Display results
echo "Build complete!"
echo "Production build: webreader-production-build/"
echo "Zip file: webreader-production-build.zip"
echo ""
echo "Files included:"
ls -la webreader-production-build/

# Display zip contents
echo ""
echo "Zip contents:"
unzip -l webreader-production-build.zip 