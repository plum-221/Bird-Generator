import * as THREE from 'three';
import { buildBird } from './birdBuilder.js';
import { OUTDOOR_NPCS } from './outdoorWalkModel.js';

const backgroundUrl = new URL('./assets/outdoor/distant-meadow-v1.webp', import.meta.url).href;
const ink = '#604d3c';

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let n = value;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function ribbon(points, width, color) {
  const positions = [];
  const indices = [];
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const length = Math.hypot(dx, dz) || 1;
    const nx = -dz / length * width * 0.5;
    const nz = dx / length * width * 0.5;
    positions.push(points[i].x + nx, 0.025, points[i].z + nz);
    positions.push(points[i].x - nx, 0.025, points[i].z - nz);
    if (i < points.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshToonMaterial({ color }));
}

function sampledCurve(coords, divisions = 80) {
  const curve = new THREE.CatmullRomCurve3(coords.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.35);
  return curve.getPoints(divisions);
}

function addScenery(group) {
  const rand = seeded(2210728);
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.8, 7);
  const crownGeo = new THREE.DodecahedronGeometry(1.15, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshToonMaterial({ color: '#80654a' }), 54);
  const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshToonMaterial({ color: '#78a36d' }), 54);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 54; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 23 + rand() * 28;
    const scale = 0.75 + rand() * 1.1;
    transform.position.set(Math.cos(angle) * radius, 0.9 * scale, Math.sin(angle) * radius);
    transform.scale.setScalar(scale);
    transform.rotation.y = rand() * Math.PI;
    transform.updateMatrix();
    trunks.setMatrixAt(i, transform.matrix);
    transform.position.y = 2.25 * scale;
    transform.scale.set(scale * (0.85 + rand() * 0.25), scale, scale * (0.85 + rand() * 0.25));
    transform.updateMatrix();
    crowns.setMatrixAt(i, transform.matrix);
  }
  trunks.receiveShadow = true;
  crowns.castShadow = true;
  group.add(trunks, crowns);

  const flowerGeo = new THREE.SphereGeometry(0.105, 6, 4);
  const flowerColors = ['#fff2a8', '#f3a6a0', '#f7f0dd', '#a9c9ea'];
  for (let colorIndex = 0; colorIndex < flowerColors.length; colorIndex += 1) {
    const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshBasicMaterial({ color: flowerColors[colorIndex] }), 38);
    for (let i = 0; i < 38; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = 5 + rand() * 45;
      transform.position.set(Math.cos(angle) * radius, 0.14, Math.sin(angle) * radius);
      transform.scale.setScalar(0.7 + rand() * 0.9);
      transform.updateMatrix();
      flowers.setMatrixAt(i, transform.matrix);
    }
    group.add(flowers);
  }
}

export function createOutdoorScene(scene, params) {
  const group = new THREE.Group();
  group.name = 'outdoorWalkWorld';
  group.visible = false;

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(78, 96),
    new THREE.MeshToonMaterial({ color: '#b9cf8d' })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const mainPath = ribbon(sampledCurve([
    [0, 10], [-11, 4], [-17, -12], [-3, -27], [17, -22], [29, -5], [20, 15], [5, 24], [-14, 19], [-25, 7], [-17, -12],
  ], 120), 3.5, '#f0d4a3');
  const stream = ribbon(sampledCurve([[-49, -18], [-27, -12], [-10, -15], [8, -9], [26, -12], [50, -3]], 90), 3.8, '#82bfd0');
  group.add(mainPath, stream);

  const bridge = new THREE.Group();
  for (let i = -4; i <= 4; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.13, 3.7), new THREE.MeshToonMaterial({ color: i % 2 ? '#a97d58' : '#bc9068' }));
    plank.position.set(i * 0.72, 0.16 + Math.cos(i * 0.32) * 0.08, -11.8);
    plank.rotation.y = -0.18;
    plank.castShadow = true;
    bridge.add(plank);
  }
  group.add(bridge);
  addScenery(group);

  const panoramaMaterial = new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: '#e8f2dd' });
  const panorama = new THREE.Mesh(new THREE.CylinderGeometry(94, 94, 52, 48, 1, true), panoramaMaterial);
  panorama.position.y = 22;
  new THREE.TextureLoader().load(backgroundUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = 2;
    panoramaMaterial.map = texture;
    panoramaMaterial.needsUpdate = true;
  });
  group.add(panorama);

  const npcById = new Map();
  const prototypes = new Map();
  const player = buildBird({
    ...params,
    pose: 'standing',
    motionDebug: false,
    seed: Number(params.seed) || 2210728,
  }, 'draft');
  player.name = 'outdoorPlayerBird';
  player.scale.setScalar(0.92);
  player.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });
  group.add(player);
  for (const npc of OUTDOOR_NPCS) {
    if (!prototypes.has(npc.coatId)) {
      const prototype = buildBird({
        ...params,
        seed: 1300 + prototypes.size * 97,
        coatId: npc.coatId,
        pose: 'standing',
        motionDebug: false,
      }, 'draft');
      prototype.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = false;
          object.receiveShadow = false;
        }
      });
      prototypes.set(npc.coatId, prototype);
    }
    const model = prototypes.get(npc.coatId).clone(true);
    model.name = `outdoorNpc-${npc.id}`;
    model.position.set(npc.x, 0, npc.z);
    model.rotation.y = npc.heading ?? 0;
    model.scale.setScalar(npc.scale ?? 0.72);
    model.userData.outdoorNpcId = npc.id;
    model.userData.baseY = 0;
    group.add(model);
    npcById.set(npc.id, model);
  }

  scene.add(group);
  return {
    group,
    setVisible(visible) { group.visible = visible; },
    update(dt, elapsed, playerPosition) {
      if (!group.visible) return;
      player.position.y = Math.sin(elapsed * 7) * (playerPosition.moving ? 0.035 : 0.012);
      for (let i = 0; i < OUTDOOR_NPCS.length; i += 1) {
        const npc = OUTDOOR_NPCS[i];
        const model = npcById.get(npc.id);
        model.position.y = model.userData.baseY + Math.sin(elapsed * 1.7 + i * 0.9) * 0.035;
        const desired = Math.atan2(playerPosition.x - npc.x, playerPosition.z - npc.z);
        const near = Math.hypot(playerPosition.x - npc.x, playerPosition.z - npc.z) < 5;
        if (near) model.rotation.y += Math.atan2(Math.sin(desired - model.rotation.y), Math.cos(desired - model.rotation.y)) * Math.min(1, dt * 3);
      }
    },
    getNpcObject(id) { return npcById.get(id) ?? null; },
    getNpcCount() { return npcById.size; },
    setPlayerTransform(position) {
      player.position.x = position.x;
      player.position.z = position.z;
      player.rotation.y = position.heading;
    },
  };
}
