// Advanced configuration for ultimate water simulation
window.WATER_CONFIG = {
    // Performance settings
    performance: {
        targetFPS: 60,
        adaptiveQuality: true,
        maxParticles: 10000,
        maxWaves: 256,
        enableRayTracing: true,
        enableVolumetricLighting: true,
        enableCaustics: true,
        enableSubsurfaceScattering: true,
    },
    
    // Physics settings
    physics: {
        fluidDensity: 1000.0,
        surfaceTension: 0.0728,
        viscosity: 0.001,
        gravity: 9.81,
        windForce: { x: 2.0, y: 0.0, z: 1.0 },
        turbulence: 0.1,
        waveSpeed: 1.0,
    },
    
    // Visual settings
    visual: {
        waterColor: [0.2, 0.6, 0.8],
        foamColor: [0.9, 0.95, 1.0],
        transparency: 0.8,
        fresnelPower: 3.0,
        sparkleIntensity: 0.2,
        causticsIntensity: 0.3,
        bloomIntensity: 0.5,
        toneMapping: 'ACES',
    },
    
    // Interaction settings
    interaction: {
        mouseSensitivity: 1.0,
        splashIntensity: 2.0,
        rippleDecay: 0.8,
        velocityInfluence: true,
        touchSupport: true,
    },
    
    // Advanced features
    features: {
        webgpu: true,
        webassembly: true,
        computeShaders: true,
        rayMarching: true,
        particleSystem: true,
        postProcessing: true,
        realTimeRayTracing: false, // Experimental
    }
};

console.log('🌊 Ultimate Water Simulation Configuration Loaded');
