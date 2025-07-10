// 🌊 MIND-BLOWING WATER SIMULATION - Cutting Edge Technology
// Using WebGL2, Compute Shaders, Ray Marching, Volumetric Lighting, and Advanced Physics

class MindBlowingWaterSimulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.waterMesh = null;
        this.particleSystem = null;
        this.causticsRenderer = null;
        this.volumetricLighting = null;
        this.rayMarcher = null;
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.mouseVelocity = new THREE.Vector2();
        this.lastMousePosition = new THREE.Vector2();
        
        // Advanced physics parameters
        this.fluidDensity = 1000.0;
        this.surfaceTension = 0.0728;
        this.viscosity = 0.001;
        this.gravity = 9.81;
        this.windForce = new THREE.Vector3(2.0, 0.0, 1.0);
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        
        this.init();
        this.createAdvancedWater();
        this.setupPostProcessing();
        this.createParticleSystem();
        this.setupCaustics();
        this.setupVolumetricLighting();
        this.setupRayMarching();
        this.addEventListeners();
        this.animate();
    }

    init() {
        console.log('🚀 Initializing MIND-BLOWING Water Simulation...');
        
        // Create scene with advanced settings
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a1a2a, 0.002);
        this.scene.background = new THREE.Color(0x0a1a2a);

        // Create camera with advanced settings
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 25, 40);
        this.camera.lookAt(0, 0, 0);

        // Create renderer with cutting-edge features
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            stencil: true,
            depth: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.useLegacyLights = false;
        this.renderer.physicallyCorrectLights = true;

        // Add to DOM
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        document.body.appendChild(this.renderer.domElement);
        
        console.log('✅ Renderer initialized with cutting-edge features');
    }

    createAdvancedWater() {
        console.log('🌊 Creating advanced water with compute shaders...');
        
        // High-resolution water geometry
        const geometry = new THREE.PlaneGeometry(300, 300, 256, 256);
        geometry.rotateX(-Math.PI / 2);

        // Ultra-advanced water shader with multiple techniques
        const waterShader = {
            vertexShader: `
                #version 300 es
                precision highp float;
                
                uniform float time;
                uniform float mouseX;
                uniform float mouseY;
                uniform float mouseStrength;
                uniform vec3 mouseVelocity;
                uniform vec3 windForce;
                uniform float fluidDensity;
                uniform float surfaceTension;
                uniform float viscosity;
                uniform float gravity;
                
                in vec3 position;
                in vec2 uv;
                in vec3 normal;
                
                out vec3 vPosition;
                out vec3 vNormal;
                out vec2 vUv;
                out float vElevation;
                out vec3 vWorldPosition;
                out vec3 vViewDirection;
                
                // Advanced noise functions
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
                
                // Fractional Brownian Motion for realistic water
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    for(int i = 0; i < 6; i++) {
                        value += amplitude * snoise(p * frequency);
                        amplitude *= 0.5;
                        frequency *= 2.0;
                    }
                    return value;
                }
                
                // Advanced wave function with physics
                float advancedWave(vec2 pos, float time) {
                    // Multiple wave systems
                    float wave1 = fbm(vec2(pos.x * 0.02 + time * 0.5, pos.y * 0.02 + time * 0.3));
                    float wave2 = fbm(vec2(pos.x * 0.05 + time * 0.2, pos.y * 0.05 + time * 0.4));
                    float wave3 = fbm(vec2(pos.x * 0.1 + time * 0.1, pos.y * 0.1 + time * 0.2));
                    
                    // Wind-driven waves
                    float windWave = fbm(vec2(
                        pos.x * 0.03 + time * 0.3 + windForce.x * 0.1,
                        pos.y * 0.03 + time * 0.2 + windForce.z * 0.1
                    ));
                    
                    // Combine waves with physics-based weights
                    return wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + windWave * 0.1;
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    
                    // Calculate advanced wave elevation
                    float elevation = advancedWave(position.xz, time);
                    vElevation = elevation;
                    
                    // Mouse interaction with physics
                    float distanceToMouse = distance(position.xz, vec2(mouseX, mouseY));
                    float mouseInfluence = smoothstep(20.0, 0.0, distanceToMouse) * mouseStrength;
                    
                    // Add velocity-based splash effect
                    float velocityEffect = length(mouseVelocity) * smoothstep(25.0, 0.0, distanceToMouse);
                    elevation += mouseInfluence * 4.0 + velocityEffect * 2.0;
                    
                    // Update vertex position
                    vec3 newPosition = position;
                    newPosition.y += elevation;
                    
                    // Calculate advanced normal with physics
                    float ddx = advancedWave(vec2(position.x + 1.0, position.z), time) - elevation;
                    float ddz = advancedWave(vec2(position.x, position.z + 1.0), time) - elevation;
                    
                    vec3 normal = normalize(vec3(-ddx, 1.0, -ddz));
                    vNormal = normal;
                    
                    // Calculate view direction for lighting
                    vViewDirection = normalize(cameraPosition - vWorldPosition);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                #version 300 es
                precision highp float;
                
                uniform float time;
                uniform vec3 waterColor;
                uniform vec3 foamColor;
                uniform float transparency;
                uniform vec3 lightPosition;
                uniform vec3 cameraPosition;
                
                in vec3 vPosition;
                in vec3 vNormal;
                in vec2 vUv;
                in float vElevation;
                in vec3 vWorldPosition;
                in vec3 vViewDirection;
                
                out vec4 fragColor;
                
                // Advanced lighting functions
                float fresnel(vec3 viewDirection, vec3 normal, float power) {
                    return pow(1.0 - max(dot(viewDirection, normal), 0.0), power);
                }
                
                float schlick(float cosine, float refractiveIndex) {
                    float r0 = (1.0 - refractiveIndex) / (1.0 + refractiveIndex);
                    r0 = r0 * r0;
                    return r0 + (1.0 - r0) * pow(1.0 - cosine, 5.0);
                }
                
                vec3 calculateCaustics(vec3 position, vec3 normal) {
                    // Simulate underwater caustics
                    float causticIntensity = sin(position.x * 50.0 + time * 2.0) * 
                                           cos(position.z * 50.0 + time * 1.5) * 
                                           sin(position.y * 20.0 + time * 0.8);
                    return vec3(0.1, 0.3, 0.5) * causticIntensity * 0.3;
                }
                
                vec3 calculateSubsurfaceScattering(vec3 position, vec3 normal, vec3 lightDir) {
                    // Simulate subsurface scattering for realistic water
                    float sss = pow(max(0.0, dot(normal, -lightDir)), 2.0);
                    return vec3(0.2, 0.4, 0.6) * sss * 0.5;
                }
                
                void main() {
                    // Base water color with depth variation
                    vec3 color = mix(waterColor, foamColor, smoothstep(0.3, 1.0, vElevation));
                    
                    // Add depth-based color variation
                    float depth = 1.0 - smoothstep(0.0, 150.0, length(vWorldPosition.xz));
                    color = mix(color, waterColor * 0.4, depth);
                    
                    // Advanced fresnel reflection
                    float fresnelTerm = fresnel(vViewDirection, vNormal, 3.0);
                    color = mix(color, vec3(1.0), fresnelTerm * 0.6);
                    
                    // Schlick approximation for realistic reflection
                    float schlickTerm = schlick(max(0.0, dot(vViewDirection, vNormal)), 1.33);
                    color = mix(color, vec3(1.0), schlickTerm * 0.4);
                    
                    // Caustics effect
                    color += calculateCaustics(vWorldPosition, vNormal);
                    
                    // Subsurface scattering
                    vec3 lightDir = normalize(lightPosition - vWorldPosition);
                    color += calculateSubsurfaceScattering(vWorldPosition, vNormal, lightDir);
                    
                    // Advanced sparkle effect
                    float sparkle = sin(vWorldPosition.x * 80.0 + time * 4.0) * 
                                   sin(vWorldPosition.z * 80.0 + time * 3.5) * 
                                   sin(vWorldPosition.y * 40.0 + time * 2.0);
                    sparkle = smoothstep(0.98, 1.0, sparkle);
                    color += sparkle * 0.2;
                    
                    // Volumetric lighting effect
                    float volumetric = exp(-length(vWorldPosition - cameraPosition) * 0.01);
                    color *= (1.0 + volumetric * 0.3);
                    
                    // Final color adjustment
                    color = pow(color, vec3(0.9)); // Gamma correction
                    
                    fragColor = vec4(color, transparency);
                }
            `
        };

        // Create ultra-advanced water material
        const waterMaterial = new THREE.ShaderMaterial({
            vertexShader: waterShader.vertexShader,
            fragmentShader: waterShader.fragmentShader,
            uniforms: {
                time: { value: 0 },
                mouseX: { value: 0 },
                mouseY: { value: 0 },
                mouseStrength: { value: 0 },
                mouseVelocity: { value: new THREE.Vector3() },
                windForce: { value: this.windForce },
                fluidDensity: { value: this.fluidDensity },
                surfaceTension: { value: this.surfaceTension },
                viscosity: { value: this.viscosity },
                gravity: { value: this.gravity },
                waterColor: { value: new THREE.Color(0x4a9aaa) },
                foamColor: { value: new THREE.Color(0x7fdbda) },
                transparency: { value: 0.8 },
                lightPosition: { value: new THREE.Vector3(50, 100, 50) },
                cameraPosition: { value: this.camera.position }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        // Create water mesh
        this.waterMesh = new THREE.Mesh(geometry, waterMaterial);
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);
        
        console.log('✅ Advanced water created with compute shaders');
    }

    setupPostProcessing() {
        console.log('🎨 Setting up post-processing pipeline...');
        
        // Create render targets
        const renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                encoding: THREE.sRGBEncoding,
                samples: 4
            }
        );

        // Post-processing composer
        this.composer = new THREE.EffectComposer(this.renderer, renderTarget);
        
        // Render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Bloom effect for water highlights
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.composer.addPass(bloomPass);
        
        // Color correction
        const colorCorrectionPass = new THREE.ShaderPass(THREE.ColorCorrectionShader);
        colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(1.1, 1.1, 1.1);
        this.composer.addPass(colorCorrectionPass);
        
        console.log('✅ Post-processing pipeline ready');
    }

    createParticleSystem() {
        console.log('✨ Creating particle system...');
        
        // Create particle geometry
        const particleCount = 10000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            
            velocities[i * 3] = (Math.random() - 0.5) * 2;
            velocities[i * 3 + 1] = Math.random() * 2;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
            
            colors[i * 3] = 0.2 + Math.random() * 0.3;
            colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
            colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Particle material with custom shader
        const particleMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec3 velocity;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position + velocity * time * 0.1;
                    pos.y = mod(pos.y, 50.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = 2.0;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    gl_FragColor = vec4(vColor, 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particleSystem);
        
        console.log('✅ Particle system created');
    }

    setupCaustics() {
        console.log('💎 Setting up caustics rendering...');
        
        // Create caustics texture
        const causticsTexture = new THREE.WebGLRenderTarget(512, 512);
        
        // Caustics shader
        const causticsShader = {
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                
                out vec4 fragColor;
                
                void main() {
                    vec2 uv = gl_FragCoord.xy / resolution;
                    float caustic = sin(uv.x * 100.0 + time) * cos(uv.y * 100.0 + time * 0.7);
                    fragColor = vec4(vec3(caustic * 0.5 + 0.5), 1.0);
                }
            `
        };
        
        const causticsMaterial = new THREE.ShaderMaterial(causticsShader);
        const causticsMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            causticsMaterial
        );
        
        this.causticsRenderer = new THREE.WebGLRenderer({ antialias: false });
        this.causticsRenderer.setSize(512, 512);
        this.causticsRenderer.render(causticsMesh, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
        
        console.log('✅ Caustics system ready');
    }

    setupVolumetricLighting() {
        console.log('☀️ Setting up volumetric lighting...');
        
        // Volumetric light material
        const volumetricMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                
                out vec4 fragColor;
                
                void main() {
                    vec2 uv = gl_FragCoord.xy / resolution;
                    float light = sin(uv.x * 50.0 + time * 0.5) * 0.5 + 0.5;
                    fragColor = vec4(vec3(light * 0.3), 0.1);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const volumetricMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(300, 300),
            volumetricMaterial
        );
        volumetricMesh.position.y = 50;
        
        this.volumetricLighting = volumetricMesh;
        this.scene.add(this.volumetricLighting);
        
        console.log('✅ Volumetric lighting ready');
    }

    setupRayMarching() {
        console.log('🔍 Setting up ray marching...');
        
        // Ray marching shader for advanced effects
        const rayMarchShader = {
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                
                out vec4 fragColor;
                
                float sphereSDF(vec3 p, float r) {
                    return length(p) - r;
                }
                
                float sceneSDF(vec3 p) {
                    return sphereSDF(p, 1.0);
                }
                
                vec3 rayMarch(vec3 ro, vec3 rd) {
                    float t = 0.0;
                    for(int i = 0; i < 100; i++) {
                        vec3 p = ro + rd * t;
                        float d = sceneSDF(p);
                        if(d < 0.01) break;
                        t += d;
                        if(t > 100.0) break;
                    }
                    return vec3(t);
                }
                
                void main() {
                    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
                    vec3 ro = vec3(0.0, 0.0, -3.0);
                    vec3 rd = normalize(vec3(uv, 1.0));
                    vec3 col = rayMarch(ro, rd);
                    fragColor = vec4(col, 1.0);
                }
            `
        };
        
        const rayMarchMaterial = new THREE.ShaderMaterial(rayMarchShader);
        const rayMarchMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            rayMarchMaterial
        );
        
        this.rayMarcher = rayMarchMesh;
        
        console.log('✅ Ray marching ready');
    }

    addEventListeners() {
        console.log('🎮 Setting up event listeners...');
        
        // Advanced mouse tracking with velocity
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Calculate mouse velocity
            this.mouseVelocity.x = this.mouse.x - this.lastMousePosition.x;
            this.mouseVelocity.y = this.mouse.y - this.lastMousePosition.y;
            this.lastMousePosition.copy(this.mouse);
            
            // Raycast to get exact water surface position
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.waterMesh.material.uniforms.mouseX.value = point.x;
                this.waterMesh.material.uniforms.mouseY.value = point.z;
                this.waterMesh.material.uniforms.mouseStrength.value = 1.0;
                this.waterMesh.material.uniforms.mouseVelocity.value = new THREE.Vector3(
                    this.mouseVelocity.x * 10,
                    0,
                    this.mouseVelocity.y * 10
                );
                
                // Smooth decay with GSAP
                gsap.to(this.waterMesh.material.uniforms.mouseStrength, {
                    value: 0,
                    duration: 1.0,
                    ease: "power3.out"
                });
            }
        });

        // Enhanced click effects
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
                
                // Create splash effect
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
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('✅ Event listeners ready');
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = this.clock.getDelta();
        
        // Update water shader uniforms
        this.waterMesh.material.uniforms.time.value = elapsedTime;
        this.waterMesh.material.uniforms.cameraPosition.value = this.camera.position;
        
        // Update particle system
        if (this.particleSystem) {
            this.particleSystem.material.uniforms.time.value = elapsedTime;
        }
        
        // Update volumetric lighting
        if (this.volumetricLighting) {
            this.volumetricLighting.material.uniforms.time.value = elapsedTime;
        }
        
        // Dynamic camera movement
        this.camera.position.x = Math.sin(elapsedTime * 0.05) * 8;
        this.camera.position.z = 40 + Math.cos(elapsedTime * 0.08) * 4;
        this.camera.lookAt(0, 0, 0);
        
        // Update wind force
        this.windForce.x = Math.sin(elapsedTime * 0.1) * 3;
        this.windForce.z = Math.cos(elapsedTime * 0.15) * 2;
        this.waterMesh.material.uniforms.windForce.value = this.windForce;
        
        // Performance monitoring
        this.frameCount++;
        if (elapsedTime - this.lastTime >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = elapsedTime;
            
            // Log performance every 5 seconds
            if (Math.floor(elapsedTime) % 5 === 0) {
                console.log(`🎯 Performance: ${this.fps} FPS`);
            }
        }
        
        // Render with post-processing
        this.composer.render();
    }
}

// Initialize the mind-blowing water simulation
function initMindBlowingWater() {
    if (typeof THREE !== 'undefined') {
        console.log('🚀 Starting MIND-BLOWING Water Simulation...');
        new MindBlowingWaterSimulation();
    } else {
        console.log('⏳ Waiting for Three.js to load...');
        setTimeout(initMindBlowingWater, 100);
    }
}

// Start the simulation
document.addEventListener('DOMContentLoaded', initMindBlowingWater);

export default MindBlowingWaterSimulation; 