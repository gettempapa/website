#!/bin/bash

echo "🚀 Setting up Julian Lohnes Website with Advanced Water Simulation"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create dist directory if it doesn't exist
mkdir -p dist

echo "🎉 Setup complete!"
echo ""
echo "To run the website:"
echo "  npm start"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "The website is now ready with advanced water physics!" 