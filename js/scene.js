/* ============================================
   SCENE — Three.js 3D Solar System Engine
   Full-featured: bloom, corona, trails, focus,
   comparison, flyover, elliptical orbits, moons,
   minimap, constellations, comet, spacecraft,
   gravity sim, scale toggle, PiP, share, LOD
   ============================================ */

const SolarScene = (() => {
  let scene, camera, renderer, orbitControls, composer;
  let raycaster, mouse;
  let planetMeshes = [];
  let orbitLines = [];
  let sunMesh, sunGlow, coronaParticles;
  let moonMesh, moonAngle = 0;
  let hoverLabel;
  let paused = false;
  let speed = 1;
  let clock;
  let orbitsVisible = true;
  let earthAngleTotal = 0;
  let trailsEnabled = true;
  let comparisonMode = false;
  let savedPositions = [];

  // Camera focus
  let focusTarget = null;
  let focusLerp = 0;
  let focusFrom = null;
  let focusTargetPos = null;
  let focusCamOffset = new THREE.Vector3(0, 8, 20);

  // Intro flyover
  let introActive = true;
  let introElapsed = 0;
  const introDuration = 6;
  const introWaypoints = [
    { pos: new THREE.Vector3(200, 120, 300) },
    { pos: new THREE.Vector3(80, 40, 120) },
    { pos: new THREE.Vector3(0, 80, 150) }
  ];

  // Moons
  let jupiterMoons = [];
  let titanMesh = null, titanAngle = 0;
  let phobosMesh = null, deimosMesh = null, phobosAngle = 0, deimosAngle = 0;
  let tritonMesh = null, tritonAngle = 0;
  const jupiterMoonAngles = [0, Math.PI/2, Math.PI, Math.PI*1.5];

  // Earth extras
  let earthAtmosphere = null;
  let earthNightLights = null;

  // Rings
  let lensFlareSprites = [];

  // Minimap
  let minimapCamera = null, minimapRenderer = null;

  // Guided tour
  let tourActive = false, tourIndex = 0, tourTimer = 0;
  const tourDwell = 5;
  const tourOrder = ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'];

  // Comet
  let cometMesh = null, cometTrailParticles = null;
  let cometAngle = 0;
  const cometOrbit = 160, cometEcc = 0.85, cometSpeed = 0.02;

  // Constellations
  let constellationGroup = null;
  let constellationsVisible = false;

  // Spacecraft paths
  let voyager1Line = null, voyager2Line = null;
  let spacecraftVisible = false;

  // Scale mode
  let realisticScale = false;
  const prettyOrbits = {};
  const realisticOrbits = {};

  // Gravity simulation
  let gravityMode = false;
  let gravityVelocities = [];

  // PiP
  let pipActive = false;
  let pipCamera = null, pipRenderer = null;
  let pipTarget = null;

  // Loading
  let loadingManager;
  let textureLoader;

  // Planet configuration
  // inclination in radians, realOrbit in scaled AU
  const planetConfig = [
    { key:'mercury',  radius:1.2, orbit:18,  speed:4.15,  tilt:0.03,  rotSpeed:0.01,   segments:24, texture:'assets/images/mercury.jpg', eccentricity:0.2056, inclination:0.122, realOrbit:7.7 },
    { key:'venus',    radius:1.8, orbit:25,  speed:1.62,  tilt:3.09,  rotSpeed:-0.004, segments:28, texture:'assets/images/venus.jpg',   eccentricity:0.0068, inclination:0.059, realOrbit:14.5 },
    { key:'earth',    radius:2.0, orbit:33,  speed:1.0,   tilt:0.41,  rotSpeed:0.03,   segments:32, texture:'assets/images/earth.jpg',   eccentricity:0.0167, inclination:0,     realOrbit:20 },
    { key:'mars',     radius:1.4, orbit:42,  speed:0.53,  tilt:0.44,  rotSpeed:0.028,  segments:24, texture:'assets/images/mars.jpg',    eccentricity:0.0934, inclination:0.032, realOrbit:30.5 },
    { key:'jupiter',  radius:5.0, orbit:62,  speed:0.084, tilt:0.05,  rotSpeed:0.07,   segments:40, texture:'assets/images/jupiter.jpg', eccentricity:0.0484, inclination:0.023, realOrbit:104 },
    { key:'saturn',   radius:4.2, orbit:78,  speed:0.034, tilt:0.47,  rotSpeed:0.065,  segments:36, texture:'assets/images/saturn.jpg',  eccentricity:0.0539, inclination:0.043, realOrbit:191 },
    { key:'uranus',   radius:3.0, orbit:95,  speed:0.012, tilt:1.71,  rotSpeed:-0.05,  segments:28, texture:'assets/images/uranus.jpg',  eccentricity:0.0473, inclination:0.013, realOrbit:384 },
    { key:'neptune',  radius:2.8, orbit:112, speed:0.006, tilt:0.49,  rotSpeed:0.054,  segments:28, texture:'assets/images/neptune.jpg', eccentricity:0.0086, inclination:0.031, realOrbit:601 },
    { key:'pluto',    radius:0.8, orbit:125, speed:0.004, tilt:2.14,  rotSpeed:-0.01,  segments:16, texture:'assets/images/pluto.jpg',   eccentricity:0.2488, inclination:0.299, realOrbit:790 }
  ];

  // Store pretty orbits for scale toggle
  planetConfig.forEach(c => {
    prettyOrbits[c.key] = c.orbit;
    realisticOrbits[c.key] = c.realOrbit;
  });

  function init() {
    hoverLabel = document.getElementById('hover-label');
    clock = new THREE.Clock();

    // Loading manager
    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      const bar = document.getElementById('loading-bar');
      const text = document.getElementById('loading-text');
      if (bar) bar.style.width = pct + '%';
      if (text) text.textContent = 'Loading textures... ' + pct + '%';
    };
    loadingManager.onLoad = () => {
      const loader = document.getElementById('loading-screen');
      if (loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 600); }
    };
    loadingManager.onError = () => {
      const loader = document.getElementById('loading-screen');
      if (loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 600); }
    };
    textureLoader = new THREE.TextureLoader(loadingManager);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.copy(introWaypoints[0].pos);

    // Renderer
    const canvas = document.getElementById('scene');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    setupBloom();

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 900;
    orbitControls.maxPolarAngle = Math.PI * 0.85;
    orbitControls.enabled = false;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Build scene
    createLights();
    createSun();
    createCorona();
    createLensFlare();
    createStarfield();
    createPlanets();
    createMoon();
    createJupiterMoons();
    createTitanMoon();
    createMarsMoons();
    createTriton();
    createAsteroidBelt();
    createOrbitRings();
    createComet();
    createConstellations();
    createSpacecraftPaths();
    setupMinimap();
    setupPiP();

    // Load state from URL if present
    loadFromUrl();

    // Events
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    animate();
  }

  // ==================== POST-PROCESSING ====================

  function setupBloom() {
    if (typeof THREE.EffectComposer !== 'undefined') {
      const renderPass = new THREE.RenderPass(scene, camera);
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85
      );
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
    }
  }

  // ==================== LIGHTING ====================

  function createLights() {
    const pointLight = new THREE.PointLight(0xfff0dd, 2, 800);
    scene.add(pointLight);
    scene.add(new THREE.AmbientLight(0x404060, 0.15));
  }

  // ==================== SUN ====================

  function createSun() {
    const geo = new THREE.SphereGeometry(8, 48, 48);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    sunMesh = new THREE.Mesh(geo, mat);
    sunMesh.userData = { key: 'sun', isSun: true };
    scene.add(sunMesh);

    const spriteMat = new THREE.SpriteMaterial({
      map: createGlowTexture(), color: 0xff8800,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    sunGlow = new THREE.Sprite(spriteMat);
    sunGlow.scale.set(40, 40, 1);
    scene.add(sunGlow);
  }

  function createGlowTexture() {
    const size = 256, c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255,200,50,1)');
    g.addColorStop(0.2, 'rgba(255,150,0,0.6)');
    g.addColorStop(0.5, 'rgba(255,100,0,0.2)');
    g.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  // ==================== LENS FLARE ====================

  function createLensFlare() {
    const tex = createFlareTexture();
    const colors = [0xffffff, 0xff8800, 0x4488ff, 0xff8800];
    const scales = [3, 5, 2, 4];
    const offsets = [0.1, 0.3, 0.5, 0.7];
    for (let i = 0; i < colors.length; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex, color: colors[i], transparent: true, opacity: 0.15,
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(scales[i], scales[i], 1);
      sprite.userData.flareOffset = offsets[i];
      sprite.visible = false;
      scene.add(sprite);
      lensFlareSprites.push(sprite);
    }
  }

  function createFlareTexture() {
    const size = 128, c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.3)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  function updateLensFlare() {
    if (!sunMesh || lensFlareSprites.length === 0) return;
    const ss = sunMesh.position.clone().project(camera);
    const vis = ss.z < 1 && Math.abs(ss.x) < 1.2 && Math.abs(ss.y) < 1.2;
    const c2s = new THREE.Vector3(ss.x, ss.y, 0);
    const fd = c2s.clone().negate();
    for (const sprite of lensFlareSprites) {
      sprite.visible = vis;
      if (vis) {
        const sp = c2s.clone().add(fd.clone().multiplyScalar(sprite.userData.flareOffset));
        sprite.position.copy(new THREE.Vector3(sp.x, sp.y, 0.99).unproject(camera));
        sprite.material.opacity = 0.12 * (1 - Math.abs(ss.x) * 0.5);
      }
    }
  }

  // ==================== CORONA ====================

  function createCorona() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 8.5 + Math.random() * 3;
      positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
      velocities.push({ r, theta, phi, speed: 0.2 + Math.random() * 0.5, maxR: 8.5 + Math.random() * 6 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    coronaParticles = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xff8833, size: 0.6, sizeAttenuation: true,
      transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    coronaParticles.userData.velocities = velocities;
    scene.add(coronaParticles);
  }

  // ==================== STARFIELD ====================

  function createStarfield() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 400 + Math.random() * 200;
      positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.8, sizeAttenuation: true, transparent: true, opacity: 0.8
    })));
  }

  // ==================== PLANETS ====================

  function createPlanets() {
    planetMeshes = [];
    gravityVelocities = [];

    for (const cfg of planetConfig) {
      const geo = new THREE.SphereGeometry(cfg.radius, cfg.segments, cfg.segments);
      const mat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1, color: 0xaaaaaa });

      // Load texture + generate bump map
      textureLoader.load(cfg.texture, (tex) => {
        mat.map = tex;
        mat.bumpMap = tex;
        mat.bumpScale = 0.02;
        mat.color.set(0xffffff);
        mat.needsUpdate = true;
      });

      const mesh = new THREE.Mesh(geo, mat);
      const startAngle = Math.random() * Math.PI * 2;

      mesh.userData = {
        key: cfg.key,
        orbitRadius: cfg.orbit,
        orbitSpeed: cfg.speed,
        eccentricity: cfg.eccentricity,
        inclination: cfg.inclination,
        angle: startAngle,
        tilt: cfg.tilt,
        rotationSpeed: cfg.rotSpeed,
        trail: [], trailLine: null
      };

      mesh.rotation.z = cfg.tilt;

      // Initial position with eccentricity + inclination
      positionPlanet(mesh);

      scene.add(mesh);
      planetMeshes.push(mesh);

      // Gravity velocity (tangential to orbit)
      const orbitR = cfg.orbit;
      const vMag = cfg.speed * 0.5;
      gravityVelocities.push({
        vx: -Math.sin(startAngle) * vMag,
        vy: 0,
        vz: Math.cos(startAngle) * vMag,
        mass: cfg.radius * cfg.radius * cfg.radius // proportional to volume
      });

      if (cfg.key === 'saturn') createSaturnRings(mesh);
      if (cfg.key === 'uranus') createUranusRings(mesh);
      if (cfg.key === 'neptune') createNeptuneRings(mesh);
      if (cfg.key === 'earth') {
        createEarthAtmosphere(mesh);
        createEarthNightLights(mesh);
      }

      createTrailLine(mesh);
    }
  }

  function positionPlanet(mesh) {
    const d = mesh.userData;
    const e = d.eccentricity;
    const a = d.orbitRadius;
    const r = a * (1 - e * e) / (1 + e * Math.cos(d.angle));
    mesh.position.x = Math.cos(d.angle) * r;
    mesh.position.z = Math.sin(d.angle) * r;
    mesh.position.y = Math.sin(d.angle) * r * Math.sin(d.inclination);
  }

  // ==================== EARTH EXTRAS ====================

  function createEarthAtmosphere(earthMesh) {
    const geo = new THREE.SphereGeometry(2.3, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.12,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    earthAtmosphere = new THREE.Mesh(geo, mat);
    earthMesh.add(earthAtmosphere);
    earthAtmosphere.rotation.z = -earthMesh.userData.tilt;
  }

  function createEarthNightLights(earthMesh) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, size, size);

    // Draw city light clusters (approximate major population centers)
    const cities = [
      [0.52, 0.28], [0.55, 0.32], [0.48, 0.30], // Europe
      [0.72, 0.30], [0.75, 0.35], [0.78, 0.32], // East Asia
      [0.68, 0.35], [0.65, 0.33],                 // South Asia
      [0.25, 0.32], [0.28, 0.35], [0.22, 0.38], // North America
      [0.30, 0.55], [0.32, 0.58],                 // South America
      [0.52, 0.45], [0.55, 0.48],                 // Africa
      [0.83, 0.60], [0.85, 0.55],                 // Australia
    ];

    for (const [cx, cy] of cities) {
      const px = cx * size, py = cy * size;
      // City glow
      const g = ctx.createRadialGradient(px, py, 0, px, py, 8);
      g.addColorStop(0, 'rgba(255,200,100,0.8)');
      g.addColorStop(0.5, 'rgba(255,180,50,0.3)');
      g.addColorStop(1, 'rgba(255,150,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - 8, py - 8, 16, 16);
      // Small dots around
      for (let d = 0; d < 5; d++) {
        const dx = px + (Math.random() - 0.5) * 12;
        const dy = py + (Math.random() - 0.5) * 12;
        ctx.fillStyle = 'rgba(255,200,100,0.5)';
        ctx.fillRect(dx, dy, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(c);
    const geo = new THREE.SphereGeometry(2.02, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.FrontSide
    });
    earthNightLights = new THREE.Mesh(geo, mat);
    earthMesh.add(earthNightLights);
    earthNightLights.rotation.z = -earthMesh.userData.tilt;
  }

  // ==================== RINGS ====================

  function createSaturnRings(mesh) {
    const geo = new THREE.RingGeometry(5.5, 9, 64);
    fixRingUV(geo, 5.5, 3.5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xd2be8c, side: THREE.DoubleSide, transparent: true, opacity: 0.45
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2 + 0.47;
    mesh.add(ring);
  }

  function createUranusRings(mesh) {
    const geo = new THREE.RingGeometry(4.0, 5.2, 64);
    fixRingUV(geo, 4.0, 1.2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x8899aa, side: THREE.DoubleSide, transparent: true, opacity: 0.2
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2 + 1.71; // Uranus extreme tilt
    mesh.add(ring);
  }

  function createNeptuneRings(mesh) {
    const geo = new THREE.RingGeometry(3.8, 4.8, 64);
    fixRingUV(geo, 3.8, 1.0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x556688, side: THREE.DoubleSide, transparent: true, opacity: 0.12
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2 + 0.49;
    mesh.add(ring);
  }

  function fixRingUV(geo, innerR, width) {
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      uv.setXY(i, (Math.sqrt(x*x + y*y) - innerR) / width, 0.5);
    }
  }

  // ==================== TRAILS ====================

  function createTrailLine(mesh) {
    const max = 120;
    const positions = new Float32Array(max * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    const color = Planets.data[mesh.userData.key] ?
      new THREE.Color(Planets.data[mesh.userData.key].color) : 0xffffff;
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }));
    mesh.userData.trailLine = line;
    mesh.userData.trailPositions = positions;
    mesh.userData.trailIndex = 0;
    mesh.userData.trailCount = 0;
    mesh.userData.trailMax = max;
    mesh.userData.trailTimer = 0;
    scene.add(line);
  }

  function updateTrail(mesh, delta) {
    if (!trailsEnabled) return;
    const d = mesh.userData;
    d.trailTimer += delta;
    if (d.trailTimer < 0.15) return;
    d.trailTimer = 0;
    const idx = d.trailIndex * 3;
    d.trailPositions[idx] = mesh.position.x;
    d.trailPositions[idx+1] = mesh.position.y;
    d.trailPositions[idx+2] = mesh.position.z;
    d.trailIndex = (d.trailIndex + 1) % d.trailMax;
    if (d.trailCount < d.trailMax) d.trailCount++;
    d.trailLine.geometry.attributes.position.needsUpdate = true;
    d.trailLine.geometry.setDrawRange(0, d.trailCount);
  }

  // ==================== MOONS ====================

  function createMoon() {
    const geo = new THREE.SphereGeometry(0.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, color: 0xaaaaaa });
    textureLoader.load('assets/images/moon.jpg', (tex) => {
      mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
    });
    moonMesh = new THREE.Mesh(geo, mat);
    scene.add(moonMesh);
  }

  function createJupiterMoons() {
    const data = [
      { name:'Io', radius:0.4, orbitR:7.5, speed:6.0, color:0xccbb44 },
      { name:'Europa', radius:0.35, orbitR:9.5, speed:4.5, color:0xccccdd },
      { name:'Ganymede', radius:0.5, orbitR:12, speed:3.0, color:0xaa9977 },
      { name:'Callisto', radius:0.45, orbitR:15, speed:2.0, color:0x887766 }
    ];
    jupiterMoons = [];
    data.forEach((md, i) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(md.radius, 12, 12),
        new THREE.MeshStandardMaterial({ color: md.color, roughness: 0.9 })
      );
      mesh.userData = { orbitR: md.orbitR, speed: md.speed, angle: jupiterMoonAngles[i] };
      scene.add(mesh);
      jupiterMoons.push(mesh);
    });
  }

  function createTitanMoon() {
    titanMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xddaa55, roughness: 0.8 })
    );
    scene.add(titanMesh);
  }

  function createMarsMoons() {
    phobosMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x998877, roughness: 0.95 })
    );
    deimosMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.95 })
    );
    scene.add(phobosMesh);
    scene.add(deimosMesh);
  }

  function createTriton() {
    tritonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xaabbcc, roughness: 0.85 })
    );
    scene.add(tritonMesh);
  }

  // ==================== ASTEROID BELT (Instanced) ====================

  function createAsteroidBelt() {
    const count = 800;
    const baseGeo = new THREE.SphereGeometry(0.15, 4, 4);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xb4a896, roughness: 1.0, metalness: 0.1
    });

    if (typeof THREE.InstancedMesh !== 'undefined') {
      const instancedMesh = new THREE.InstancedMesh(baseGeo, baseMat, count);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 48 + Math.random() * 8;
        const y = (Math.random() - 0.5) * 3;
        dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        const s = 0.3 + Math.random() * 1.4;
        dummy.scale.set(s, s * (0.5 + Math.random() * 0.5), s);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.userData.isAsteroidBelt = true;
      scene.add(instancedMesh);
    } else {
      // Fallback to points
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 48 + Math.random() * 8;
        positions[i*3] = Math.cos(angle) * r;
        positions[i*3+1] = (Math.random() - 0.5) * 3;
        positions[i*3+2] = Math.sin(angle) * r;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const belt = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xb4a896, size: 0.4, sizeAttenuation: true, transparent: true, opacity: 0.6
      }));
      belt.userData.isAsteroidBelt = true;
      scene.add(belt);
    }
  }

  // ==================== ORBIT RINGS ====================

  function createOrbitRings() {
    // Remove existing
    for (const line of orbitLines) scene.remove(line);
    orbitLines = [];

    for (const cfg of planetConfig) {
      const points = [];
      const segments = 128;
      const a = cfg.orbit;
      const e = cfg.eccentricity;
      const inc = cfg.inclination;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
        points.push(new THREE.Vector3(
          Math.cos(angle) * r,
          Math.sin(angle) * r * Math.sin(inc),
          Math.sin(angle) * r
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.1
      }));
      line.userData.key = cfg.key;
      scene.add(line);
      orbitLines.push(line);
    }
  }

  // ==================== COMET ====================

  function createComet() {
    // Comet nucleus
    cometMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xccddff })
    );
    scene.add(cometMesh);

    // Comet tail particles
    const count = 150;
    const positions = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    cometTrailParticles = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x88aaff, size: 0.3, sizeAttenuation: true,
      transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    cometTrailParticles.userData.tailPositions = [];
    scene.add(cometTrailParticles);
  }

  function updateComet(t) {
    if (!cometMesh) return;
    cometAngle += cometSpeed * t;
    const r = cometOrbit * (1 - cometEcc * cometEcc) / (1 + cometEcc * Math.cos(cometAngle));
    cometMesh.position.set(
      Math.cos(cometAngle) * r,
      Math.sin(cometAngle * 0.3) * 8,
      Math.sin(cometAngle) * r
    );

    // Update tail
    const tail = cometTrailParticles.userData.tailPositions;
    tail.unshift(cometMesh.position.clone());
    if (tail.length > 150) tail.pop();

    const arr = cometTrailParticles.geometry.attributes.position.array;
    for (let i = 0; i < 150; i++) {
      if (i < tail.length) {
        // Add slight spread to tail
        arr[i*3]   = tail[i].x + (Math.random()-0.5) * 0.3 * (i/150);
        arr[i*3+1] = tail[i].y + (Math.random()-0.5) * 0.3 * (i/150);
        arr[i*3+2] = tail[i].z + (Math.random()-0.5) * 0.3 * (i/150);
      } else {
        arr[i*3] = arr[i*3+1] = arr[i*3+2] = 0;
      }
    }
    cometTrailParticles.geometry.attributes.position.needsUpdate = true;
  }

  // ==================== CONSTELLATIONS ====================

  function createConstellations() {
    constellationGroup = new THREE.Group();
    constellationGroup.visible = false;

    const R = 500;
    // Major constellations: [name, [[ra1,dec1,ra2,dec2], ...]] in simplified coords
    const constellationData = {
      'Orion': [
        [5.6,-1.2, 5.4,6.3], [5.4,6.3, 5.9,7.4], [5.9,7.4, 5.7,-9.7],
        [5.7,-9.7, 5.6,-1.2], [5.6,-1.2, 5.2,-8.2], [5.6,-1.2, 5.9,-1.9],
        [5.2,-8.2, 5.4,-2.6], [5.9,-1.9, 5.7,-2.6]
      ],
      'BigDipper': [
        [11.1,61.8, 11.0,56.4], [11.0,56.4, 12.3,57.0], [12.3,57.0, 12.9,55.9],
        [12.9,55.9, 13.4,49.3], [13.4,49.3, 13.8,49.3], [13.8,49.3, 14.0,54.9]
      ],
      'Cassiopeia': [
        [0.2,59.1, 0.7,56.5], [0.7,56.5, 0.9,60.7], [0.9,60.7, 1.4,60.2], [1.4,60.2, 1.9,63.7]
      ],
      'Scorpius': [
        [16.5,-26.4, 16.0,-22.6], [16.0,-22.6, 15.9,-26.1], [15.9,-26.1, 16.4,-28.2],
        [16.4,-28.2, 16.8,-34.3], [16.8,-34.3, 17.2,-37.1], [17.2,-37.1, 17.6,-39.0],
        [17.6,-39.0, 17.5,-42.9]
      ],
      'Leo': [
        [10.1,12.0, 10.3,19.8], [10.3,19.8, 11.2,20.5], [11.2,20.5, 11.8,14.6],
        [11.8,14.6, 10.1,12.0], [10.1,12.0, 9.8,23.8], [9.8,23.8, 10.3,19.8]
      ],
      'Cygnus': [
        [20.7,45.3, 19.5,28.0], [19.8,35.1, 20.4,40.3], [20.4,40.3, 21.0,43.9]
      ],
      'Gemini': [
        [7.6,31.9, 7.1,30.2], [7.1,30.2, 6.6,25.1], [7.8,28.0, 7.1,22.5],
        [7.6,31.9, 7.8,28.0]
      ],
      'SouthernCross': [
        [12.4,-63.1, 12.8,-59.7], [12.3,-57.1, 12.5,-63.4]
      ]
    };

    function raDecToVec(ra, dec) {
      const raRad = (ra / 24) * Math.PI * 2;
      const decRad = (dec / 180) * Math.PI;
      return new THREE.Vector3(
        R * Math.cos(decRad) * Math.cos(raRad),
        R * Math.sin(decRad),
        R * Math.cos(decRad) * Math.sin(raRad)
      );
    }

    for (const [name, lines] of Object.entries(constellationData)) {
      const points = [];
      for (const seg of lines) {
        points.push(raDecToVec(seg[0], seg[1]));
        points.push(raDecToVec(seg[2], seg[3]));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
        color: 0x4466aa, transparent: true, opacity: 0.4
      }));
      constellationGroup.add(line);

      // Star dots at vertices
      const starPts = [];
      for (const seg of lines) {
        starPts.push(raDecToVec(seg[0], seg[1]));
        starPts.push(raDecToVec(seg[2], seg[3]));
      }
      const starGeo = new THREE.BufferGeometry().setFromPoints(starPts);
      constellationGroup.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0x88aaff, size: 2, sizeAttenuation: true
      })));
    }

    scene.add(constellationGroup);
  }

  // ==================== SPACECRAFT PATHS ====================

  function createSpacecraftPaths() {
    // Voyager 1: launched 1977, flew by Jupiter then Saturn, heading north
    const v1Points = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const r = 33 + t * 350;
      const angle = -0.5 + t * 2.5;
      const y = t * t * 100;
      v1Points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const v1Geo = new THREE.BufferGeometry().setFromPoints(v1Points);
    voyager1Line = new THREE.Line(v1Geo, new THREE.LineBasicMaterial({
      color: 0x44ff44, transparent: true, opacity: 0.3
    }));
    voyager1Line.visible = false;
    scene.add(voyager1Line);

    // Voyager 2: launched 1977, grand tour (Jupiter, Saturn, Uranus, Neptune)
    const v2Points = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const r = 33 + t * 400;
      const angle = 0.5 + t * 4.0;
      const y = -t * t * 40;
      v2Points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const v2Geo = new THREE.BufferGeometry().setFromPoints(v2Points);
    voyager2Line = new THREE.Line(v2Geo, new THREE.LineBasicMaterial({
      color: 0xff8844, transparent: true, opacity: 0.3
    }));
    voyager2Line.visible = false;
    scene.add(voyager2Line);
  }

  // ==================== MINIMAP ====================

  function setupMinimap() {
    const mc = document.getElementById('minimap-canvas');
    if (!mc) return;
    minimapCamera = new THREE.OrthographicCamera(-140, 140, 140, -140, 1, 1000);
    minimapCamera.position.set(0, 200, 0);
    minimapCamera.lookAt(0, 0, 0);
    minimapRenderer = new THREE.WebGLRenderer({ canvas: mc, antialias: false, alpha: true });
    minimapRenderer.setSize(180, 180);
    minimapRenderer.setClearColor(0x000000, 0.3);
  }

  // ==================== PIP (Picture-in-Picture) ====================

  function setupPiP() {
    const pc = document.getElementById('pip-canvas');
    if (!pc) return;
    pipCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    pipRenderer = new THREE.WebGLRenderer({ canvas: pc, antialias: false, alpha: true });
    pipRenderer.setSize(200, 200);
    pipRenderer.setClearColor(0x000000, 0.5);
  }

  function renderPiP() {
    if (!pipActive || !pipRenderer || !pipCamera || !pipTarget) return;
    const mesh = pipTarget === 'sun' ? sunMesh :
      planetMeshes.find(m => m.userData.key === pipTarget);
    if (!mesh) return;
    const r = mesh.geometry ? mesh.geometry.parameters.radius : 8;
    pipCamera.position.set(
      mesh.position.x + r * 3,
      mesh.position.y + r * 2,
      mesh.position.z + r * 3
    );
    pipCamera.lookAt(mesh.position);
    pipRenderer.render(scene, pipCamera);
  }

  // ==================== SCREENSHOT ====================

  function takeScreenshot() {
    if (composer) composer.render();
    else renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = 'solar-system-screenshot.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
  }

  // ==================== GRAVITY SIMULATION ====================

  function updateGravity(dt) {
    if (!gravityMode || comparisonMode) return;
    const G = 50; // gravitational constant (tuned for visual)
    const sunMass = 5000;

    for (let i = 0; i < planetMeshes.length; i++) {
      const pi = planetMeshes[i];
      const vi = gravityVelocities[i];

      // Sun gravity
      const dx = -pi.position.x, dy = -pi.position.y, dz = -pi.position.z;
      const dist2 = dx*dx + dy*dy + dz*dz;
      const dist = Math.sqrt(dist2);
      if (dist > 1) {
        const F = G * sunMass / dist2;
        const ax = F * dx / dist, ay = F * dy / dist, az = F * dz / dist;
        vi.vx += ax * dt;
        vi.vy += ay * dt;
        vi.vz += az * dt;
      }

      // Planet-planet gravity (simplified — only from Jupiter)
      const jIdx = planetConfig.findIndex(c => c.key === 'jupiter');
      if (i !== jIdx && jIdx >= 0) {
        const pj = planetMeshes[jIdx];
        const vj = gravityVelocities[jIdx];
        const ddx = pj.position.x - pi.position.x;
        const ddy = pj.position.y - pi.position.y;
        const ddz = pj.position.z - pi.position.z;
        const d2 = ddx*ddx + ddy*ddy + ddz*ddz;
        const d = Math.sqrt(d2);
        if (d > 2) {
          const f = G * vj.mass * 0.5 / d2;
          vi.vx += f * ddx / d * dt;
          vi.vy += f * ddy / d * dt;
          vi.vz += f * ddz / d * dt;
        }
      }

      // Update position
      pi.position.x += vi.vx * dt;
      pi.position.y += vi.vy * dt;
      pi.position.z += vi.vz * dt;
    }
  }

  // ==================== SCALE TOGGLE ====================

  function toggleScale() {
    realisticScale = !realisticScale;
    const orbits = realisticScale ? realisticOrbits : prettyOrbits;

    for (const mesh of planetMeshes) {
      mesh.userData.orbitRadius = orbits[mesh.userData.key];
      positionPlanet(mesh);
    }

    // Update max camera distance
    orbitControls.maxDistance = realisticScale ? 1200 : 900;

    // Rebuild orbit rings with new radii
    const oldOrbits = planetConfig.map(c => c.orbit);
    for (let i = 0; i < planetConfig.length; i++) {
      planetConfig[i].orbit = orbits[planetConfig[i].key];
    }
    createOrbitRings();
    // Restore config for later toggle
    for (let i = 0; i < planetConfig.length; i++) {
      planetConfig[i].orbit = oldOrbits[i];
    }

    return realisticScale;
  }

  // ==================== SHARE URL ====================

  function getShareUrl() {
    const p = camera.position;
    const t = orbitControls.target;
    const params = new URLSearchParams({
      cx: p.x.toFixed(1), cy: p.y.toFixed(1), cz: p.z.toFixed(1),
      tx: t.x.toFixed(1), ty: t.y.toFixed(1), tz: t.z.toFixed(1),
      s: speed.toFixed(1)
    });
    return window.location.origin + window.location.pathname + '?' + params.toString();
  }

  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('cx')) {
      const cx = parseFloat(params.get('cx'));
      const cy = parseFloat(params.get('cy'));
      const cz = parseFloat(params.get('cz'));
      const tx = parseFloat(params.get('tx')) || 0;
      const ty = parseFloat(params.get('ty')) || 0;
      const tz = parseFloat(params.get('tz')) || 0;

      // Skip intro if loading from URL
      introActive = false;
      orbitControls.enabled = true;
      camera.position.set(cx, cy, cz);
      orbitControls.target.set(tx, ty, tz);

      if (params.has('s')) {
        speed = parseFloat(params.get('s'));
      }
      orbitControls.saveState();
    }
  }

  // ==================== ANIMATION LOOP ====================

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Intro flyover
    if (introActive) {
      introElapsed += delta;
      const t = Math.min(introElapsed / introDuration, 1);
      const eased = smoothStep(t);
      const wpCount = introWaypoints.length;
      const segment = eased * (wpCount - 1);
      const idx0 = Math.floor(segment);
      const idx1 = Math.min(idx0 + 1, wpCount - 1);
      const segEased = smoothStep(segment - idx0);
      camera.position.lerpVectors(introWaypoints[idx0].pos, introWaypoints[idx1].pos, segEased);
      camera.lookAt(0, 0, 0);
      if (t >= 1) {
        introActive = false;
        orbitControls.enabled = true;
        orbitControls.target.set(0, 0, 0);
        orbitControls.saveState();
      }
    }

    if (!paused) {
      const t = speed * delta;

      if (gravityMode) {
        updateGravity(t);
        // Still do self-rotation and trails
        for (const mesh of planetMeshes) {
          mesh.rotation.y += mesh.userData.rotationSpeed * t;
          if (mesh.userData.key === 'earth') {
            earthAngleTotal += mesh.userData.orbitSpeed * t * 0.5;
          }
          updateTrail(mesh, t);
        }
      } else {
        // Normal Keplerian orbits
        for (const mesh of planetMeshes) {
          if (comparisonMode) continue;
          const d = mesh.userData;
          d.angle += d.orbitSpeed * t * 0.5;
          positionPlanet(mesh);
          mesh.rotation.y += d.rotationSpeed * t;
          if (d.key === 'earth') earthAngleTotal += d.orbitSpeed * t * 0.5;
          updateTrail(mesh, t);
        }
      }

      // Earth's Moon
      if (moonMesh && !comparisonMode) {
        const earth = planetMeshes.find(m => m.userData.key === 'earth');
        if (earth) {
          moonAngle += t * 4;
          moonMesh.position.set(
            earth.position.x + Math.cos(moonAngle) * 4,
            earth.position.y + Math.sin(moonAngle * 0.5) * 0.5,
            earth.position.z + Math.sin(moonAngle) * 4
          );
        }
      }

      // Jupiter moons
      if (jupiterMoons.length > 0 && !comparisonMode) {
        const jupiter = planetMeshes.find(m => m.userData.key === 'jupiter');
        if (jupiter) {
          for (const jm of jupiterMoons) {
            jm.userData.angle += jm.userData.speed * t * 0.5;
            jm.position.set(
              jupiter.position.x + Math.cos(jm.userData.angle) * jm.userData.orbitR,
              jupiter.position.y + Math.sin(jm.userData.angle * 0.3) * 0.3,
              jupiter.position.z + Math.sin(jm.userData.angle) * jm.userData.orbitR
            );
          }
        }
      }

      // Titan
      if (titanMesh && !comparisonMode) {
        const saturn = planetMeshes.find(m => m.userData.key === 'saturn');
        if (saturn) {
          titanAngle += t * 2.5;
          titanMesh.position.set(
            saturn.position.x + Math.cos(titanAngle) * 12,
            saturn.position.y + Math.sin(titanAngle * 0.4) * 0.5,
            saturn.position.z + Math.sin(titanAngle) * 12
          );
        }
      }

      // Mars moons
      if (phobosMesh && deimosMesh && !comparisonMode) {
        const mars = planetMeshes.find(m => m.userData.key === 'mars');
        if (mars) {
          phobosAngle += t * 8;
          deimosAngle += t * 3;
          phobosMesh.position.set(
            mars.position.x + Math.cos(phobosAngle) * 2.5,
            mars.position.y + 0.1,
            mars.position.z + Math.sin(phobosAngle) * 2.5
          );
          deimosMesh.position.set(
            mars.position.x + Math.cos(deimosAngle) * 3.5,
            mars.position.y - 0.1,
            mars.position.z + Math.sin(deimosAngle) * 3.5
          );
        }
      }

      // Triton (retrograde orbit around Neptune)
      if (tritonMesh && !comparisonMode) {
        const neptune = planetMeshes.find(m => m.userData.key === 'neptune');
        if (neptune) {
          tritonAngle -= t * 2; // retrograde
          tritonMesh.position.set(
            neptune.position.x + Math.cos(tritonAngle) * 5,
            neptune.position.y + Math.sin(tritonAngle * 0.5) * 0.8,
            neptune.position.z + Math.sin(tritonAngle) * 5
          );
        }
      }

      // Asteroid belt rotation
      scene.children.forEach(child => {
        if (child.userData && child.userData.isAsteroidBelt) child.rotation.y += t * 0.02;
      });

      // Sun pulse
      if (sunMesh) {
        const pulse = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.03;
        sunMesh.scale.setScalar(pulse);
        if (sunGlow) sunGlow.scale.setScalar(40 * pulse);
      }

      // Corona
      if (coronaParticles) {
        const pos = coronaParticles.geometry.attributes.position.array;
        const vels = coronaParticles.userData.velocities;
        for (let i = 0; i < vels.length; i++) {
          const v = vels[i];
          v.r += v.speed * t;
          if (v.r > v.maxR) { v.r = 8.5; v.theta = Math.random()*Math.PI*2; v.phi = Math.acos(2*Math.random()-1); }
          pos[i*3] = v.r*Math.sin(v.phi)*Math.cos(v.theta);
          pos[i*3+1] = v.r*Math.sin(v.phi)*Math.sin(v.theta);
          pos[i*3+2] = v.r*Math.cos(v.phi);
        }
        coronaParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Comet
      updateComet(t);

      updateTimeDisplay();
    }

    // Tour
    if (tourActive) {
      tourTimer += delta;
      if (tourTimer >= tourDwell) {
        tourTimer = 0;
        tourIndex = (tourIndex + 1) % tourOrder.length;
        tourStep();
      }
    }

    // Focus animation
    if (focusTarget) {
      focusLerp += delta * 2;
      if (focusLerp >= 1) { focusLerp = 1; focusTarget = null; }
      const t = smoothStep(focusLerp);
      const mesh = focusTarget === 'sun' ? sunMesh :
        planetMeshes.find(m => m.userData.key === focusTarget);
      if (mesh) {
        const tp = mesh.position.clone().add(focusCamOffset);
        orbitControls.target.lerp(mesh.position, t);
        camera.position.lerp(tp, t);
      }
    }

    updateLensFlare();

    if (!introActive) orbitControls.update();

    // Main render
    if (composer) composer.render();
    else renderer.render(scene, camera);

    // Minimap
    if (minimapRenderer && minimapCamera) minimapRenderer.render(scene, minimapCamera);

    // PiP
    renderPiP();
  }

  function smoothStep(t) { return t * t * (3 - 2 * t); }

  function updateTimeDisplay() {
    const d = document.getElementById('time-display');
    if (d) d.textContent = (earthAngleTotal / (Math.PI * 2)).toFixed(2) + ' Earth years';
  }

  // ==================== INTERACTION ====================

  function onClick(e) {
    if (introActive) return;
    if (e.target.closest('.controls-bar,.info-panel,.planet-nav,.minimap,.pip-container,.tour-overlay,.search-container')) return;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    const sunHits = raycaster.intersectObject(sunMesh);
    if (sunHits.length > 0) { Planets.showInfo('sun'); focusOnPlanet('sun'); return; }
    const hits = raycaster.intersectObjects(planetMeshes);
    if (hits.length > 0) {
      const key = hits[0].object.userData.key;
      Planets.showInfo(key);
      highlightOrbit(key);
      focusOnPlanet(key);
    }
  }

  function onMouseMove(e) {
    if (introActive) return;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects([...planetMeshes, sunMesh]);
    if (hits.length > 0) {
      const mesh = hits[0].object;
      const key = mesh.userData.key;
      let name = key === 'sun' ? 'Sun' : (Planets.data[key] ? Planets.data[key].name : key);
      if (key === 'pluto') name += ' (Dwarf)';
      const pos = mesh.position.clone();
      pos.y += (mesh.geometry ? mesh.geometry.parameters.radius : 8) + 1.5;
      pos.project(camera);
      hoverLabel.textContent = name;
      hoverLabel.style.left = ((pos.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      hoverLabel.style.top = ((-pos.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      hoverLabel.classList.add('visible');
      renderer.domElement.style.cursor = 'pointer';
    } else {
      hoverLabel.classList.remove('visible');
      renderer.domElement.style.cursor = 'grab';
    }
  }

  function updateMouse(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  // ==================== FOCUS ====================

  function focusOnPlanet(key) {
    const mesh = key === 'sun' ? sunMesh : planetMeshes.find(m => m.userData.key === key);
    if (!mesh) return;
    focusTarget = key;
    focusLerp = 0;
    focusFrom = camera.position.clone();
    const r = mesh.geometry ? mesh.geometry.parameters.radius : 8;
    focusCamOffset = new THREE.Vector3(0, r * 3, r * 6);
    focusTargetPos = mesh.position.clone().add(focusCamOffset);

    // Update PiP target
    pipTarget = key;
  }

  // ==================== TOUR ====================

  function startTour() { tourActive = true; tourIndex = 0; tourTimer = 0; tourStep(); }
  function stopTour() {
    tourActive = false;
    const el = document.getElementById('tour-overlay');
    if (el) el.classList.remove('visible');
  }
  function tourStep() {
    const key = tourOrder[tourIndex];
    focusOnPlanet(key);
    Planets.showInfo(key);
    const el = document.getElementById('tour-overlay');
    const counter = document.getElementById('tour-counter');
    if (el) el.classList.add('visible');
    if (counter) counter.textContent = (tourIndex + 1) + ' / ' + tourOrder.length;
  }

  // ==================== TOGGLES ====================

  function highlightOrbit(key) {
    for (const line of orbitLines) {
      if (line.userData.key === key) { line.material.opacity = 0.5; line.material.color.set(0x64b5f6); }
      else { line.material.opacity = orbitsVisible ? 0.1 : 0; line.material.color.set(0xffffff); }
    }
  }
  function clearHighlight() {
    for (const line of orbitLines) { line.material.opacity = orbitsVisible ? 0.1 : 0; line.material.color.set(0xffffff); }
  }
  function toggleOrbits() {
    orbitsVisible = !orbitsVisible;
    for (const line of orbitLines) line.material.opacity = orbitsVisible ? 0.1 : 0;
    return orbitsVisible;
  }
  function toggleTrails() {
    trailsEnabled = !trailsEnabled;
    if (!trailsEnabled) {
      for (const mesh of planetMeshes) {
        mesh.userData.trailCount = 0; mesh.userData.trailIndex = 0;
        mesh.userData.trailLine.geometry.setDrawRange(0, 0);
      }
    }
    return trailsEnabled;
  }

  function toggleConstellations() {
    constellationsVisible = !constellationsVisible;
    if (constellationGroup) constellationGroup.visible = constellationsVisible;
    return constellationsVisible;
  }

  function toggleSpacecraft() {
    spacecraftVisible = !spacecraftVisible;
    if (voyager1Line) voyager1Line.visible = spacecraftVisible;
    if (voyager2Line) voyager2Line.visible = spacecraftVisible;
    return spacecraftVisible;
  }

  function toggleGravity() {
    gravityMode = !gravityMode;
    if (!gravityMode) {
      // Reset to Keplerian positions
      for (let i = 0; i < planetMeshes.length; i++) {
        const cfg = planetConfig[i];
        const mesh = planetMeshes[i];
        positionPlanet(mesh);
        // Reset velocity
        const vMag = cfg.speed * 0.5;
        gravityVelocities[i].vx = -Math.sin(mesh.userData.angle) * vMag;
        gravityVelocities[i].vy = 0;
        gravityVelocities[i].vz = Math.cos(mesh.userData.angle) * vMag;
      }
    }
    return gravityMode;
  }

  function togglePiP(key) {
    if (key) pipTarget = key;
    pipActive = !pipActive;
    const el = document.getElementById('pip-container');
    if (el) el.style.display = pipActive ? 'block' : 'none';
    return pipActive;
  }

  // ==================== COMPARISON MODE ====================

  function toggleComparison() {
    comparisonMode = !comparisonMode;
    const allMoons = [moonMesh, titanMesh, phobosMesh, deimosMesh, tritonMesh, ...jupiterMoons];

    if (comparisonMode) {
      savedPositions = planetMeshes.map(m => ({ key: m.userData.key, pos: m.position.clone() }));
      let xOff = -40;
      const sorted = [...planetMeshes].sort((a,b) => a.geometry.parameters.radius - b.geometry.parameters.radius);
      for (const mesh of sorted) {
        const r = mesh.geometry.parameters.radius;
        xOff += r + 1; mesh.position.set(xOff, 0, 0); xOff += r + 2;
      }
      for (const line of orbitLines) line.visible = false;
      for (const mesh of planetMeshes) if (mesh.userData.trailLine) mesh.userData.trailLine.visible = false;
      for (const m of allMoons) if (m) m.visible = false;
      if (cometMesh) cometMesh.visible = false;
      if (cometTrailParticles) cometTrailParticles.visible = false;
      camera.position.set(0, 15, 60);
      orbitControls.target.set(0, 0, 0);
    } else {
      for (const saved of savedPositions) {
        const mesh = planetMeshes.find(m => m.userData.key === saved.key);
        if (mesh) mesh.position.copy(saved.pos);
      }
      for (const line of orbitLines) line.visible = true;
      for (const mesh of planetMeshes) if (mesh.userData.trailLine) mesh.userData.trailLine.visible = trailsEnabled;
      for (const m of allMoons) if (m) m.visible = true;
      if (cometMesh) cometMesh.visible = true;
      if (cometTrailParticles) cometTrailParticles.visible = true;
      orbitControls.reset();
    }
    return comparisonMode;
  }

  // ==================== RESIZE ====================

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  }

  function resetCamera() {
    focusTarget = null;
    if (comparisonMode) toggleComparison();
    orbitControls.reset();
  }

  function setPaused(val) { paused = val; }
  function setSpeed(val) { speed = val; }

  // ==================== PUBLIC API ====================

  return {
    init, resetCamera, setPaused, setSpeed,
    clearHighlight, toggleOrbits, toggleTrails, toggleComparison,
    focusOnPlanet, takeScreenshot, startTour, stopTour,
    toggleConstellations, toggleSpacecraft, toggleScale, toggleGravity, togglePiP,
    getShareUrl,
    get paused() { return paused; },
    get speed() { return speed; },
    get orbitControls() { return orbitControls; },
    get planetMeshes() { return planetMeshes; },
    get tourActive() { return tourActive; },
    get realisticScale() { return realisticScale; },
    get gravityMode() { return gravityMode; },
    get constellationsVisible() { return constellationsVisible; },
    get spacecraftVisible() { return spacecraftVisible; },
    get pipActive() { return pipActive; }
  };
})();
