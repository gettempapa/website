// Astronaut (OBJ/MTL) loader and WASD controls
(function() {
  const THREE_NS = window.THREE;
  if (!THREE_NS) return;

  let renderer, scene, camera, clock;
  let astronaut, mixer;
  let keys = { w: false, a: false, s: false, d: false };

  function init() {
    const container = document.body;

    // Renderer
    renderer = new THREE_NS.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE_NS.sRGBEncoding;
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '3';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // Scene & camera
    scene = new THREE_NS.Scene();
    camera = new THREE_NS.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 4);

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

    clock = new THREE_NS.Clock();

    loadAstronaut();

    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    animate();
  }

  function loadAstronaut() {
    const manager = new THREE_NS.LoadingManager();
    const mtlLoader = new THREE_NS.MTLLoader(manager);
    const objLoader = new THREE_NS.OBJLoader(manager);

    // Use relative paths so the browser can load assets from the served directory
    const base = 'armstrong_suit-web_model/';
    const mtlPath = base + 'suit_ext-part_01-high.mtl';
    const objPath = base + 'suit_ext-part_01-high.obj';

    mtlLoader.setPath(base);
    mtlLoader.load('suit_ext-part_01-high.mtl', (materials) => {
      materials.preload();
      objLoader.setMaterials(materials);
      objLoader.setPath(base);
      objLoader.load('suit_ext-part_01-high.obj', (obj) => {
        astronaut = obj;
        astronaut.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        astronaut.scale.set(0.01, 0.01, 0.01);
        astronaut.position.set(0, 0, 0);
        scene.add(astronaut);
      });
    });
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

  // Delay init until Three.js has loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


