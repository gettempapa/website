// Photorealistic water simulation - Unreal Engine quality
class PhotorealisticWater {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.waterMesh = null;
        this.reflectionTarget = null;
        this.clock = new THREE.Clock();
        this.time = 0;
        this.touches = new Map();

        this.init();
        this.createEnvironment();
        this.createWater();
        this.setupInteraction();
        this.animate();
    }

    init() {
        // Scene with realistic sky
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 300);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);

        // WebGL2 Renderer
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', {
            alpha: true,
            antialias: true,
            stencil: false,
            depth: true,
            powerPreference: 'high-performance'
        });

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            context: context,
            antialias: true,
            alpha: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.renderer.domElement.setAttribute('data-engine', 'three.js');
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        document.body.appendChild(this.renderer.domElement);

        // Create reflection render target
        this.reflectionTarget = new THREE.WebGLRenderTarget(
            window.innerWidth * 0.5,
            window.innerHeight * 0.5,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            }
        );
    }

    createEnvironment() {
        // Sun
        const sun = new THREE.DirectionalLight(0xFFFFDD, 2.5);
        sun.position.set(100, 100, 50);
        this.scene.add(sun);

        // Ambient
        const ambient = new THREE.AmbientLight(0x87CEEB, 0.8);
        this.scene.add(ambient);

        // Sky dome for reflections
        const skyGeo = new THREE.SphereGeometry(500, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition).y;
                    vec3 color = mix(bottomColor, topColor, max(pow(max(h, 0.0), 0.5), 0.0));
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) }
            },
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
    }

    createWater() {
        // ULTRA high resolution - 512x512 for absolutely smooth surface
        const geometry = new THREE.PlaneGeometry(300, 300, 512, 512);
        geometry.rotateX(-Math.PI / 2);

        // Photorealistic water shader
        const waterMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                precision highp float;

                uniform float time;
                uniform sampler2D normalMap;
                uniform vec3 interactions[20];
                uniform float interactionData[20]; // strength + time packed

                varying vec3 vWorldPos;
                varying vec3 vNormal;
                varying vec3 vViewDir;
                varying vec2 vUv;
                varying float vWaveHeight;

                // High quality Simplex noise 3D
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }

                // Ultra smooth FBM with 8 octaves
                float fbm(vec3 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for(int i = 0; i < 8; i++) {
                        value += amplitude * snoise(p);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    // Multi-layered ultra-smooth waves
                    vec3 p1 = vec3(position.x * 0.02, position.z * 0.02, time * 0.1);
                    vec3 p2 = vec3(position.x * 0.05, position.z * 0.05, time * 0.15);
                    vec3 p3 = vec3(position.x * 0.1, position.z * 0.1, time * 0.2);

                    float wave = fbm(p1) * 0.5 + fbm(p2) * 0.25 + fbm(p3) * 0.15;
                    pos.y += wave * 0.8;

                    // Smooth user interactions
                    for(int i = 0; i < 20; i++) {
                        vec3 inter = interactions[i];
                        if(inter.z > 0.0) {
                            float dist = distance(position.xz, inter.xy);
                            float age = time - inter.z;

                            // Physics-based wave
                            float waveRadius = age * 4.0;
                            float wave = sin((dist - waveRadius) * 1.5) * exp(-dist * 0.05);
                            wave *= exp(-age * 0.6);
                            wave *= interactionData[i];

                            pos.y += wave * 1.5;
                        }
                    }

                    vWaveHeight = pos.y;

                    // Ultra-smooth normal calculation
                    float eps = 0.5;
                    vec3 p = position;
                    float h = pos.y;
                    float hx = h + fbm(vec3((p.x + eps) * 0.02, p.z * 0.02, time * 0.1)) * 0.5;
                    float hz = h + fbm(vec3(p.x * 0.02, (p.z + eps) * 0.02, time * 0.1)) * 0.5;

                    vec3 dx = vec3(eps, hx - h, 0.0);
                    vec3 dz = vec3(0.0, hz - h, eps);
                    vec3 normal = normalize(cross(dz, dx));

                    vNormal = normalize(normalMatrix * normal);

                    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
                    vWorldPos = worldPos.xyz;
                    vViewDir = normalize(cameraPosition - worldPos.xyz);

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;

                uniform float time;
                uniform vec3 cameraPosition;
                uniform samplerCube envMap;

                varying vec3 vWorldPos;
                varying vec3 vNormal;
                varying vec3 vViewDir;
                varying vec2 vUv;
                varying float vWaveHeight;

                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewDir);

                    // Photorealistic water colors
                    vec3 waterDeep = vec3(0.0, 0.05, 0.15);
                    vec3 waterShallow = vec3(0.0, 0.2, 0.3);
                    vec3 waterSurface = vec3(0.0, 0.35, 0.5);

                    // Depth gradient
                    float centerDist = length(vWorldPos.xz) / 150.0;
                    vec3 baseColor = mix(waterSurface, mix(waterShallow, waterDeep, centerDist), centerDist);

                    // Ultra-realistic Fresnel
                    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.0);

                    // Sky reflection
                    vec3 reflectDir = reflect(-viewDir, normal);
                    vec3 skyColor = mix(
                        vec3(0.5, 0.7, 1.0),
                        vec3(0.05, 0.2, 0.4),
                        reflectDir.y * 0.5 + 0.5
                    );

                    // Combine water color with reflection
                    vec3 color = mix(baseColor, skyColor, fresnel * 0.85);

                    // Subsurface scattering
                    vec3 sunDir = normalize(vec3(1.0, 1.0, 0.5));
                    float scatter = pow(max(dot(-viewDir, sunDir), 0.0), 3.0);
                    color += vec3(0.1, 0.3, 0.4) * scatter * 0.4;

                    // Chromatic caustics (ultra smooth)
                    float causticR = sin(vWorldPos.x * 3.0 + time * 0.4) * cos(vWorldPos.z * 2.5 - time * 0.3);
                    float causticG = sin(vWorldPos.x * 2.7 - time * 0.5) * cos(vWorldPos.z * 3.2 + time * 0.25);
                    float causticB = sin(vWorldPos.x * 3.3 + time * 0.35) * cos(vWorldPos.z * 2.8 - time * 0.4);

                    causticR = smoothstep(0.2, 1.0, (causticR + 1.0) * 0.5);
                    causticG = smoothstep(0.2, 1.0, (causticG + 1.0) * 0.5);
                    causticB = smoothstep(0.2, 1.0, (causticB + 1.0) * 0.5);

                    vec3 caustics = vec3(causticR * 0.1, causticG * 0.12, causticB * 0.15);
                    color += caustics;

                    // Ultra-sharp specular (sun reflection)
                    vec3 halfDir = normalize(sunDir + viewDir);
                    float spec = pow(max(dot(normal, halfDir), 0.0), 256.0);
                    color += vec3(1.0, 0.95, 0.9) * spec * 1.5;

                    // Foam at peaks
                    float foam = smoothstep(0.4, 0.9, vWaveHeight);
                    color = mix(color, vec3(0.9, 0.95, 1.0), foam * 0.4);

                    // Atmospheric scattering
                    float viewDist = length(vWorldPos - cameraPosition);
                    float fog = 1.0 - exp(-viewDist * 0.003);
                    color = mix(color, vec3(0.7, 0.85, 1.0), fog * 0.3);

                    // HDR tone mapping
                    color = color / (color + vec3(1.0));
                    color = pow(color, vec3(1.0 / 2.2));

                    gl_FragColor = vec4(color, 0.98);
                }
            `,
            uniforms: {
                time: { value: 0 },
                cameraPosition: { value: this.camera.position },
                normalMap: { value: null },
                envMap: { value: null },
                interactions: { value: Array(20).fill(new THREE.Vector3(9999, 9999, 0)) },
                interactionData: { value: Array(20).fill(0) }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.waterMesh = new THREE.Mesh(geometry, waterMaterial);
        this.scene.add(this.waterMesh);
    }

    setupInteraction() {
        let interactionIndex = 0;

        const addWave = (x, y, strength) => {
            const mouse = new THREE.Vector2(x, y);
            this.raycaster.setFromCamera(mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.waterMesh);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                const uniforms = this.waterMesh.material.uniforms;

                uniforms.interactions.value[interactionIndex].set(point.x, point.z, this.time);
                uniforms.interactionData.value[interactionIndex] = strength;

                interactionIndex = (interactionIndex + 1) % 20;
            }
        };

        this.raycaster = new THREE.Raycaster();

        // Touch
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                const x = (touch.clientX / window.innerWidth) * 2 - 1;
                const y = -(touch.clientY / window.innerHeight) * 2 + 1;
                this.touches.set(touch.identifier, { x, y, time: Date.now() });
                addWave(x, y, 1.0);
            });
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                const x = (touch.clientX / window.innerWidth) * 2 - 1;
                const y = -(touch.clientY / window.innerHeight) * 2 + 1;
                const last = this.touches.get(touch.identifier);

                if (last && Date.now() - last.time > 30) {
                    const dx = x - last.x;
                    const dy = y - last.y;
                    const speed = Math.sqrt(dx * dx + dy * dy);
                    addWave(x, y, Math.min(0.6 + speed * 4, 1.5));
                    this.touches.set(touch.identifier, { x, y, time: Date.now() });
                }
            });
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.touches.delete(touch.identifier);
            });
        }, { passive: false });

        // Mouse
        let lastMouse = { x: 0, y: 0, time: 0 };
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            const now = Date.now();

            if (now - lastMouse.time > 30) {
                const dx = x - lastMouse.x;
                const dy = y - lastMouse.y;
                const speed = Math.sqrt(dx * dx + dy * dy);
                if (speed > 0.005) {
                    addWave(x, y, Math.min(0.4 + speed * 3, 1.0));
                }
                lastMouse = { x, y, time: now };
            }
        });

        document.addEventListener('click', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            addWave(x, y, 1.2);
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.time += this.clock.getDelta();
        this.waterMesh.material.uniforms.time.value = this.time;

        // Smooth camera drift
        this.camera.position.x = Math.sin(this.time * 0.03) * 4;
        this.camera.position.y = 15 + Math.sin(this.time * 0.02) * 1.5;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize
if (typeof THREE !== 'undefined') {
    new PhotorealisticWater();
} else {
    setTimeout(() => new PhotorealisticWater(), 100);
}
