import * as THREE from 'three';

export interface ColliderBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  type?: 'ground' | 'wall' | 'cover' | 'ramp';
}

export interface ArenaResult {
  scene: THREE.Scene;
  colliders: ColliderBox[];
  spawnPointsPlayer: THREE.Vector3[];
  spawnPointsBot: THREE.Vector3[];
  particles: THREE.Points;
  updateParticles: (delta: number) => void;
}

export function buildArena(scene: THREE.Scene): ArenaResult {
  const colliders: ColliderBox[] = [];

  // Ground plane (80m x 80m combat zone)
  const groundGeo = new THREE.PlaneGeometry(84, 84, 16, 16);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x22242b,
    roughness: 0.9,
    metalness: 0.15,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  colliders.push({
    min: new THREE.Vector3(-42, -1, -42),
    max: new THREE.Vector3(42, 0, 42),
    type: 'ground',
  });

  // Tactical ground markings / asphalt road grid
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.85,
  });
  const centerRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, 80), roadMat);
  centerRoad.rotation.x = -Math.PI / 2;
  centerRoad.position.set(0, 0.02, 0);
  centerRoad.receiveShadow = true;
  scene.add(centerRoad);

  const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(80, 14), roadMat);
  crossRoad.rotation.x = -Math.PI / 2;
  crossRoad.position.set(0, 0.02, 0);
  crossRoad.receiveShadow = true;
  scene.add(crossRoad);

  // Tactical yellow hazard stripe line
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
  for (let i = -30; i <= 30; i += 8) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 4), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.03, i);
    scene.add(stripe);
  }

  // --- PERIMETER WALLS ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x333742,
    roughness: 0.8,
    metalness: 0.3,
  });

  const wallThickness = 2;
  const wallHeight = 7;
  const mapSize = 40;

  // North wall
  createObstacle(scene, colliders, new THREE.Vector3(0, wallHeight / 2, -mapSize), new THREE.Vector3(mapSize * 2 + 2, wallHeight, wallThickness), wallMat);
  // South wall
  createObstacle(scene, colliders, new THREE.Vector3(0, wallHeight / 2, mapSize), new THREE.Vector3(mapSize * 2 + 2, wallHeight, wallThickness), wallMat);
  // East wall
  createObstacle(scene, colliders, new THREE.Vector3(mapSize, wallHeight / 2, 0), new THREE.Vector3(wallThickness, wallHeight, mapSize * 2 + 2), wallMat);
  // West wall
  createObstacle(scene, colliders, new THREE.Vector3(-mapSize, wallHeight / 2, 0), new THREE.Vector3(wallThickness, wallHeight, mapSize * 2 + 2), wallMat);

  // --- SHIPPING CONTAINERS ---
  const containerColors = [0x991b1b, 0x1e40af, 0x854d0e, 0x166534, 0x374151];
  const containerGeo = new THREE.BoxGeometry(3, 3, 7);

  const containerSpecs = [
    // Center cluster (Call of Duty Rust & Shipment style corridors)
    { pos: new THREE.Vector3(-6, 1.5, -4), rot: 0, colorIdx: 0 },
    { pos: new THREE.Vector3(-6, 4.5, -4), rot: 0, colorIdx: 1 }, // Stacked container
    { pos: new THREE.Vector3(6, 1.5, -4), rot: 0, colorIdx: 2 },
    { pos: new THREE.Vector3(-6, 1.5, 6), rot: Math.PI / 2, colorIdx: 3 },
    { pos: new THREE.Vector3(8, 1.5, 8), rot: -Math.PI / 4, colorIdx: 4 },
    { pos: new THREE.Vector3(-14, 1.5, -14), rot: Math.PI / 2, colorIdx: 1 },
    { pos: new THREE.Vector3(14, 1.5, -16), rot: 0, colorIdx: 0 },
    { pos: new THREE.Vector3(-18, 1.5, 12), rot: 0, colorIdx: 2 },
    { pos: new THREE.Vector3(16, 1.5, 14), rot: Math.PI / 2, colorIdx: 3 },
    { pos: new THREE.Vector3(0, 1.5, 18), rot: 0, colorIdx: 1 },
    { pos: new THREE.Vector3(-22, 1.5, -2), rot: Math.PI / 2, colorIdx: 4 },
    { pos: new THREE.Vector3(22, 1.5, -4), rot: 0, colorIdx: 0 },
  ];

  containerSpecs.forEach((spec) => {
    const mat = new THREE.MeshStandardMaterial({
      color: containerColors[spec.colorIdx],
      roughness: 0.65,
      metalness: 0.45,
    });
    const container = new THREE.Mesh(containerGeo, mat);
    container.position.copy(spec.pos);
    container.rotation.y = spec.rot;
    container.castShadow = true;
    container.receiveShadow = true;
    scene.add(container);

    // Compute oriented bounding box or simplified AABB for collision
    const size = new THREE.Vector3(3.2, 3.2, 7.2);
    if (Math.abs(spec.rot) > 0.5) {
      size.set(7.2, 3.2, 3.2);
    }
    colliders.push({
      min: new THREE.Vector3(spec.pos.x - size.x / 2, spec.pos.y - size.y / 2, spec.pos.z - size.z / 2),
      max: new THREE.Vector3(spec.pos.x + size.x / 2, spec.pos.y + size.y / 2, spec.pos.z + size.z / 2),
      type: 'wall',
    });
  });

  // --- CENTRAL WATCHTOWER & PLATFORM ---
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.7,
    metalness: 0.5,
  });

  // 4 Tower Legs
  const legGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
  [
    new THREE.Vector3(-2.5, 3, -2.5),
    new THREE.Vector3(2.5, 3, -2.5),
    new THREE.Vector3(-2.5, 3, 2.5),
    new THREE.Vector3(2.5, 3, 2.5),
  ].forEach((pos) => {
    const leg = new THREE.Mesh(legGeo, towerMat);
    leg.position.copy(pos);
    leg.castShadow = true;
    scene.add(leg);
  });

  // Elevated Platform
  createObstacle(scene, colliders, new THREE.Vector3(0, 5.8, 0), new THREE.Vector3(7, 0.4, 7), towerMat);

  // Platform Railings
  const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
  createObstacle(scene, colliders, new THREE.Vector3(0, 6.5, -3.4), new THREE.Vector3(7, 1.2, 0.2), railMat);
  createObstacle(scene, colliders, new THREE.Vector3(-3.4, 6.5, 0), new THREE.Vector3(0.2, 1.2, 7), railMat);
  createObstacle(scene, colliders, new THREE.Vector3(3.4, 6.5, 0), new THREE.Vector3(0.2, 1.2, 7), railMat);

  // Tactical Access Ramp leading to platform
  const rampGeo = new THREE.BoxGeometry(2.4, 0.3, 11);
  const ramp = new THREE.Mesh(rampGeo, towerMat);
  ramp.position.set(0, 2.8, 7.5);
  ramp.rotation.x = 0.52; // incline
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  scene.add(ramp);

  // --- TACTICAL COVER: CONCRETE BARRIERS & CRATES ---
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.95,
  });

  const barrierPositions = [
    new THREE.Vector3(-4, 0.6, -12),
    new THREE.Vector3(4, 0.6, -12),
    new THREE.Vector3(-12, 0.6, 0),
    new THREE.Vector3(12, 0.6, 0),
    new THREE.Vector3(-8, 0.6, 12),
    new THREE.Vector3(8, 0.6, 12),
    new THREE.Vector3(-20, 0.6, -20),
    new THREE.Vector3(20, 0.6, 20),
    new THREE.Vector3(-20, 0.6, 20),
    new THREE.Vector3(20, 0.6, -20),
  ];

  barrierPositions.forEach((pos) => {
    createObstacle(scene, colliders, pos, new THREE.Vector3(3.2, 1.2, 0.8), concreteMat, 'cover');
  });

  // Wooden Ammo Crates
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x78563b,
    roughness: 0.85,
  });
  const cratePositions = [
    new THREE.Vector3(-10, 0.8, -6),
    new THREE.Vector3(-10, 0.8, -4.5),
    new THREE.Vector3(-10, 2.2, -5.2), // stacked crate
    new THREE.Vector3(12, 0.8, -8),
    new THREE.Vector3(12, 0.8, 8),
    new THREE.Vector3(-16, 0.8, 5),
    new THREE.Vector3(18, 0.8, -12),
  ];
  cratePositions.forEach((pos) => {
    createObstacle(scene, colliders, pos, new THREE.Vector3(1.5, 1.5, 1.5), crateMat, 'cover');
  });

  // Explosive Fuel Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 12);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.5,
    metalness: 0.4,
  });
  const barrelPositions = [
    new THREE.Vector3(-15, 0.7, -8),
    new THREE.Vector3(15, 0.7, 5),
    new THREE.Vector3(-5, 0.7, 24),
    new THREE.Vector3(7, 0.7, -22),
  ];
  barrelPositions.forEach((bPos) => {
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.copy(bPos);
    barrel.castShadow = true;
    scene.add(barrel);
    colliders.push({
      min: new THREE.Vector3(bPos.x - 0.6, 0, bPos.z - 0.6),
      max: new THREE.Vector3(bPos.x + 0.6, 1.5, bPos.z + 0.6),
      type: 'cover',
    });
  });

  // --- FLOATING DUST PARTICLES ATMOSPHERE ---
  const particleCount = 200;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 70;
    particlePositions[i + 1] = Math.random() * 8;
    particlePositions[i + 2] = (Math.random() - 0.5) * 70;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xca8a04,
    size: 0.08,
    transparent: true,
    opacity: 0.45,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const updateParticles = (delta: number) => {
    const positions = particleGeo.attributes.position.array as Float32Array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= delta * 0.3;
      if (positions[i] < 0) positions[i] = 8;
    }
    particleGeo.attributes.position.needsUpdate = true;
  };

  // --- SPAWN POINTS ---
  const spawnPointsPlayer = [
    new THREE.Vector3(0, 1.8, 28),
    new THREE.Vector3(-22, 1.8, 24),
    new THREE.Vector3(22, 1.8, 24),
  ];

  const spawnPointsBot = [
    new THREE.Vector3(0, 1.8, -28),
    new THREE.Vector3(-24, 1.8, -24),
    new THREE.Vector3(24, 1.8, -24),
    new THREE.Vector3(-25, 1.8, 0),
    new THREE.Vector3(25, 1.8, 0),
    new THREE.Vector3(0, 6.8, 0), // Watchtower sniper spawn
  ];

  return {
    scene,
    colliders,
    spawnPointsPlayer,
    spawnPointsBot,
    particles,
    updateParticles,
  };
}

function createObstacle(
  scene: THREE.Scene,
  colliders: ColliderBox[],
  pos: THREE.Vector3,
  size: THREE.Vector3,
  mat: THREE.Material,
  type: 'wall' | 'cover' | 'ground' = 'wall'
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
  mesh.position.copy(pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  colliders.push({
    min: new THREE.Vector3(pos.x - size.x / 2, pos.y - size.y / 2, pos.z - size.z / 2),
    max: new THREE.Vector3(pos.x + size.x / 2, pos.y + size.y / 2, pos.z + size.z / 2),
    type,
  });
}
