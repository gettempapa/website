// State-of-the-art realistic water simulation
class RealisticWater {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.waterMesh = null;
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.interactions = [];
        this.time = 0;

        this.init();
        this.createWater();
        this.createLighting();
        this.setupInteraction();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001122);
        this.scene.fog = new THREE.FogExp2(0x001122, 0.002);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 25, 40);
        this.camera.lookAt(0, 0, 0);

        // Renderer with advanced settings
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = false; // Disable for performance
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.renderer.domElement.setAttribute('data-engine', 'three.js');
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        document.body.appendChild(this.renderer.domElement);
    }

    createWater() {
        // Ultra high-resolution geometry for smooth surface
        const geometry = new THREE.PlaneGeometry(200, 200, 256, 256);
        geometry.rotateX(-Math.PI / 2);

        // Advanced water shader with realistic physics
        const waterMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                uniform float time;
                uniform vec2 interactions[10];
                uniform float interactionStrengths[10];
                uniform float interactionTimes[10];

                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying float vElevation;

                // Improved Perlin noise
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187,
                                        0.366025403784439,
                                       -0.577350269189626,
                                        0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                // Fractal Brownian Motion for natural waves
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

                // Realistic Gerstner wave
                vec3 gerstnerWave(vec2 pos, vec2 direction, float steepness, float wavelength, float time) {
                    float k = 2.0 * 3.14159 / wavelength;
                    float c = sqrt(9.8 / k);
                    vec2 d = normalize(direction);
                    float f = k * (dot(d, pos) - c * time);
                    float a = steepness / k;

                    return vec3(
                        d.x * (a * cos(f)),
                        a * sin(f),
                        d.y * (a * cos(f))
                    );
                }

                void main() {
                    vPosition = position;
                    vec3 pos = position;

                    // Multiple Gerstner waves for realistic ocean movement
                    vec3 wave1 = gerstnerWave(position.xz, vec2(1.0, 0.3), 0.15, 20.0, time * 0.3);
                    vec3 wave2 = gerstnerWave(position.xz, vec2(-0.5, 1.0), 0.1, 15.0, time * 0.4);
                    vec3 wave3 = gerstnerWave(position.xz, vec2(0.8, -0.6), 0.08, 25.0, time * 0.25);

                    // Combine Gerstner waves
                    pos += (wave1 + wave2 + wave3) * 0.3;

                    // Add Perlin noise for small details
                    float noise1 = fbm(position.xz * 0.05 + time * 0.05);
                    float noise2 = fbm(position.xz * 0.1 + time * 0.08);
                    pos.y += (noise1 * 0.3 + noise2 * 0.15);

                    // User interactions with realistic wave propagation
                    for(int i = 0; i < 10; i++) {
                        if(interactionStrengths[i] > 0.0) {
                            float dist = distance(position.xz, interactions[i]);
                            float age = time - interactionTimes[i];

                            // Wave equation: displacement decreases with distance and time
                            float waveSpeed = 3.0;
                            float waveRadius = age * waveSpeed;

                            // Create expanding ring with realistic falloff
                            float wave = sin((dist - waveRadius) * 2.0) * exp(-dist * 0.08);
                            wave *= exp(-age * 0.8); // Decay over time
                            wave *= interactionStrengths[i];

                            // Secondary ripples
                            float ripple = sin((dist - waveRadius) * 6.0) * 0.3 * exp(-dist * 0.15);
                            ripple *= exp(-age * 1.2);
                            ripple *= interactionStrengths[i];

                            pos.y += (wave + ripple) * 2.0;
                        }
                    }

                    // Calculate smooth normal using neighboring vertices
                    float offset = 0.1;
                    vec3 posRight = pos + vec3(offset, 0.0, 0.0);
                    vec3 posForward = pos + vec3(0.0, 0.0, offset);

                    // Sample elevation at neighboring points
                    posRight.y += fbm((position.xz + vec2(offset, 0.0)) * 0.05 + time * 0.05) * 0.3;
                    posForward.y += fbm((position.xz + vec2(0.0, offset)) * 0.05 + time * 0.05) * 0.3;

                    vec3 tangent = normalize(posRight - pos);
                    vec3 binormal = normalize(posForward - pos);
                    vec3 normal = normalize(cross(binormal, tangent));

                    vNormal = normalize(normalMatrix * normal);
                    vElevation = pos.y;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 cameraPosition;

                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying float vElevation;

                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);

                    // Realistic water colors (deep ocean)
                    vec3 deepWater = vec3(0.0, 0.1, 0.2);
                    vec3 shallowWater = vec3(0.0, 0.3, 0.5);
                    vec3 foam = vec3(0.7, 0.9, 1.0);

                    // Depth-based color
                    float depth = smoothstep(-50.0, 50.0, length(vPosition.xz));
                    vec3 waterColor = mix(shallowWater, deepWater, depth * 0.6);

                    // Add foam at wave peaks
                    float foamFactor = smoothstep(0.3, 0.8, vElevation);
                    waterColor = mix(waterColor, foam, foamFactor * 0.3);

                    // Realistic Fresnel effect
                    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
                    vec3 skyReflection = vec3(0.5, 0.7, 1.0);
                    vec3 color = mix(waterColor, skyReflection, fresnel * 0.7);

                    // Subsurface scattering approximation
                    float scatter = pow(max(dot(viewDir, -normal), 0.0), 2.0);
                    color += vec3(0.0, 0.2, 0.3) * scatter * 0.5;

                    // Dynamic caustics
                    float caustic = sin(vPosition.x * 5.0 + time * 0.5) *
                                   cos(vPosition.z * 5.0 - time * 0.3) *
                                   sin((vPosition.x + vPosition.z) * 3.0 + time * 0.7);
                    caustic = smoothstep(0.3, 1.0, (caustic + 1.0) * 0.5);
                    color += vec3(0.3, 0.6, 0.8) * caustic * 0.15;

                    // Sparkles from sunlight
                    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
                    vec3 halfDir = normalize(lightDir + viewDir);
                    float spec = pow(max(dot(normal, halfDir), 0.0), 128.0);
                    color += vec3(1.0) * spec * 0.8;

                    // Atmospheric perspective
                    float dist = length(vViewPosition);
                    float fog = smoothstep(50.0, 150.0, dist);
                    color = mix(color, vec3(0.5, 0.7, 0.9), fog * 0.3);

                    gl_FragColor = vec4(color, 0.95);
                }
            `,
            uniforms: {
                time: { value: 0 },
                cameraPosition: { value: this.camera.position },
                interactions: { value: Array(10).fill(new THREE.Vector2(9999, 9999)) },
                interactionStrengths: { value: Array(10).fill(0) },
                interactionTimes: { value: Array(10).fill(0) }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.waterMesh = new THREE.Mesh(geometry, waterMaterial);
        this.scene.add(this.waterMesh);
    }

    createLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x445566, 0.5);
        this.scene.add(ambient);

        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffee, 1.5);
        sun.position.set(50, 80, 30);
        this.scene.add(sun);

        // Rim light
        const rim = new THREE.DirectionalLight(0x4466aa, 0.8);
        rim.position.set(-30, 20, -50);
        this.scene.add(rim);
    }

    setupInteraction() {
        const touches = new Map();

        const addInteraction = (x, y, strength) => {
            // Convert screen to world coordinates
            this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);

            if (intersects.length > 0) {
                const point = intersects[0].point;

                // Add new interaction
                this.interactions.push({
                    position: new THREE.Vector2(point.x, point.z),
                    strength: strength,
                    time: this.time
                });

                // Keep only recent interactions
                if (this.interactions.length > 10) {
                    this.interactions.shift();
                }

                // Update shader uniforms
                const uniforms = this.waterMesh.material.uniforms;
                this.interactions.forEach((interaction, i) => {
                    uniforms.interactions.value[i] = interaction.position;
                    uniforms.interactionStrengths.value[i] = interaction.strength;
                    uniforms.interactionTimes.value[i] = interaction.time;
                });
            }
        };

        // Touch events
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                const x = (touch.clientX / window.innerWidth) * 2 - 1;
                const y = -(touch.clientY / window.innerHeight) * 2 + 1;
                touches.set(touch.identifier, { x, y, time: Date.now() });
                addInteraction(x, y, 0.8);
            });
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                const x = (touch.clientX / window.innerWidth) * 2 - 1;
                const y = -(touch.clientY / window.innerHeight) * 2 + 1;
                const last = touches.get(touch.identifier);

                if (last) {
                    const dx = x - last.x;
                    const dy = y - last.y;
                    const speed = Math.sqrt(dx * dx + dy * dy);
                    const strength = Math.min(0.5 + speed * 3, 1.2);

                    addInteraction(x, y, strength);
                    touches.set(touch.identifier, { x, y, time: Date.now() });
                }
            });
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                touches.delete(touch.identifier);
            });
        }, { passive: false });

        // Mouse events
        let lastMouse = { x: 0, y: 0, time: 0 };

        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            const now = Date.now();

            if (now - lastMouse.time > 50) {
                const dx = x - lastMouse.x;
                const dy = y - lastMouse.y;
                const speed = Math.sqrt(dx * dx + dy * dy);

                if (speed > 0.01) {
                    const strength = Math.min(0.3 + speed * 2, 0.9);
                    addInteraction(x, y, strength);
                }

                lastMouse = { x, y, time: now };
            }
        });

        document.addEventListener('mousedown', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            addInteraction(x, y, 1.0);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();
        this.time += delta;

        // Update shader time
        this.waterMesh.material.uniforms.time.value = this.time;

        // Gentle camera movement
        this.camera.position.x = Math.sin(this.time * 0.05) * 3;
        this.camera.position.y = 25 + Math.sin(this.time * 0.03) * 2;
        this.camera.lookAt(0, 0, 0);

        // Clean up old interactions
        this.interactions = this.interactions.filter(i =>
            this.time - i.time < 5.0
        );

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize
if (typeof THREE !== 'undefined') {
    new RealisticWater();
} else {
    setTimeout(() => new RealisticWater(), 100);
}
