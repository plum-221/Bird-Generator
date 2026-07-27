import * as THREE from 'three';
import { createRng } from './rng.js';
import { PLUMAGES } from './birdPresets.js';
import { clampBirdParams } from './birdParams.js';

export const BIRD_MESH_QUALITY = Object.freeze({ draftSegments: 14, fullSegments: 28 });

function gradientMap() {
  const data = new Uint8Array([70, 70, 70, 170, 170, 170, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  texture.needsUpdate = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function toon(color) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() });
}

function addOutlined(parent, geometry, material, name, transform = {}) {
  const group = new THREE.Group();
  group.name = `${name}Group`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  const outline = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({ color: '#594b43', side: THREE.BackSide })
  );
  outline.name = `${name}Outline`;
  outline.scale.setScalar(1.035);
  group.add(mesh, outline);
  if (transform.position) group.position.copy(transform.position);
  if (transform.rotation) group.rotation.set(...transform.rotation);
  if (transform.scale) group.scale.set(...transform.scale);
  parent.add(group);
  return group;
}

function capsuleBetween(a, b, radius, segments, material, parent, name) {
  const length = a.distanceTo(b);
  const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 2), 5, segments);
  const group = addOutlined(parent, geometry, material, name);
  group.position.copy(a).lerp(b, 0.5);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return group;
}

function addFoot(parent, side, y, z, legLength, materials, segments) {
  const x = side * 0.145;
  const leg = capsuleBetween(
    new THREE.Vector3(x, y + 0.19 * legLength, z),
    new THREE.Vector3(x, y + 0.035, z + 0.01),
    0.027,
    Math.max(7, segments / 2),
    materials.foot,
    parent,
    side < 0 ? 'leftLeg' : 'rightLeg'
  );
  const toes = new THREE.Group();
  toes.name = side < 0 ? 'leftFoot' : 'rightFoot';
  parent.add(toes);
  for (const [index, spread] of [-0.06, 0, 0.06].entries()) {
    const toe = capsuleBetween(
      new THREE.Vector3(x + spread, y + 0.025, z + 0.02),
      new THREE.Vector3(x + spread * 1.25, y + 0.018, z + 0.16 - index * 0.012),
      0.012,
      6,
      materials.foot,
      toes,
      `toe${index}`
    );
    toe.rotation.z = side * 0.04;
  }
  return leg;
}

function addWing(parent, side, center, scale, materials, segments, stripeAmount) {
  const wing = new THREE.Group();
  wing.name = side < 0 ? 'leftWing' : 'rightWing';
  wing.position.copy(center);
  parent.add(wing);
  addOutlined(
    wing,
    new THREE.SphereGeometry(0.36, segments, Math.max(10, segments / 2)),
    materials.wing,
    'wingShell',
    { scale: [0.52, 1.08 * scale, 0.32], rotation: [0.08, 0, side * -0.12] }
  );
  const stripeMat = materials.stripe;
  for (let i = 0; i < 5; i++) {
    const feather = addOutlined(
      wing,
      new THREE.CapsuleGeometry(0.018 + i * 0.003, 0.16 + i * 0.018, 3, 7),
      i % 2 === 0 ? stripeMat : materials.wing,
      `wingFeather${i}`,
      {
        position: new THREE.Vector3(side * (0.02 + stripeAmount * 0.006), -0.12 - i * 0.048, 0.105 + i * 0.006),
        rotation: [0.18, 0, side * (0.17 + i * 0.035)],
        scale: [1, 1, 0.55],
      }
    );
    feather.scale.x *= 0.8;
  }
  return wing;
}

export function buildBird(rawParams, quality = 'full') {
  const startedAt = performance.now();
  const params = clampBirdParams(rawParams);
  const rng = createRng(params.seed);
  const plumage = PLUMAGES.find(({ id }) => id === params.coatId) ?? PLUMAGES[0];
  const segments = quality === 'draft' ? BIRD_MESH_QUALITY.draftSegments : BIRD_MESH_QUALITY.fullSegments;
  const root = new THREE.Group();
  root.name = 'bird';
  const fluff = params.fluffy ? params.furFluff : 0.3;
  const roundness = Math.sqrt(params.chubbiness);
  const headRadius = 0.31 * params.headSize;
  const bodyHeight = 0.76 + fluff * 0.045;
  const bodyY = 0.26 + bodyHeight * 0.48;
  const headC = new THREE.Vector3(0, bodyY + bodyHeight * 0.38, 0.11);
  const materials = {
    body: toon(plumage.base), chest: toon(plumage.chest), wing: toon(plumage.wing),
    stripe: toon(plumage.stripe), cheek: toon(plumage.cheek), cere: toon(plumage.cere),
    beak: toon(plumage.beak), foot: toon('#9a8b86'), eye: toon(params.eyeColor || '#171716'),
  };

  const hitGeometry = new THREE.CapsuleGeometry(0.42 * roundness, 0.55, 8, segments);
  const fur = new THREE.Mesh(hitGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  fur.name = 'fur';
  fur.position.set(0, bodyY + 0.09, 0);
  fur.scale.set(1, 1.12, 0.86);
  fur.geometry.userData.meshCellSize = quality === 'draft' ? 0.09 : 0.055;
  fur.geometry.userData.meshMode = `bird-${quality}`;
  root.add(fur);

  const visible = new THREE.Group();
  visible.name = 'birdVisible';
  root.add(visible);
  const body = addOutlined(
    visible,
    new THREE.SphereGeometry(0.43, segments, Math.max(12, segments / 2)),
    materials.body,
    'body',
    { position: new THREE.Vector3(0, bodyY, 0), scale: [roundness, bodyHeight / 0.86, 0.82 * roundness] }
  );
  const chest = addOutlined(
    visible,
    new THREE.SphereGeometry(0.35, segments, Math.max(12, segments / 2)),
    materials.chest,
    'chest',
    { position: new THREE.Vector3(0, bodyY + 0.01, 0.25), scale: [0.86 * roundness, 1.02, 0.5] }
  );
  const head = addOutlined(
    visible,
    new THREE.SphereGeometry(headRadius, segments, Math.max(12, segments / 2)),
    materials.body,
    'head',
    { position: headC, scale: [1.03, 1.02 + fluff * 0.025, 0.97] }
  );

  const wingY = bodyY + 0.1;
  const wingScale = params.earSize;
  const leftWing = addWing(visible, -1, new THREE.Vector3(-0.34 * roundness, wingY, -0.01), wingScale, materials, segments, rng.next());
  const rightWing = addWing(visible, 1, new THREE.Vector3(0.34 * roundness, wingY, -0.01), wingScale, materials, segments, rng.next());

  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(0, bodyY - 0.24, -0.25);
  tail.rotation.x = 0.18 + params.tailCurl * 0.16;
  visible.add(tail);
  for (let i = -2; i <= 2; i++) {
    addOutlined(
      tail,
      new THREE.CapsuleGeometry(0.035, 0.42 * params.tailLength * (1 - Math.abs(i) * 0.08), 4, 8),
      i % 2 ? materials.stripe : materials.wing,
      `tailFeather${i + 2}`,
      { position: new THREE.Vector3(i * 0.045, -0.24 * params.tailLength, -0.09), rotation: [0.22, 0, i * 0.045] }
    );
  }

  const face = new THREE.Group();
  face.name = 'face';
  visible.add(face);
  const eyeGroups = [];
  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * headRadius * 0.58, headC.y + headRadius * 0.06, headC.z + headRadius * 0.79);
    const eyeColor = side > 0 && params.oddEyes ? params.eyeColorRight : params.eyeColor;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.105 * params.eyeSize, 16, 12), toon(eyeColor || '#171716'));
    eye.scale.z = 0.45;
    eyeGroup.add(eye);
    face.add(eyeGroup);
    eyeGroups.push(eyeGroup);
  }
  for (const side of [-1, 1]) {
    addOutlined(face, new THREE.SphereGeometry(headRadius * 0.16, 12, 8), materials.cheek, side < 0 ? 'leftCheek' : 'rightCheek', {
      position: new THREE.Vector3(side * headRadius * 0.52, headC.y - headRadius * 0.24, headC.z + headRadius * 0.79),
      scale: [1.05, 0.82, 0.35],
    });
  }
  addOutlined(face, new THREE.SphereGeometry(headRadius * 0.19, 12, 8), materials.cere, 'cere', {
    position: new THREE.Vector3(0, headC.y - headRadius * 0.08, headC.z + headRadius * 0.91), scale: [1.15, 0.58, 0.45],
  });
  addOutlined(face, new THREE.ConeGeometry(headRadius * 0.17, headRadius * 0.36, 16), materials.beak, 'beak', {
    position: new THREE.Vector3(0, headC.y - headRadius * 0.25, headC.z + headRadius * 1.05), rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 0.82],
  });

  const feet = new THREE.Group();
  feet.name = 'feet';
  visible.add(feet);
  addFoot(feet, -1, 0, 0.08, params.legLength, materials, segments);
  addFoot(feet, 1, 0, 0.08, params.legLength, materials, segments);

  if (params.pose === 'loaf' || params.pose === 'containerCrouch' || params.pose === 'slouchSit') {
    visible.position.y -= 0.12;
    body.scale.y *= 0.82;
    body.scale.x *= 1.1;
    feet.visible = false;
  } else if (params.pose === 'stretch') {
    leftWing.rotation.z = -0.72;
    rightWing.rotation.z = 0.72;
    head.rotation.x = -0.12;
  } else if (params.pose === 'biped') {
    body.scale.y *= 1.16;
    head.position.y += 0.08;
  } else if (params.pose === 'sideFlat') {
    visible.rotation.z = Math.PI * 0.42;
    visible.position.y += 0.08;
  } else if (params.pose === 'banana') {
    tail.scale.y *= 1.38;
    body.scale.y *= 1.08;
  }

  const surfaceDetails = new THREE.Group();
  surfaceDetails.name = 'surfaceDetails';
  root.add(surfaceDetails);
  const baseTransforms = new Map([body, chest, head, leftWing, rightWing, tail].map((part) => [part, {
    position: part.position.clone(), rotation: part.rotation.clone(), scale: part.scale.clone(),
  }]));
  const resetParts = () => {
    for (const [part, base] of baseTransforms) {
      part.position.copy(base.position); part.rotation.copy(base.rotation); part.scale.copy(base.scale);
    }
    root.userData.animationRootLift = 0;
  };

  root.userData.headC = headC.clone();
  root.userData.hr = headRadius;
  root.userData.muzzle = new THREE.Vector3(0, headC.y - headRadius * 0.2, headC.z + headRadius);
  root.userData.buttC = new THREE.Vector3(0, bodyY - 0.1, -0.27);
  root.userData.colliders = [
    { c: new THREE.Vector3(0, bodyY, 0), r: 0.43 * roundness },
    { c: headC.clone(), r: headRadius * 1.02 },
  ];
  root.userData.birdParts = { body, chest, head, leftWing, rightWing, tail, feet, eyeGroups };
  root.userData.resetBirdParts = resetParts;
  root.userData.updateEyeAnimation = (time, gazeX = 0, gazeY = 0) => {
    const blink = Math.sin(time * 0.73 + params.seed) > 0.985 ? 0.12 : 1;
    for (const eye of eyeGroups) {
      eye.scale.y = blink;
      eye.rotation.y = gazeX * 0.08;
      eye.rotation.x = -gazeY * 0.06;
    }
  };
  root.userData.updateStaticIdle = (time, enabled = true) => {
    if (!enabled) return { enabled: false };
    const breath = Math.sin(time * 2.1) * 0.012;
    body.scale.y = baseTransforms.get(body).scale.y + breath;
    chest.scale.y = baseTransforms.get(chest).scale.y + breath * 1.4;
    head.rotation.y = Math.sin(time * 0.72 + params.seed * 0.01) * 0.08;
    const wingAngle = Math.sin(time * 1.8) * 0.012;
    leftWing.rotation.z = wingAngle;
    rightWing.rotation.z = -wingAngle;
    tail.rotation.z = Math.sin(time * 1.15) * 0.025;
    return { enabled: true, tailAngle: tail.rotation.z, leftEarAngle: leftWing.rotation.z, rightEarAngle: rightWing.rotation.z };
  };
  root.userData.setTransientFluff = (amount = 0) => {
    const scale = 1 + Math.max(0, amount) * 0.035;
    body.scale.x = baseTransforms.get(body).scale.x * scale;
    body.scale.z = baseTransforms.get(body).scale.z * scale;
  };
  root.userData.updateDynamicCoat = (next = {}) => {
    if (next.dynamicCoatBase) materials.body.color.set(next.dynamicCoatBase);
    if (next.dynamicCoatA) materials.wing.color.set(next.dynamicCoatA);
    if (next.dynamicCoatB) materials.stripe.color.set(next.dynamicCoatB);
  };
  root.userData.prepareDynamicCoatExport = () => () => {};
  root.userData.buildTimings = { meshMs: 0, vertexDataMs: 0, detailsMs: performance.now() - startedAt, totalMs: performance.now() - startedAt };
  return root;
}
