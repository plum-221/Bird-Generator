import * as THREE from 'three';
import { buildBird } from './birdBuilder.js';
import {
  OUTDOOR_GARDEN_CENTER,
  OUTDOOR_HOUSE_CENTER,
  OUTDOOR_NPCS,
  OUTDOOR_TREES,
  outdoorCropStage,
  outdoorTerrainHeight,
} from './outdoorWalkModel.js';

const backgroundUrl = new URL('./assets/outdoor/distant-meadow-v1.webp', import.meta.url).href;
const treeAtlasUrl = new URL('./assets/outdoor/storybook-tree-atlas-v1.webp', import.meta.url).href;
const materialAtlasUrl = new URL('./assets/outdoor/storybook-material-atlas-v1.webp', import.meta.url).href;
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

function toonGradient() {
  const data = new Uint8Array([42, 42, 42, 156, 156, 156, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

const gradient = toonGradient();
const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: gradient });
const atlasMaterialTargets = [];
let materialAtlasImage = null;
const materialAtlasTextures = new Map();
function applyAtlasTarget(target) {
  if (!materialAtlasImage) return;
  if (!materialAtlasTextures.has(target.quadrant)) {
    const halfWidth = Math.floor(materialAtlasImage.width / 2);
    const halfHeight = Math.floor(materialAtlasImage.height / 2);
    const [column, row] = target.quadrant.split('-').map(Number);
    const canvas = document.createElement('canvas');
    canvas.width = halfWidth;
    canvas.height = halfHeight;
    canvas.getContext('2d').drawImage(materialAtlasImage, column * halfWidth, row * halfHeight, halfWidth, halfHeight, 0, 0, halfWidth, halfHeight);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    materialAtlasTextures.set(target.quadrant, texture);
  }
  const texture = materialAtlasTextures.get(target.quadrant).clone();
  texture.repeat.set(target.repeat, target.repeat);
  texture.needsUpdate = true;
  target.material.map = texture;
  target.material.color.set('#ffffff');
  target.material.needsUpdate = true;
}
const atlasToon = (color, quadrant, repeat = 1) => {
  const material = toon(color);
  const target = { material, quadrant, repeat };
  atlasMaterialTargets.push(target);
  applyAtlasTarget(target);
  return material;
};

new THREE.ImageLoader().load(materialAtlasUrl, (image) => {
  materialAtlasImage = image;
  atlasMaterialTargets.forEach(applyAtlasTarget);
});

function outlined(geometry, material, name, scale = 1.035) {
  const group = new THREE.Group();
  group.name = name;
  const outline = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: ink, side: THREE.BackSide }));
  outline.scale.setScalar(scale);
  const fill = new THREE.Mesh(geometry, material);
  fill.castShadow = true;
  fill.receiveShadow = true;
  group.add(outline, fill);
  return group;
}

function terrainCircle(radius = 78, segments = 128) {
  const geometry = new THREE.CircleGeometry(radius, segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setY(i, outdoorTerrainHeight(positions.getX(i), positions.getZ(i)));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
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
    for (const side of [1, -1]) {
      const x = points[i].x + nx * side;
      const z = points[i].z + nz * side;
      positions.push(x, outdoorTerrainHeight(x, z) + 0.045, z);
    }
    if (i < points.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, toon(color));
}

function sampledCurve(coords, divisions = 80) {
  const curve = new THREE.CatmullRomCurve3(coords.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.35);
  return curve.getPoints(divisions);
}

function addGrass(group) {
  const rand = seeded(99117);
  const blade = new THREE.ConeGeometry(0.13, 0.62, 3);
  blade.translate(0, 0.31, 0);
  const colors = ['#769b58', '#8eae69', '#abc47a'];
  for (const color of colors) {
    const mesh = new THREE.InstancedMesh(blade, toon(color), 240);
    const transform = new THREE.Object3D();
    let written = 0;
    while (written < 240) {
      const angle = rand() * Math.PI * 2;
      const radius = 3.5 + Math.sqrt(rand()) * 52;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (Math.hypot(x - OUTDOOR_GARDEN_CENTER.x, z - OUTDOOR_GARDEN_CENTER.z) < 6) continue;
      if (Math.hypot(x - OUTDOOR_HOUSE_CENTER.x, z - OUTDOOR_HOUSE_CENTER.z) < 7) continue;
      transform.position.set(x, outdoorTerrainHeight(x, z), z);
      transform.rotation.y = rand() * Math.PI;
      const scale = 0.55 + rand() * 0.9;
      transform.scale.set(scale * (0.7 + rand() * 0.45), scale, scale);
      transform.updateMatrix();
      mesh.setMatrixAt(written, transform.matrix);
      written += 1;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}

function addTrees(group) {
  const trunkGeometry = new THREE.CylinderGeometry(0.24, 0.42, 2.5, 7);
  const crownGeometry = new THREE.DodecahedronGeometry(1.45, 0);
  const trunks = new THREE.InstancedMesh(trunkGeometry, toon('#8d6847'), OUTDOOR_TREES.length);
  const crowns = new THREE.InstancedMesh(crownGeometry, toon('#789d5c'), OUTDOOR_TREES.length);
  const transform = new THREE.Object3D();
  for (let i = 0; i < OUTDOOR_TREES.length; i += 1) {
    const tree = OUTDOOR_TREES[i];
    transform.position.set(tree.x, tree.y + 1.25 * tree.scale, tree.z);
    transform.rotation.y = (i * 2.17) % Math.PI;
    transform.scale.setScalar(tree.scale);
    transform.updateMatrix();
    trunks.setMatrixAt(i, transform.matrix);
    transform.position.y = tree.y + 3.35 * tree.scale;
    transform.scale.set(tree.scale * 1.28, tree.scale * 1.02, tree.scale * 1.16);
    transform.updateMatrix();
    crowns.setMatrixAt(i, transform.matrix);
  }
  trunks.castShadow = true;
  trunks.receiveShadow = true;
  crowns.castShadow = true;
  group.add(trunks, crowns);

  new THREE.TextureLoader().load(treeAtlasUrl, (atlas) => {
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.wrapS = THREE.RepeatWrapping;
    atlas.wrapT = THREE.ClampToEdgeWrapping;
    for (let variant = 0; variant < 3; variant += 1) {
      const texture = atlas.clone();
      texture.repeat.set(1 / 3, 1);
      texture.offset.set(variant / 3, 0);
      texture.needsUpdate = true;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.16, side: THREE.DoubleSide, depthWrite: true });
      const trees = OUTDOOR_TREES.filter((tree) => tree.variant === variant);
      for (const rotationY of [0, Math.PI / 2]) {
        const sprites = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.7, 6.2), material, trees.length);
        trees.forEach((tree, index) => {
          transform.position.set(tree.x, tree.y + 3.05 * tree.scale, tree.z);
          transform.rotation.set(0, rotationY, 0);
          transform.scale.setScalar(tree.scale);
          transform.updateMatrix();
          sprites.setMatrixAt(index, transform.matrix);
        });
        sprites.castShadow = true;
        group.add(sprites);
      }
    }
  });
}

function createGarden(group) {
  const garden = new THREE.Group();
  garden.name = 'outdoorGarden';
  garden.position.set(OUTDOOR_GARDEN_CENTER.x, outdoorTerrainHeight(OUTDOOR_GARDEN_CENTER.x, OUTDOOR_GARDEN_CENTER.z) + 0.05, OUTDOOR_GARDEN_CENTER.z);
  const bedGeometry = new THREE.BoxGeometry(1.7, 0.24, 2.1);
  const soilGeometry = new THREE.BoxGeometry(1.46, 0.13, 1.84);
  const cropGeometry = new THREE.ConeGeometry(0.18, 0.62, 5);
  const slots = [];
  for (let i = 0; i < 4; i += 1) {
    const bed = new THREE.Group();
    bed.position.set((i % 2 - 0.5) * 2.05, 0.12, (Math.floor(i / 2) - 0.5) * 2.45);
    bed.add(outlined(bedGeometry, atlasToon('#b58a5e', '1-0', 1.5), `gardenBed-${i}`, 1.025));
    const soil = new THREE.Mesh(soilGeometry, atlasToon('#6f5137', '0-1', 1.5));
    soil.position.y = 0.15;
    bed.add(soil);
    const crops = new THREE.Group();
    crops.position.y = 0.24;
    for (let cropIndex = 0; cropIndex < 5; cropIndex += 1) {
      const crop = new THREE.Mesh(cropGeometry, toon(cropIndex % 2 ? '#79a758' : '#93bb66'));
      crop.position.set((cropIndex % 3 - 1) * 0.38, 0.31, (Math.floor(cropIndex / 3) - 0.35) * 0.58);
      crop.rotation.z = (cropIndex - 2) * 0.07;
      crop.castShadow = true;
      crops.add(crop);
    }
    bed.add(crops);
    garden.add(bed);
    slots.push({ bed, crops });
  }
  const sign = outlined(new THREE.BoxGeometry(1.7, 0.8, 0.12), toon('#f3dda7'), 'gardenSign');
  sign.position.set(0, 0.9, -2.25);
  garden.add(sign);
  group.add(garden);
  return { group: garden, slots };
}

function createHouse(group) {
  const house = new THREE.Group();
  house.name = 'outdoorHouse';
  house.position.set(OUTDOOR_HOUSE_CENTER.x, outdoorTerrainHeight(OUTDOOR_HOUSE_CENTER.x, OUTDOOR_HOUSE_CENTER.z), OUTDOOR_HOUSE_CENTER.z);
  const stages = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
  stages.forEach((stage, index) => { stage.name = `houseStage-${index + 1}`; house.add(stage); });

  const foundation = outlined(new THREE.BoxGeometry(6.2, 0.36, 5.6), atlasToon('#b79269', '1-0', 2), 'houseFoundation', 1.018);
  foundation.position.y = 0.18;
  stages[0].add(foundation);

  const beamMaterial = atlasToon('#8e633e', '1-0', 1.5);
  const postGeometry = new THREE.BoxGeometry(0.24, 3.5, 0.24);
  for (const x of [-2.8, 2.8]) for (const z of [-2.5, 2.5]) {
    const post = outlined(postGeometry, beamMaterial, 'housePost', 1.04);
    post.position.set(x, 2.05, z);
    stages[1].add(post);
  }
  for (const z of [-2.5, 2.5]) {
    const beam = outlined(new THREE.BoxGeometry(5.85, 0.25, 0.25), beamMaterial, 'houseBeam', 1.04);
    beam.position.set(0, 3.72, z);
    stages[1].add(beam);
  }

  const wallMaterial = toon('#ead5a4');
  const wallParts = [
    [new THREE.BoxGeometry(0.25, 3.1, 5), -2.8, 1.95, 0],
    [new THREE.BoxGeometry(0.25, 3.1, 5), 2.8, 1.95, 0],
    [new THREE.BoxGeometry(5.6, 3.1, 0.25), 0, 1.95, -2.5],
    [new THREE.BoxGeometry(1.8, 3.1, 0.25), -1.9, 1.95, 2.5],
    [new THREE.BoxGeometry(1.8, 3.1, 0.25), 1.9, 1.95, 2.5],
  ];
  wallParts.forEach(([geometry, x, y, z]) => {
    const wall = outlined(geometry, wallMaterial, 'houseWall', 1.018);
    wall.position.set(x, y, z);
    stages[2].add(wall);
  });

  const roofMaterial = atlasToon('#a85f4d', '1-1', 2);
  for (const side of [-1, 1]) {
    const roof = outlined(new THREE.BoxGeometry(3.9, 0.22, 6.1), roofMaterial, 'houseRoof', 1.018);
    roof.position.set(side * 1.55, 4.32, 0);
    roof.rotation.z = side * 0.48;
    stages[3].add(roof);
  }
  group.add(house);
  return { group: house, stages };
}

function uniqueNpcParams(params, index) {
  const rand = seeded(7719 + index * 97);
  const npc = OUTDOOR_NPCS[index];
  return {
    ...params,
    seed: 1300 + index * 97,
    coatId: npc.coatId,
    pose: 'standing',
    motionDebug: false,
    headSize: 0.86 + rand() * 0.3,
    chubbiness: 0.82 + rand() * 0.38,
    legLength: 0.82 + rand() * 0.34,
    tailLength: 0.76 + rand() * 0.42,
    eyeSize: 0.84 + rand() * 0.3,
    wingLength: 0.84 + rand() * 0.28,
  };
}

const outdoorExpressions = [
  { id: 'happy', expression: { eyeX: 1, eyeY: 0.38, headTilt: 0.08, headPitch: -0.04, wingLift: 0.13, bodyBob: 0.025, fluff: 0.35 } },
  { id: 'surprised', expression: { eyeX: 1.14, eyeY: 1.18, headTilt: -0.04, headPitch: -0.11, wingLift: 0.2, bodyBob: 0.06, fluff: 0.65 } },
  { id: 'proud', expression: { eyeX: 0.92, eyeY: 0.72, headTilt: 0.13, headPitch: 0.07, wingLift: 0.05, bodyBob: 0.02, fluff: 0.2 } },
];

export function createOutdoorScene(scene, params, { toyCatalog = [] } = {}) {
  const group = new THREE.Group();
  group.name = 'outdoorWalkWorld';
  group.visible = false;

  const ground = new THREE.Mesh(terrainCircle(), atlasToon('#a9c77d', '0-0', 12));
  ground.receiveShadow = true;
  group.add(ground);

  const mainPath = ribbon(sampledCurve([
    [0, 10], [-11, 4], [-17, -12], [-3, -27], [17, -22], [29, -5], [20, 15], [5, 24], [-14, 19], [-25, 7], [-17, -12],
  ], 120), 3.5, '#f0d4a3');
  const stream = ribbon(sampledCurve([[-49, -18], [-27, -12], [-10, -15], [8, -9], [26, -12], [50, -3]], 90), 3.8, '#78b7ca');
  group.add(mainPath, stream);

  const bridge = new THREE.Group();
  const bridgeY = outdoorTerrainHeight(0, -11.8) + 0.22;
  for (let i = -4; i <= 4; i += 1) {
    const plank = outlined(new THREE.BoxGeometry(0.75, 0.13, 3.7), toon(i % 2 ? '#a97d58' : '#bc9068'), 'bridgePlank', 1.025);
    plank.position.set(i * 0.72, bridgeY + Math.cos(i * 0.32) * 0.08, -11.8);
    plank.rotation.y = -0.18;
    bridge.add(plank);
  }
  group.add(bridge);
  addGrass(group);
  addTrees(group);
  const garden = createGarden(group);
  const house = createHouse(group);

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

  const player = buildBird({ ...params, pose: 'standing', motionDebug: false, seed: Number(params.seed) || 2210728 }, 'draft');
  player.name = 'outdoorPlayerBird';
  player.scale.setScalar(0.92);
  player.traverse((object) => { if (object.isMesh) object.castShadow = true; });
  group.add(player);
  const feet = player.userData.birdParts?.feet;
  const leftLeg = feet?.getObjectByName('leftLeg');
  const rightLeg = feet?.getObjectByName('rightLeg');
  const leftFoot = feet?.getObjectByName('leftFoot');
  const rightFoot = feet?.getObjectByName('rightFoot');
  const gaitParts = [leftLeg, rightLeg, leftFoot, rightFoot].filter(Boolean).map((part) => ({ part, rotation: part.rotation.clone() }));

  const npcById = new Map();
  const independentModels = [];
  for (let index = 0; index < OUTDOOR_NPCS.length; index += 1) {
    const npc = OUTDOOR_NPCS[index];
    let model;
    if (index < 8) {
      model = buildBird(uniqueNpcParams(params, index), 'draft');
      independentModels.push(model);
    } else {
      model = independentModels[index - 8].clone(true);
    }
    model.name = `outdoorNpc-${npc.id}`;
    model.position.set(npc.x, outdoorTerrainHeight(npc.x, npc.z), npc.z);
    model.rotation.y = npc.heading ?? 0;
    model.scale.setScalar((npc.scale ?? 0.72) * (index >= 8 ? 0.9 + index * 0.018 : 1));
    model.userData.outdoorNpcId = npc.id;
    model.userData.baseY = model.position.y;
    model.traverse((object) => { if (object.isMesh) object.castShadow = false; });
    group.add(model);
    npcById.set(npc.id, model);
  }

  const outdoorToy = new THREE.Group();
  outdoorToy.name = 'outdoorToy';
  outdoorToy.visible = false;
  group.add(outdoorToy);
  let emoteIndex = -1;
  let emoteTimer = 0;

  scene.add(group);
  return {
    group,
    setVisible(visible) { group.visible = visible; },
    update(dt, elapsed, playerPosition) {
      if (!group.visible) return;
      const gait = playerPosition.moving && playerPosition.grounded ? Math.sin(elapsed * 11) : 0;
      for (const { part, rotation } of gaitParts) part.rotation.copy(rotation);
      if (leftLeg) leftLeg.rotation.x += gait * 0.34;
      if (rightLeg) rightLeg.rotation.x -= gait * 0.34;
      if (leftFoot) leftFoot.rotation.x -= gait * 0.2;
      if (rightFoot) rightFoot.rotation.x += gait * 0.2;
      player.position.y = playerPosition.y + (playerPosition.moving && playerPosition.grounded ? Math.abs(gait) * 0.045 : Math.sin(elapsed * 2) * 0.012);
      player.rotation.z = playerPosition.moving ? -gait * 0.018 : 0;
      player.userData.updateEyeAnimation?.(elapsed, 0, 0);
      if (emoteTimer > 0) {
        emoteTimer -= dt;
        const emote = outdoorExpressions[emoteIndex];
        player.userData.applyExpression?.({ state: emote.id, intensity: Math.min(1, emoteTimer * 2), expression: emote.expression }, dt, true);
      } else {
        player.userData.applyExpression?.({ state: 'neutral', intensity: 0 }, dt, true);
      }
      for (let i = 0; i < OUTDOOR_NPCS.length; i += 1) {
        const npc = OUTDOOR_NPCS[i];
        const model = npcById.get(npc.id);
        model.position.y = model.userData.baseY + Math.sin(elapsed * 1.7 + i * 0.9) * 0.035;
        const desired = Math.atan2(playerPosition.x - npc.x, playerPosition.z - npc.z);
        if (Math.hypot(playerPosition.x - npc.x, playerPosition.z - npc.z) < 5) {
          model.rotation.y += Math.atan2(Math.sin(desired - model.rotation.y), Math.cos(desired - model.rotation.y)) * Math.min(1, dt * 3);
        }
      }
    },
    triggerEmote() {
      emoteIndex = (emoteIndex + 1) % outdoorExpressions.length;
      emoteTimer = 2.2;
      return outdoorExpressions[emoteIndex].id;
    },
    setFarmState(state, now) {
      garden.slots.forEach((slot, index) => {
        const stage = outdoorCropStage(state.slots[index], now);
        slot.crops.visible = stage !== 'empty';
        const scale = stage === 'seeded' ? 0.18 : stage === 'sprout' ? 0.52 : 1;
        slot.crops.scale.setScalar(scale);
      });
    },
    setBuildStage(stage) {
      house.stages.forEach((stageGroup, index) => { stageGroup.visible = stage >= index + 1; });
    },
    setToy(kind, placed, playerPosition) {
      outdoorToy.clear();
      const source = toyCatalog.find((toy) => toy.kind === kind)?.mesh;
      if (!source || !placed) { outdoorToy.visible = false; return; }
      const clone = source.clone(true);
      clone.position.set(0, 0, 0);
      clone.rotation.set(0, 0, 0);
      clone.scale.multiplyScalar(0.82);
      outdoorToy.add(clone);
      outdoorToy.position.set(
        playerPosition.x + Math.sin(playerPosition.heading) * 1.2,
        outdoorTerrainHeight(playerPosition.x, playerPosition.z) + 0.2,
        playerPosition.z + Math.cos(playerPosition.heading) * 1.2
      );
      outdoorToy.visible = true;
    },
    getNpcObject(id) { return npcById.get(id) ?? null; },
    getNpcCount() { return npcById.size; },
    getIndependentNpcCount() { return 8; },
    setPlayerTransform(position) {
      player.position.x = position.x;
      player.position.z = position.z;
      player.rotation.y = position.heading;
    },
  };
}
