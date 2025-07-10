// 🌊 WORKING MIND-BLOWING WATER SIMULATION
// This will actually work and show dramatic effects!

class WorkingMindBlowingWater {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.waterMesh = null;
        this.particles = [];
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.mouseVelocity = new THREE.Vector2();
        this.lastMousePosition = new THREE.Vector2();
        this.time = 0;
        
        this.init();
        this.createDramaticWater();
        this.createParticleSystem();
        this.createLighting();
        this.addEventListeners();
        this.animate();
    }

    init() {
        console.log('🚀 Initializing WORKING Mind-Blowing Water...');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a1a2a, 0.001);
        this.scene.background = new THREE.Color(0x0a1a2a);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 25);
        this.camera.lookAt(0, 0, 0);

        // Create renderer with dramatic settings
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
        this.renderer.toneMappingExposure = 2.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Add to DOM
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        document.body.appendChild(this.renderer.domElement);
        
        console.log('✅ Renderer initialized with dramatic settings');
    }

    createDramaticWater() {
        console.log('🌊 Creating dramatic water with visible effects...');
        
        // High-resolution water geometry
        const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);
        geometry.rotateX(-Math.PI / 2);

        // Dramatic water shader that actually shows effects
        const waterShader = {
            vertexShader: `
                uniform float time;
                uniform float mouseX;
                uniform float mouseY;
                uniform float mouseStrength;
                uniform vec2 mouseVelocity;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vElevation;
                
                // Simple but effective noise
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    for(int i = 0; i < 4; i++) {
                        value += amplitude * noise(p * frequency);
                        amplitude *= 0.5;
                        frequency *= 2.0;
                    }
                    return value;
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Create dramatic waves
                    float wave1 = fbm(vec2(position.x * 0.05 + time * 0.5, position.z * 0.05 + time * 0.3));
                    float wave2 = fbm(vec2(position.x * 0.1 + time * 0.2, position.z * 0.1 + time * 0.4));
                    float wave3 = sin(position.x * 0.5 + time * 2.0) * cos(position.z * 0.5 + time * 1.5);
                    
                    float elevation = wave1 * 2.0 + wave2 * 1.0 + wave3 * 0.5;
                    vElevation = elevation;
                    
                    // Dramatic mouse interaction
                    float distanceToMouse = distance(position.xz, vec2(mouseX, mouseY));
                    float mouseInfluence = smoothstep(15.0, 0.0, distanceToMouse) * mouseStrength;
                    float velocityEffect = length(mouseVelocity) * smoothstep(20.0, 0.0, distanceToMouse);
                    
                    elevation += mouseInfluence * 5.0 + velocityEffect * 3.0;
                    
                    // Update position
                    vec3 newPosition = position;
                    newPosition.y += elevation;
                    
                    // Calculate normal for dramatic lighting
                    float ddx = fbm(vec2((position.x + 1.0) * 0.05 + time * 0.5, position.z * 0.05 + time * 0.3)) - wave1;
                    float ddz = fbm(vec2(position.x * 0.05 + time * 0.5, (position.z + 1.0) * 0.05 + time * 0.3)) - wave1;
                    
                    vec3 normal = normalize(vec3(-ddx * 2.0, 1.0, -ddz * 2.0));
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
                
                void main() {
                    // Dramatic water color
                    vec3 color = mix(waterColor, foamColor, smoothstep(0.3, 1.0, vElevation));
                    
                    // Add dramatic depth variation
                    float depth = 1.0 - smoothstep(0.0, 50.0, length(vPosition.xz));
                    color = mix(color, waterColor * 0.3, depth);
                    
                    // Dramatic fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 2.0);
                    color = mix(color, vec3(1.0), fresnel * 0.6);
                    
                    // Dramatic sparkle effect
                    float sparkle = sin(vPosition.x * 30.0 + time * 3.0) * sin(vPosition.z * 30.0 + time * 2.5);
                    sparkle = smoothstep(0.9, 1.0, sparkle);
                    color += sparkle * 0.4;
                    
                    // Add dramatic caustics
                    float caustic = sin(vPosition.x * 15.0 + time * 1.5) * cos(vPosition.z * 15.0 + time * 1.2);
                    color += caustic * 0.2;
                    
                    // Dramatic glow effect
                    color += vec3(0.1, 0.3, 0.5) * 0.3;
                    
                    gl_FragColor = vec4(color, transparency);
                }
            `
        };

        // Create dramatic water material
        const waterMaterial = new THREE.ShaderMaterial({
            vertexShader: waterShader.vertexShader,
            fragmentShader: waterShader.fragmentShader,
            uniforms: {
                time: { value: 0 },
                mouseX: { value: 0 },
                mouseY: { value: 0 },
                mouseStrength: { value: 0 },
                mouseVelocity: { value: new THREE.Vector2() },
                waterColor: { value: new THREE.Color(0x0066cc) },
                foamColor: { value: new THREE.Color(0x66ccff) },
                transparency: { value: 0.9 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        // Create water mesh
        this.waterMesh = new THREE.Mesh(geometry, waterMaterial);
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);
        
        console.log('✅ Dramatic water created');
    }

    createParticleSystem() {
        console.log('✨ Creating dramatic particle system...');
        
        // Create ambient particles
        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(0x00ffff),
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            particle.position.set(
                (Math.random() - 0.5) * 80,
                Math.random() * 20 + 5,
                (Math.random() - 0.5) * 80
            );
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.5
            );
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
        
        console.log('✅ Particle system ready');
    }

    createLighting() {
        console.log('💡 Setting up dramatic lighting...');
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Dramatic directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Dramatic point lights
        const light1 = new THREE.PointLight(0x0066ff, 1.0, 50);
        light1.position.set(-20, 15, -20);
        this.scene.add(light1);
        
        const light2 = new THREE.PointLight(0x00ffff, 0.8, 40);
        light2.position.set(20, 10, 20);
        this.scene.add(light2);
        
        console.log('✅ Dramatic lighting setup complete');
    }

    addEventListeners() {
        console.log('🎮 Setting up dramatic event listeners...');
        
        // Dramatic mouse tracking
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Calculate dramatic velocity
            this.mouseVelocity.x = this.mouse.x - this.lastMousePosition.x;
            this.mouseVelocity.y = this.mouse.y - this.lastMousePosition.y;
            
            this.lastMousePosition.x = this.mouse.x;
            this.lastMousePosition.y = this.mouse.y;
            
            // Raycast for dramatic interaction
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.waterMesh.material.uniforms.mouseX.value = point.x;
                this.waterMesh.material.uniforms.mouseY.value = point.z;
                this.waterMesh.material.uniforms.mouseStrength.value = 1.0;
                this.waterMesh.material.uniforms.mouseVelocity.value = new THREE.Vector2(
                    this.mouseVelocity.x * 10,
                    this.mouseVelocity.y * 10
                );
                
                // Create dramatic splash particles
                this.createSplashParticles(point.x, point.z);
                
                // Smooth decay
                gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                    value: 0,
                    duration: 1.0,
                    ease: "power3.out"
                });
            }
        });

        // Dramatic click effects
        document.addEventListener('mousedown', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.waterMesh.material.uniforms.mouseX.value = point.x;
                this.waterMesh.material.uniforms.mouseY.value = point.z;
                this.waterMesh.material.uniforms.mouseStrength.value = 3.0;
                
                // Create dramatic splash
                this.createDramaticSplash(point.x, point.z);
                
                gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                    value: 0,
                    duration: 2.0,
                    ease: "power4.out"
                });
            }
        });

        // Responsive window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('✅ Event listeners ready');
    }

    createSplashParticles(x, z) {
        // Create dramatic splash particles
        for (let i = 0; i < 10; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(0x66ccff),
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            particle.position.set(x, 0, z);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 3 + 2,
                (Math.random() - 0.5) * 4
            );
            
            this.particles.push(particle);
            this.scene.add(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                this.scene.remove(particle);
                const index = this.particles.indexOf(particle);
                if (index > -1) {
                    this.particles.splice(index, 1);
                }
            }, 2000);
        }
    }

    createDramaticSplash(x, z) {
        console.log(`💦 Creating dramatic splash at (${x}, ${z})`);
        
        // Create many particles for dramatic effect
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(0x00ffff),
                    transparent: true,
                    opacity: 1.0
                })
            );
            
            particle.position.set(x, 0, z);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 5 + 3,
                (Math.random() - 0.5) * 8
            );
            
            this.particles.push(particle);
            this.scene.add(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                this.scene.remove(particle);
                const index = this.particles.indexOf(particle);
                if (index > -1) {
                    this.particles.splice(index, 1);
                }
            }, 3000);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.time += this.clock.getDelta();
        
        // Update water shader
        this.waterMesh.material.uniforms.time.value = this.time;
        
        // Update particles with dramatic movement
        this.particles.forEach(particle => {
            particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
            particle.velocity.y -= 0.1; // Gravity
            
            // Bounce off water surface
            if (particle.position.y < 0) {
                particle.position.y = 0;
                particle.velocity.y *= -0.5;
            }
            
            // Fade out particles
            if (particle.material.opacity > 0) {
                particle.material.opacity -= 0.01;
            }
        });
        
        // Dramatic camera movement
        this.camera.position.x = Math.sin(this.time * 0.2) * 5;
        this.camera.position.z = 25 + Math.cos(this.time * 0.3) * 3;
        this.camera.lookAt(0, 0, 0);
        
        // Dramatic lighting animation
        this.scene.children.forEach(child => {
            if (child instanceof THREE.PointLight) {
                child.intensity = 0.5 + Math.sin(this.time * 2.0 + child.position.x) * 0.3;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the working mind-blowing water simulation
function initWorkingMindBlowingWater() {
    if (typeof THREE !== 'undefined') {
        console.log('🚀 Starting WORKING Mind-Blowing Water Simulation...');
        new WorkingMindBlowingWater();
    } else {
        console.log('⏳ Waiting for Three.js to load...');
        setTimeout(initWorkingMindBlowingWater, 100);
    }
}

// Start the simulation
document.addEventListener('DOMContentLoaded', initWorkingMindBlowingWater); 