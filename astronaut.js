// Astronaut (OBJ/MTL) loader and WASD controls
(function() {
  const THREE_NS = window.THREE;
  if (!THREE_NS) return;

  let renderer, scene, camera, clock;
  let astronaut, mixer;
  let keys = { w: false, a: false, s: false, d: false };
  let statusEl;

  function init() {
    const container = document.body;

    // Status overlay
    statusEl = document.createElement('div');
    statusEl.style.position = 'fixed';
    statusEl.style.top = '8px';
    statusEl.style.right = '8px';
    statusEl.style.zIndex = '300';
    statusEl.style.padding = '6px 10px';
    statusEl.style.fontFamily = 'monospace';
    statusEl.style.fontSize = '12px';
    statusEl.style.color = '#0ff';
    statusEl.style.background = 'rgba(0,0,0,0.35)';
    statusEl.style.border = '1px solid rgba(0,255,255,0.4)';
    statusEl.textContent = 'Astronaut: initializing...';
    container.appendChild(statusEl);

    // Renderer
    renderer = new THREE_NS.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE_NS.sRGBEncoding;
    renderer.setClearAlpha(0);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    // Ensure above other visual layers but below UI/walker
    renderer.domElement.style.zIndex = '150';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // Scene & camera
    scene = new THREE_NS.Scene();
    camera = new THREE_NS.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 4);
    camera.lookAt(new THREE_NS.Vector3(0, 1, 0));

    // Lights
    scene.add(new THREE_NS.AmbientLight(0xffffff, 0.8));
    const dir = new THREE_NS.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 10, 5);
    scene.add(dir);

    // Ground reference (invisible receiver)
    const ground = new THREE_NS.Mesh(
      new THREE_NS.PlaneGeometry(50, 50),
      new THREE_NS.MeshBasicMaterial({ visible: false })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Visual helpers (temporary):
    const grid = new THREE_NS.GridHelper(20, 20, 0x00ffff, 0x004444);
    grid.material.opacity = 0.15;
    grid.material.transparent = true;
    scene.add(grid);

    const axes = new THREE_NS.AxesHelper(1.5);
    scene.add(axes);

    clock = new THREE_NS.Clock();

    loadAstronaut();

    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    animate();
  }

  function loadAstronaut() {
    const manager = new THREE_NS.LoadingManager();
    manager.onStart = (url, itemsLoaded, itemsTotal) => {
      setStatus('Loading assets...');
    };
    manager.onLoad = () => setStatus('Assets loaded');
    manager.onError = (url) => setStatus('Error loading: ' + url);
    const mtlLoader = new THREE_NS.MTLLoader(manager);
    const objLoader = new THREE_NS.OBJLoader(manager);

    // Use relative paths so the browser can load assets from the served directory
    const base = 'armstrong_suit-web_model/';

    function fitAndAdd(model) {
      astronaut = model;
      astronaut.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Auto-fit to ~1.8m height and center at ground
      // Compute size first
      let box = new THREE_NS.Box3().setFromObject(astronaut);
      const size = new THREE_NS.Vector3();
      box.getSize(size);
      const targetHeight = 1.8;
      const scale = size.y > 0 ? targetHeight / size.y : 1.0;
      astronaut.scale.setScalar(scale);
      // Recompute bounds after scale, then center and place on ground
      box = new THREE_NS.Box3().setFromObject(astronaut);
      const center = new THREE_NS.Vector3();
      box.getCenter(center);
      astronaut.position.sub(center);
      astronaut.position.y -= box.min.y; // place on ground
      scene.add(astronaut);
      setStatus('Astronaut ready (WASD)');
    }

    function loadWithMTL(stem) {
      mtlLoader.setPath(base);
      mtlLoader.setResourcePath(base);
      mtlLoader.load(stem + '.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.setPath(base);
        objLoader.setResourcePath(base);
        objLoader.load(stem + '.obj', (obj) => {
          fitAndAdd(obj);
        }, undefined, (err) => {
          console.warn('OBJ load with MTL failed, falling back to OBJ only', err);
          // On error try OBJ without MTL
          objLoader.setMaterials(null);
          objLoader.setPath(base);
          objLoader.load(stem + '.obj', (obj) => fitAndAdd(obj), undefined, (err2) => {
            console.error('OBJ load failed', err2);
            setStatus('OBJ failed: ' + stem + '.obj');
            tryNextStem();
          });
        });
      }, undefined, (err) => {
        console.warn('MTL load failed, trying OBJ directly', err);
        // If MTL missing, try OBJ directly
        objLoader.setPath(base);
        objLoader.setResourcePath(base);
        objLoader.load(stem + '.obj', (obj) => fitAndAdd(obj), undefined, (err2) => {
          console.error('OBJ load failed', err2);
          setStatus('OBJ failed: ' + stem + '.obj');
          tryNextStem();
        });
      });
    }

    const stems = [
      'hard_surf_decimated',
      'suit_ext-part_01-high',
      'suit_ext-part_02-high',
      'suit_ext-part_03-high',
      'interior_high'
    ];
    let stemIndex = 0;
    function tryNextStem() {
      stemIndex += 1;
      if (stemIndex < stems.length) {
        setStatus('Trying ' + stems[stemIndex] + '...');
        loadWithMTL(stems[stemIndex]);
      } else {
        setStatus('All stems failed. Showing fallback cube.');
        addFallbackCube();
      }
    }
    setStatus('Loading ' + stems[0] + '...');
    loadWithMTL(stems[0]);
  }

  function addFallbackCube() {
    const geo = new THREE_NS.BoxGeometry(1, 1, 1);
    const mat = new THREE_NS.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.1, roughness: 0.8 });
    astronaut = new THREE_NS.Mesh(geo, mat);
    astronaut.position.set(0, 0.5, 0);
    scene.add(astronaut);
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
  }

  function update(delta) {
    if (!astronaut) return;

    const speed = 1.2; // m/s
    const move = new THREE_NS.Vector3();
    if (keys.w) move.z -= 1;
    if (keys.s) move.z += 1;
    if (keys.a) move.x -= 1;
    if (keys.d) move.x += 1;
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      astronaut.position.add(move);
      // Face movement direction
      const dir = Math.atan2(move.x, move.z);
      astronaut.rotation.y = dir;
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    update(delta);
    renderer.render(scene, camera);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = 'Astronaut: ' + text;
    console.log('[Astronaut]', text);
  }

  // Delay init until Three.js has loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


