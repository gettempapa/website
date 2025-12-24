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
        this.renderer.domElement.setAttribute('data-engine', 'three.js');
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

        // Optimized water geometry - reduced from 128x128 to 64x64 for better performance
        const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);
        geometry.rotateX(-Math.PI / 2);

        // Dramatic water shader that actually shows effects
        const waterShader = {
            vertexShader: `
                uniform float time;
                uniform float mouseX;
                uniform float mouseY;
                uniform float mouseStrength;
                uniform vec2 mouseVelocity;
                uniform float morphShape;
                uniform vec3 morphCenter;
                uniform float morphRadius;
                
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
                
                // Realistic ripple function
                float ripple(vec2 pos, vec2 center, float time, float strength) {
                    float dist = distance(pos, center);
                    float wave = sin(dist * 10.0 - time * 3.0) * exp(-dist * 0.5) * strength;
                    return wave * exp(-time * 2.0);
                }
                
                // Globular morphing function
                float globularMorph(vec2 pos, vec3 center, float radius, float shape) {
                    float dist = distance(pos, center.xz);
                    float normalizedDist = dist / radius;
                    
                    // Different geometric shapes based on shape parameter
                    float morph = 0.0;
                    
                    if (shape < 0.2) {
                        // Sphere
                        morph = sqrt(max(0.0, 1.0 - normalizedDist * normalizedDist));
                    } else if (shape < 0.4) {
                        // Cube
                        float cubeDist = max(abs(pos.x - center.x), abs(pos.y - center.z));
                        morph = smoothstep(radius, 0.0, cubeDist);
                    } else if (shape < 0.6) {
                        // Octahedron
                        float octDist = abs(pos.x - center.x) + abs(pos.y - center.z);
                        morph = smoothstep(radius * 1.4, 0.0, octDist);
                    } else if (shape < 0.8) {
                        // Torus
                        float torusDist = abs(dist - radius * 0.5);
                        morph = smoothstep(radius * 0.3, 0.0, torusDist);
                    } else {
                        // Dodecahedron-like
                        float dodecDist = dist * (1.0 + 0.3 * sin(atan(pos.y - center.z, pos.x - center.x) * 5.0));
                        morph = smoothstep(radius, 0.0, dodecDist);
                    }
                    
                    return morph * smoothstep(radius, 0.0, dist);
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Create very gentle ambient waves
                    float wave1 = fbm(vec2(position.x * 0.01 + time * 0.1, position.z * 0.01 + time * 0.08));
                    float wave2 = fbm(vec2(position.x * 0.02 + time * 0.05, position.z * 0.02 + time * 0.12));
                    float wave3 = sin(position.x * 0.1 + time * 0.4) * cos(position.z * 0.1 + time * 0.3);
                    
                    float elevation = wave1 * 0.8 + wave2 * 0.4 + wave3 * 0.2;
                    vElevation = elevation;
                    
                    // Realistic mouse interaction with ripple effects
                    float distanceToMouse = distance(position.xz, vec2(mouseX, mouseY));
                    float mouseInfluence = smoothstep(20.0, 0.0, distanceToMouse) * mouseStrength;
                    
                    // Add ripple effect
                    float rippleEffect = ripple(position.xz, vec2(mouseX, mouseY), time, mouseStrength);
                    elevation += mouseInfluence * 3.0 + rippleEffect * 2.0;
                    
                    // Velocity-based disturbance
                    float velocityEffect = length(mouseVelocity) * smoothstep(25.0, 0.0, distanceToMouse) * 0.5;
                    elevation += velocityEffect;
                    
                    // Add globular morphing shapes
                    float morphEffect = globularMorph(position.xz, morphCenter, morphRadius, morphShape);
                    elevation += morphEffect * 8.0 * mouseStrength;
                    
                    // Update position
                    vec3 newPosition = position;
                    newPosition.y += elevation;
                    
                    // Calculate normal for realistic lighting
                    float ddx = fbm(vec2((position.x + 1.0) * 0.01 + time * 0.1, position.z * 0.01 + time * 0.08)) - wave1;
                    float ddz = fbm(vec2(position.x * 0.01 + time * 0.1, (position.z + 1.0) * 0.01 + time * 0.08)) - wave1;
                    
                    vec3 normal = normalize(vec3(-ddx * 1.0, 1.0, -ddz * 1.0));
                    vNormal = normal;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 waterColor;
                uniform vec3 foamColor;
                uniform float transparency;
                uniform float morphShape;
                uniform vec3 morphCenter;
                uniform float morphRadius;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vElevation;
                
                void main() {
                    // Realistic water color with depth
                    vec3 color = mix(waterColor, foamColor, smoothstep(0.2, 0.8, vElevation));
                    
                    // Add depth variation
                    float depth = 1.0 - smoothstep(0.0, 50.0, length(vPosition.xz));
                    color = mix(color, waterColor * 0.4, depth);
                    
                    // Realistic fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0);
                    color = mix(color, vec3(1.0), fresnel * 0.4);
                    
                    // Gentle sparkle effect
                    float sparkle = sin(vPosition.x * 20.0 + time * 2.0) * sin(vPosition.z * 20.0 + time * 1.8);
                    sparkle = smoothstep(0.95, 1.0, sparkle);
                    color += sparkle * 0.2;
                    
                    // Subtle caustics
                    float caustic = sin(vPosition.x * 10.0 + time * 0.8) * cos(vPosition.z * 10.0 + time * 0.6);
                    color += caustic * 0.1;
                    
                    // Morph shape color variation
                    float morphDist = distance(vPosition.xz, morphCenter.xz);
                    if (morphDist < morphRadius) {
                        float morphIntensity = smoothstep(morphRadius, 0.0, morphDist);
                        vec3 morphColor = mix(vec3(0.0, 0.8, 1.0), vec3(0.0, 1.0, 0.8), morphShape);
                        color = mix(color, morphColor, morphIntensity * 0.3);
                    }
                    
                    // Gentle glow
                    color += vec3(0.05, 0.15, 0.25) * 0.2;
                    
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
                transparency: { value: 0.9 },
                morphShape: { value: 0.0 },
                morphCenter: { value: new THREE.Vector3(0, 0, 0) },
                morphRadius: { value: 0.0 }
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

        // Create ambient particles - reduced from 50 to 25 for better performance
        for (let i = 0; i < 25; i++) {
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

        // Track cursor position for continuous ripple effects
        let lastCursorTime = 0;
        let cursorTrail = [];
        let morphShapeIndex = 0;
        let activeTouches = new Map(); // Track multiple touch points

        // Enhanced touch handling for realistic water dragging
        const handleTouchInteraction = (touches, isActive) => {
            const currentTime = Date.now();

            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const touchId = touch.identifier;

                // Convert touch to normalized coordinates
                const rect = this.renderer.domElement.getBoundingClientRect();
                const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
                const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

                // Get previous touch position for velocity calculation
                const lastTouch = activeTouches.get(touchId);
                let velocityX = 0;
                let velocityY = 0;

                if (lastTouch) {
                    velocityX = x - lastTouch.x;
                    velocityY = y - lastTouch.y;
                }

                // Update touch tracking
                activeTouches.set(touchId, { x, y, time: currentTime });

                // Create water interaction
                this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
                const intersects = this.raycaster.intersectObject(this.waterMesh);

                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

                    // Enhanced strength for touch - make it feel like dragging through water
                    const touchStrength = Math.min(3.0 + speed * 8, 6.0);

                    this.waterMesh.material.uniforms.mouseX.value = point.x;
                    this.waterMesh.material.uniforms.mouseY.value = point.z;
                    this.waterMesh.material.uniforms.mouseStrength.value = touchStrength;
                    this.waterMesh.material.uniforms.mouseVelocity.value = new THREE.Vector2(
                        velocityX * 25,
                        velocityY * 25
                    );

                    // Create continuous ripples for touch
                    if (speed > 0.01) {
                        this.createRippleAtPoint(x, y, touchStrength * 0.7);
                        this.createSplashParticles(point.x, point.z, Math.floor(speed * 10 + 3));
                    }

                    // Create morphing shape for active touch
                    if (isActive && speed > 0.02) {
                        this.createMorphingShape(point.x, point.z, touchStrength * 0.5);
                    }
                }
            }

            // Smooth decay
            gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                value: 0,
                duration: 1.5,
                ease: "power3.out"
            });
        };

        // Touch event listeners
        document.addEventListener('touchstart', (event) => {
            event.preventDefault();
            handleTouchInteraction(event.touches, true);
        }, { passive: false });

        document.addEventListener('touchmove', (event) => {
            event.preventDefault();
            handleTouchInteraction(event.touches, true);
        }, { passive: false });

        document.addEventListener('touchend', (event) => {
            event.preventDefault();
            // Remove ended touches from tracking
            const remainingTouchIds = new Set();
            for (let i = 0; i < event.touches.length; i++) {
                remainingTouchIds.add(event.touches[i].identifier);
            }

            // Clean up touches that ended
            for (let [touchId] of activeTouches) {
                if (!remainingTouchIds.has(touchId)) {
                    activeTouches.delete(touchId);
                }
            }

            handleTouchInteraction(event.touches, false);
        }, { passive: false });

        document.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            activeTouches.clear();
        }, { passive: false });

        // Dramatic mouse tracking with enhanced ripple effects
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Calculate dramatic velocity
            this.mouseVelocity.x = this.mouse.x - this.lastMousePosition.x;
            this.mouseVelocity.y = this.mouse.y - this.lastMousePosition.y;
            
            // Store cursor trail for ripple effects
            const currentTime = Date.now();
            cursorTrail.push({
                x: this.mouse.x,
                y: this.mouse.y,
                time: currentTime,
                velocity: Math.sqrt(this.mouseVelocity.x * this.mouseVelocity.x + this.mouseVelocity.y * this.mouseVelocity.y)
            });
            
            // Keep only recent trail points
            if (cursorTrail.length > 10) {
                cursorTrail.shift();
            }
            
            this.lastMousePosition.x = this.mouse.x;
            this.lastMousePosition.y = this.mouse.y;
            
            // Raycast for dramatic interaction
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                
                // Create multiple ripple points based on cursor trail
                cursorTrail.forEach((trailPoint, index) => {
                    const timeDiff = currentTime - trailPoint.time;
                    if (timeDiff < 100) { // Only recent trail points
                        const strength = Math.max(0.1, 1.0 - (timeDiff / 100)) * trailPoint.velocity * 2;
                        
                        // Create ripple at trail point
                        this.createRippleAtPoint(trailPoint.x, trailPoint.y, strength * 0.5);
                    }
                });
                
                // Main cursor ripple
                const mainStrength = Math.min(2.0, Math.sqrt(this.mouseVelocity.x * this.mouseVelocity.x + this.mouseVelocity.y * this.mouseVelocity.y) * 5);
                this.waterMesh.material.uniforms.mouseX.value = point.x;
                this.waterMesh.material.uniforms.mouseY.value = point.z;
                this.waterMesh.material.uniforms.mouseStrength.value = mainStrength;
                this.waterMesh.material.uniforms.mouseVelocity.value = new THREE.Vector2(
                    this.mouseVelocity.x * 15,
                    this.mouseVelocity.y * 15
                );
                
                // Create morphing shape effect
                this.createMorphingShape(point.x, point.z, mainStrength * 0.3);
                
                // Create dramatic splash particles based on velocity
                if (mainStrength > 0.5) {
                    this.createSplashParticles(point.x, point.z, Math.floor(mainStrength * 5));
                }
                
                // Smooth decay
                gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                    value: 0,
                    duration: 2.0,
                    ease: "power3.out"
                });
            }
            
            lastCursorTime = currentTime;
        });

        // Enhanced click effects with morphing shapes
        document.addEventListener('mousedown', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.waterMesh.material.uniforms.mouseX.value = point.x;
                this.waterMesh.material.uniforms.mouseY.value = point.z;
                this.waterMesh.material.uniforms.mouseStrength.value = 5.0; // Stronger click effect
                
                // Create dramatic morphing shape
                this.createDramaticMorphingShape(point.x, point.z);
                
                // Create dramatic splash
                this.createDramaticSplash(point.x, point.z);
                
                gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                    value: 0,
                    duration: 4.0,
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

    createRippleAtPoint(x, y, strength) {
        // Create a ripple effect at a specific point
        const ripple = {
            x: x,
            y: y,
            strength: strength,
            time: 0,
            maxTime: 2.0
        };
        
        // Add ripple to water shader uniforms
        if (!this.waterMesh.material.uniforms.ripples) {
            this.waterMesh.material.uniforms.ripples = { value: [] };
        }
        
        this.waterMesh.material.uniforms.ripples.value.push(ripple);
        
        // Remove old ripples
        if (this.waterMesh.material.uniforms.ripples.value.length > 20) {
            this.waterMesh.material.uniforms.ripples.value.shift();
        }
    }

    createSplashParticles(x, z, count = 10) {
        // Create dramatic splash particles
        for (let i = 0; i < count; i++) {
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

        // Create particles for dramatic effect - reduced from 30 to 20 for better performance
        for (let i = 0; i < 20; i++) {
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

    createMorphingShape(x, z, strength) {
        // Create a morphing shape effect
        const morphShape = Math.random(); // Random shape
        const morphRadius = 5 + strength * 3;
        
        this.waterMesh.material.uniforms.morphShape.value = morphShape;
        this.waterMesh.material.uniforms.morphCenter.value = new THREE.Vector3(x, 0, z);
        this.waterMesh.material.uniforms.morphRadius.value = morphRadius;
        
        // Animate the morphing shape
        gsap.to(this.waterMesh.material.uniforms.morphRadius, {
            value: 0,
            duration: 2.0,
            ease: "power3.out"
        });
    }

    createDramaticMorphingShape(x, z) {
        console.log(`🔮 Creating dramatic morphing shape at (${x}, ${z})`);
        
        // Cycle through different shapes
        const shapes = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]; // Sphere, Cube, Octahedron, Torus, Dodecahedron
        const morphShape = shapes[Math.floor(Math.random() * shapes.length)];
        const morphRadius = 8;
        
        this.waterMesh.material.uniforms.morphShape.value = morphShape;
        this.waterMesh.material.uniforms.morphCenter.value = new THREE.Vector3(x, 0, z);
        this.waterMesh.material.uniforms.morphRadius.value = morphRadius;
        
        // Animate the dramatic morphing shape
        gsap.to(this.waterMesh.material.uniforms.morphRadius, {
            value: 0,
            duration: 3.0,
            ease: "power4.out"
        });
    }


    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.time += this.clock.getDelta() * 0.2; // Slow down time by 80%
        
        // Update water shader
        this.waterMesh.material.uniforms.time.value = this.time;
        
        // Update particles with dramatic movement
        this.particles.forEach(particle => {
            particle.position.add(particle.velocity.clone().multiplyScalar(0.004)); // Even slower particle movement
            particle.velocity.y -= 0.03; // Reduced gravity
            
            // Bounce off water surface
            if (particle.position.y < 0) {
                particle.position.y = 0;
                particle.velocity.y *= -0.5;
            }
            
            // Fade out particles
            if (particle.material.opacity > 0) {
                particle.material.opacity -= 0.003; // Slower fade
            }
        });
        
        // Very slow camera movement
        this.camera.position.x = Math.sin(this.time * 0.05) * 2; // Much slower and smaller movement
        this.camera.position.z = 25 + Math.cos(this.time * 0.08) * 1.5; // Much slower and smaller movement
        this.camera.lookAt(0, 0, 0);
        
        // Very slow lighting animation
        this.scene.children.forEach(child => {
            if (child instanceof THREE.PointLight) {
                child.intensity = 0.5 + Math.sin(this.time * 0.5 + child.position.x) * 0.15; // Much slower and less intense
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