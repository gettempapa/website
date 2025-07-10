#!/bin/bash

echo "🚀 STARTING ULTIMATE MIND-BLOWING WATER SIMULATION"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ index.html not found. Please run this script from the project directory."
    exit 1
fi

# Start the server
echo "🌐 Starting development server..."
echo "📱 Open your browser to: http://localhost:8000"
echo "🎮 Use mouse to interact with the water!"
echo ""

# Try different server options
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
elif command -v npx &> /dev/null; then
    npx live-server --port=8000
else
    echo "❌ No suitable server found. Please install Python or Node.js."
    exit 1
fi
