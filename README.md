# Julian Lohnes - Personal Website

A stunning, interactive personal website featuring **advanced water physics simulation** with Three.js, realistic liquid dynamics, and a beautiful terminal interface.

## 🌊 Advanced Water Simulation

### Realistic Liquid Physics
- **Three.js-powered** 3D water surface with 128x128 resolution
- **Simplex noise algorithms** for natural wave patterns
- **Multi-layered noise** combining different frequencies for realistic water movement
- **Real-time physics** with tension, damping, and neighbor averaging
- **Mouse interaction** creating realistic ripples and splashes

### Visual Effects
- **Fresnel reflection** for realistic water surface lighting
- **Depth-based coloring** with underwater caustics
- **Sparkle effects** simulating light refraction
- **Dynamic lighting** with multiple colored point lights
- **Fog effects** for atmospheric depth
- **Tone mapping** for cinematic quality

### Interactive Features
- **Mouse movement** creates gentle ripples
- **Mouse clicks** generate splash effects
- **Real-time raycasting** for precise water surface interaction
- **Smooth animation** with GSAP easing
- **Responsive design** adapting to window resizing

## 🎮 Terminal Interface

### Interactive Elements
- **Keyboard navigation** using arrow keys
- **Hover effects** with scaling and glow
- **Smooth transitions** between sections
- **Focus indicators** for accessibility

### Visual Design
- **Retro terminal aesthetic** with modern polish
- **Anime-inspired mountain background** with floating animation
- **Gradient animations** and subtle effects
- **Professional typography** using Orbitron and Share Tech Mono

## 🛠️ Technical Stack

### Core Technologies
- **Three.js r158** - Advanced 3D graphics and physics
- **GSAP 3.12.2** - Smooth animations and easing
- **WebGL** - Hardware-accelerated rendering
- **GLSL Shaders** - Custom water physics and lighting

### Libraries & Dependencies
- **Three.js** - 3D graphics engine
- **GSAP** - Animation library
- **Simplex Noise** - Procedural noise generation
- **WebGL Fluid Simulation** - Advanced fluid dynamics

### Performance Features
- **Hardware acceleration** with WebGL
- **Optimized shaders** for smooth 60fps
- **Efficient memory management**
- **Responsive design** for all devices

## 🚀 Installation

### Quick Start (CDN Version)
1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. The water simulation will load automatically

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Requirements
- **Modern browser** with WebGL support
- **Node.js 16+** (for development)
- **Hardware acceleration** recommended for best performance

## 🎯 Features

### Navigation
- **Arrow Keys**: Navigate between sections
- **Enter/Space**: Select current section
- **Mouse**: Click and hover interactions

### Sections
1. **About** - Personal introduction
2. **Skills** - Animated skill bars with realistic percentages
3. **Projects** - Project showcase
4. **Contact** - Professional contact information

### Water Physics Controls
- **Mouse Movement**: Creates gentle ripples
- **Mouse Click**: Generates splash effects
- **Automatic Animation**: Continuous wave patterns

## 🎨 Customization

### Water Simulation
- **Wave frequency**: Adjust noise parameters in shaders
- **Water color**: Modify `waterColor` uniform
- **Transparency**: Change `transparency` uniform
- **Lighting**: Customize point light positions and colors

### Terminal Interface
- **Colors**: Edit CSS custom properties
- **Content**: Modify HTML sections
- **Animations**: Adjust CSS keyframes
- **Typography**: Change Google Fonts imports

## 🔧 Advanced Configuration

### Shader Customization
The water simulation uses custom GLSL shaders:
- **Vertex Shader**: Handles wave generation and mouse interaction
- **Fragment Shader**: Manages lighting, reflection, and color

### Performance Tuning
- **Resolution**: Adjust geometry segments (128x128 default)
- **Lighting**: Modify shadow map sizes and light counts
- **Effects**: Enable/disable fog, tone mapping, and post-processing

## 🌟 Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Requirements
- WebGL 2.0 support
- Hardware acceleration
- Modern JavaScript (ES2020+)

## 📱 Mobile Support

- **Responsive design** adapts to all screen sizes
- **Touch interactions** work on mobile devices
- **Performance optimized** for mobile GPUs
- **Progressive enhancement** for older devices

## 🎪 Easter Eggs

- **Mouse interaction** creates unique water patterns
- **Click effects** generate splash animations
- **Dynamic lighting** responds to water movement
- **Camera movement** provides subtle perspective changes

## 🔍 Performance Monitoring

The website includes performance optimizations:
- **Frame rate monitoring** for smooth animation
- **Memory management** for long-running sessions
- **Adaptive quality** based on device capabilities
- **Efficient rendering** with frustum culling

---

*Experience the future of web physics.* 🌊✨ 