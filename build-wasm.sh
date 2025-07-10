#!/bin/bash

echo "🔧 Building WebAssembly Fluid Simulation..."

# Check if emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten is not installed. Installing..."
    
    # Install emscripten
    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk
    ./emsdk install latest
    ./emsdk activate latest
    source ./emsdk_env.sh
    cd ..
fi

echo "✅ Emscripten found"

# Compile C++ to WebAssembly
echo "📦 Compiling fluid simulation..."
emcc fluid-simulation.cpp \
    -o fluid-simulation.js \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS='["_main"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MAXIMUM_MEMORY=4GB \
    -s USE_WEBGL2=1 \
    -s FULL_ES3=1 \
    -O3 \
    -flto \
    -fno-exceptions \
    -fno-rtti

echo "✅ WebAssembly compilation complete!"
echo "📁 Generated files:"
echo "   - fluid-simulation.js"
echo "   - fluid-simulation.wasm"

# Copy to web directory
cp fluid-simulation.js fluid-simulation.wasm ./

echo "🎉 WebAssembly fluid simulation ready!" 