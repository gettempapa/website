// Advanced Water Simulation using Three.js (CDN Version)
class AdvancedWaterSimulation {
    constructor() {
        console.log('🏗️ Building water simulation...');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.waterMesh = null;
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        
        this.init();
        this.createWater();
        this.addLighting();
        this.animate();
        this.addEventListeners();
        console.log('🎉 Water simulation ready!');
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0a1a2a, 50, 200);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 20, 30);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Add to DOM
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        document.body.appendChild(this.renderer.domElement);
    }

    createWater() {
        // Water geometry with high resolution
        const geometry = new THREE.PlaneGeometry(200, 200, 128, 128);
        geometry.rotateX(-Math.PI / 2);

        // Advanced water shader with realistic physics
        const waterShader = {
            vertexShader: `
                uniform float time;
                uniform float mouseX;
                uniform float mouseY;
                uniform float mouseStrength;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vElevation;
                
                // Simplex noise implementation
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
                
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ; m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Multi-layered noise for realistic water
                    float noise1 = snoise(vec2(position.x * 0.02 + time * 0.5, position.z * 0.02 + time * 0.3));
                    float noise2 = snoise(vec2(position.x * 0.05 + time * 0.2, position.z * 0.05 + time * 0.4));
                    float noise3 = snoise(vec2(position.x * 0.1 + time * 0.1, position.z * 0.1 + time * 0.2));
                    
                    // Combine noise layers with different frequencies
                    float elevation = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
                    vElevation = elevation;
                    
                    // Mouse interaction with realistic ripple physics
                    float distanceToMouse = distance(position.xz, vec2(mouseX, mouseY));
                    float mouseInfluence = smoothstep(15.0, 0.0, distanceToMouse) * mouseStrength;
                    elevation += mouseInfluence * 3.0;
                    
                    // Update vertex position
                    vec3 newPosition = position;
                    newPosition.y += elevation;
                    
                    // Calculate normal for realistic lighting
                    float ddx = snoise(vec2((position.x + 1.0) * 0.02 + time * 0.5, position.z * 0.02 + time * 0.3)) - noise1;
                    float ddz = snoise(vec2(position.x * 0.02 + time * 0.5, (position.z + 1.0) * 0.02 + time * 0.3)) - noise1;
                    
                    vec3 normal = normalize(vec3(-ddx, 1.0, -ddz));
                    vNormal = normal;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 waterColor;
                uniform vec3 foamColor;
                uniform float transparency;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vElevation;
                
                // Fresnel effect for realistic water reflection
                float fresnel(vec3 viewDirection, vec3 normal, float power) {
                    return pow(1.0 - max(dot(viewDirection, normal), 0.0), power);
                }
                
                void main() {
                    // Base water color with depth variation
                    vec3 color = mix(waterColor, foamColor, smoothstep(0.4, 1.0, vElevation));
                    
                    // Add depth-based color variation
                    float depth = 1.0 - smoothstep(0.0, 100.0, length(vPosition.xz));
                    color = mix(color, waterColor * 0.6, depth);
                    
                    // Realistic fresnel reflection
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnelTerm = fresnel(viewDirection, vNormal, 3.0);
                    color = mix(color, vec3(1.0), fresnelTerm * 0.4);
                    
                    // Add sparkle effect
                    float sparkle = sin(vPosition.x * 60.0 + time * 3.0) * sin(vPosition.z * 60.0 + time * 2.5);
                    sparkle = smoothstep(0.97, 1.0, sparkle);
                    color += sparkle * 0.15;
                    
                    // Add subtle caustics-like effect
                    float caustic = sin(vPosition.x * 20.0 + time * 1.5) * cos(vPosition.z * 20.0 + time * 1.2);
                    color += caustic * 0.05;
                    
                    gl_FragColor = vec4(color, transparency);
                }
            `
        };

        // Create water material with advanced shaders
        const waterMaterial = new THREE.ShaderMaterial({
            vertexShader: waterShader.vertexShader,
            fragmentShader: waterShader.fragmentShader,
            uniforms: {
                time: { value: 0 },
                mouseX: { value: 0 },
                mouseY: { value: 0 },
                mouseStrength: { value: 0 },
                waterColor: { value: new THREE.Color(0x4a9aaa) },
                foamColor: { value: new THREE.Color(0x7fdbda) },
                transparency: { value: 0.7 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        // Create water mesh
        this.waterMesh = new THREE.Mesh(geometry, waterMaterial);
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);
    }

    addLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Colored point lights for dramatic underwater effect
        const pointLight1 = new THREE.PointLight(0x48dbfb, 0.6, 100);
        pointLight1.position.set(-30, 20, -30);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xa8e6cf, 0.4, 80);
        pointLight2.position.set(30, 15, 30);
        this.scene.add(pointLight2);

        // Additional rim light
        const rimLight = new THREE.PointLight(0x7fdbda, 0.3, 120);
        rimLight.position.set(0, 10, -50);
        this.scene.add(rimLight);
    }

    addEventListeners() {
        // Mouse movement with realistic water interaction
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Raycast to get exact water surface position
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.waterMesh.material.uniforms.mouseX.value = point.x;
                this.waterMesh.material.uniforms.mouseY.value = point.z;
                this.waterMesh.material.uniforms.mouseStrength.value = 1.0;
                
                // Smooth decay of mouse influence
                gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                    value: 0,
                    duration: 0.8,
                    ease: "power2.out"
                });
            }
            
            // Debug: Always apply some mouse influence for testing
            this.waterMesh.material.uniforms.mouseX.value = (event.clientX / window.innerWidth - 0.5) * 100;
            this.waterMesh.material.uniforms.mouseY.value = (event.clientY / window.innerHeight - 0.5) * 100;
            this.waterMesh.material.uniforms.mouseStrength.value = 0.5;
        });

        // Mouse click for splash effect
        document.addEventListener('mousedown', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.waterMesh.material.uniforms.mouseX.value = point.x;
                this.waterMesh.material.uniforms.mouseY.value = point.z;
                this.waterMesh.material.uniforms.mouseStrength.value = 2.0;
                
                gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                    value: 0,
                    duration: 1.2,
                    ease: "power3.out"
                });
            }
        });

        // Responsive window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update water shader time for continuous animation
        this.waterMesh.material.uniforms.time.value = elapsedTime;
        
        // Gentle camera movement for dynamic perspective
        this.camera.position.x = Math.sin(elapsedTime * 0.08) * 4;
        this.camera.position.z = 50 + Math.cos(elapsedTime * 0.12) * 2;
        this.camera.lookAt(0, 0, 0);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when Three.js is loaded
function initWaterSimulation() {
    if (typeof THREE !== 'undefined') {
        console.log('🌊 Initializing Advanced Water Simulation...');
        new AdvancedWaterSimulation();
        console.log('✅ Water simulation loaded successfully!');
    } else {
        console.log('⏳ Waiting for Three.js to load...');
        setTimeout(initWaterSimulation, 100);
    }
}

// Start the simulation
document.addEventListener('DOMContentLoaded', initWaterSimulation); 