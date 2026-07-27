import * as THREE from 'three';
import { createRng } from './rng.js';
import { meshFromSDF, sphere } from './sdf.js';
import { PLUMAGES } from './birdPresets.js';
import { clampBirdParams } from './birdParams.js';

export const BIRD_MESH_QUALITY = Object.freeze({ draftSegments: 14, fullSegments: 28 });

const TOON_GRADIENT = (() => {
  const data = new Uint8Array([82, 82, 82, 176, 176, 176, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  texture.needsUpdate = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
})();

const OUTLINE_COLOR = '#625650';
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function toon(color) {
  return new THREE.MeshToonMaterial({ color, gradientMap: TOON_GRADIENT, emissive: color, emissiveIntensity: 0.065 });
}

function addOutlined(parent, geometry, material, name, transform = {}, outlineScale = 1.018) {
  const group = new THREE.Group();
  group.name = `${name}Group`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  const outline = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide })
  );
  outline.name = `${name}Outline`;
  outline.scale.setScalar(outlineScale);
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
  const group = addOutlined(parent, geometry, material, name, {}, 1.012);
  group.position.copy(a).lerp(b, 0.5);
  group.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return group;
}

function createWingGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.21, -0.04, 0.24, -0.34, 0.08, -0.53);
  shape.bezierCurveTo(0.02, -0.60, -0.04, -0.60, -0.09, -0.52);
  shape.bezierCurveTo(-0.23, -0.28, -0.19, -0.05, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.016, bevelThickness: 0.016,
  });
  geometry.translate(0, 0, -0.03);
  return geometry;
}

function createRootedFeather(length, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width, -length * 0.18, width * 0.72, -length * 0.72, 0, -length);
  shape.bezierCurveTo(-width * 0.72, -length * 0.72, -width, -length * 0.18, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.034, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.008, bevelThickness: 0.008,
  });
  geometry.translate(0, 0, -0.017);
  return geometry;
}

function addWing(parent, side, root, scale, materials, nearSide) {
  const wing = new THREE.Group();
  wing.name = side < 0 ? 'leftWing' : 'rightWing';
  wing.position.copy(root);
  wing.rotation.z = side * -0.035;
  wing.rotation.y = side * 0.08;
  wing.scale.set(scale * 1.16, scale, scale);
  parent.add(wing);

  addOutlined(wing, createWingGeometry(), materials.wing, 'wingShell', {
    scale: [side, 1, 1],
  });
  for (let i = 0; i < 4; i++) {
    const line = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.008, 0.13 + i * 0.022, 3, 7),
      i === 0 ? materials.stripe : materials.featherEdge
    );
    line.name = `wingFeather${i}`;
    line.position.set(side * (0.035 + i * 0.025), -0.26 - i * 0.048, 0.058);
    line.rotation.z = side * (0.14 + i * 0.035);
    wing.add(line);
  }
  wing.userData.isNearSide = nearSide;
  return wing;
}

function addTail(parent, root, params, materials) {
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.copy(root);
  parent.add(tail);

  const length = 0.72 * params.tailLength;
  for (const [side, name] of [[-1, 'mainTailLeft'], [1, 'mainTailRight']]) {
    addOutlined(tail, createRootedFeather(length, 0.062), materials.tail, name, {
      position: V(side * 0.025, 0, side * 0.008),
      rotation: [0.70 + params.tailCurl * 0.08, 0, side * 0.025],
    });
  }
  for (const [side, name] of [[-1, 'sideTailLeft'], [1, 'sideTailRight']]) {
    addOutlined(tail, createRootedFeather(length * 0.68, 0.068), materials.wing, name, {
      position: V(side * 0.075, -0.015, 0.012),
      rotation: [0.60 + params.tailCurl * 0.06, 0, side * 0.10],
    });
  }
  return tail;
}

function addFoot(parent, side, hip, floorY, materials, segments) {
  const prefix = side < 0 ? 'left' : 'right';
  const ankle = V(side * 0.13, floorY + 0.048, 0.075);
  const leg = capsuleBetween(hip, ankle, 0.021, Math.max(7, segments / 2), materials.foot, parent, `${prefix}Leg`);
  const foot = new THREE.Group();
  foot.name = `${prefix}Foot`;
  parent.add(foot);

  const toes = [
    ['ToeFrontOuter', side * 0.042, 0.155], ['ToeFrontInner', side * -0.018, 0.132],
    ['ToeBackOuter', side * 0.044, -0.105], ['ToeBackInner', side * -0.016, -0.09],
  ];
  for (const [suffix, dx, dz] of toes) {
    capsuleBetween(
      ankle,
      V(ankle.x + dx, floorY + 0.014, ankle.z + dz),
      0.0105,
      6,
      materials.foot,
      foot,
      `${prefix}${suffix}`
    );
  }
  return leg;
}

function addEye(face, side, headRadius, material, eyeSize) {
  const prefix = side < 0 ? 'left' : 'right';
  const group = new THREE.Group();
  group.name = `${prefix}EyeGroup`;
  group.position.set(side * headRadius * 0.55, headRadius * 0.08, headRadius * 0.83);
  face.add(group);

  const radius = headRadius * 0.105 * eyeSize;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), material);
  eye.name = `${prefix}Eye`;
  eye.scale.z = 0.48;
  group.add(eye);
  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.28, 10, 8),
    new THREE.MeshBasicMaterial({ color: '#fffdf7' })
  );
  highlight.name = `${prefix}EyeHighlight`;
  highlight.position.set(-radius * 0.26, radius * 0.30, radius * 0.48);
  group.add(highlight);
  return group;
}

function addFace(headRig, headRadius, params, materials) {
  const face = new THREE.Group();
  face.name = 'face';
  headRig.add(face);
  const eyeGroups = [
    addEye(face, -1, headRadius, materials.eyeLeft, params.eyeSize),
    addEye(face, 1, headRadius, materials.eyeRight, params.eyeSize),
  ];


  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const mark = new THREE.Mesh(new THREE.CapsuleGeometry(headRadius * 0.012, headRadius * 0.07, 3, 7), materials.marking);
      mark.name = `foreheadMark${side}-${i}`;
      mark.position.set(side * headRadius * (0.18 + i * 0.105), headRadius * (0.47 - i * 0.035), headRadius * 0.91);
      mark.rotation.z = side * (0.65 - i * 0.08);
      mark.scale.z = 0.36;
      face.add(mark);
    }
  }

  addOutlined(face, new THREE.SphereGeometry(headRadius * 0.17, 14, 9), materials.cere, 'cere', {
    position: V(0, -headRadius * 0.07, headRadius * 0.94),
    scale: [1.12, 0.48, 0.42],
  }, 1.01);
  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.017, 8, 6), materials.throatDot);
    nostril.name = side < 0 ? 'leftNostril' : 'rightNostril';
    nostril.position.set(side * headRadius * 0.075, -headRadius * 0.055, headRadius * 1.02);
    face.add(nostril);
  }
  addOutlined(face, new THREE.SphereGeometry(headRadius * 0.16, 14, 9), materials.beak, 'upperBeak', {
    position: V(0, -headRadius * 0.22, headRadius * 1.02),
    scale: [0.96, 0.72, 0.78],
  });
  addOutlined(face, new THREE.ConeGeometry(headRadius * 0.07, headRadius * 0.15, 14), materials.beak, 'beakHook', {
    position: V(0, -headRadius * 0.315, headRadius * 1.04),
    rotation: [0, 0, Math.PI],
    scale: [0.72, 0.82, 0.64],
  }, 1.01);
  addOutlined(face, new THREE.ConeGeometry(headRadius * 0.08, headRadius * 0.16, 14), materials.beakShadow, 'lowerBeak', {
    position: V(0, -headRadius * 0.35, headRadius * 1.00),
    rotation: [Math.PI, 0, 0],
    scale: [0.82, 0.85, 0.68],
  }, 1.01);
  return { face, eyeGroups };
}

function createBodyPrimitives(params, headC, headRadius) {
  const fluff = params.fluffy ? params.furFluff : 0.3;
  const width = 0.94 + (params.chubbiness - 1) * 0.16 + fluff * 0.014;
  const prims = [];
  const P = (primitive) => prims.push(primitive);
  P(sphere({ c: V(0, 0.48, 0), r: 0.37, s: [1.02 * width, 1.02, 0.76 * width], k: 0.16, tag: 'belly' }));
  P(sphere({ c: V(0, 0.69, 0.035), r: 0.32, s: [0.93 * width, 1.10, 0.74 * width], k: 0.17, tag: 'chest' }));
  P(sphere({ c: V(0, 0.86, 0.02), r: 0.25, s: [0.90 * width, 0.96, 0.78 * width], k: 0.16, tag: 'neck' }));
  P(sphere({ c: headC, r: headRadius, s: [1, 1.06, 0.93], k: 0.18, tag: 'head' }));
  P(sphere({ c: V(0, headC.y + headRadius * 0.62, headC.z - 0.01), r: headRadius * 0.58, s: [1.18, 0.78, 1], k: 0.13, tag: 'crown' }));
  return prims;
}

export function buildBird(rawParams, quality = 'full') {
  const startedAt = performance.now();
  const params = clampBirdParams(rawParams);
  const rng = createRng(params.seed);
  const plumage = PLUMAGES.find(({ id }) => id === params.coatId) ?? PLUMAGES[0];
  const segments = quality === 'draft' ? BIRD_MESH_QUALITY.draftSegments : BIRD_MESH_QUALITY.fullSegments;
  const root = new THREE.Group();
  root.name = 'bird';

  const headRadius = 0.255 * params.headSize;
  const headC = V(0, 1.02, 0.045);
  const attachments = {
    leftWingRoot: V(-0.285, 0.79, -0.005),
    rightWingRoot: V(0.285, 0.79, -0.005),
    tailRoot: V(0, 0.56, -0.285),
    leftHip: V(-0.12, 0.225, 0.005),
    rightHip: V(0.12, 0.225, 0.005),
  };
  const eyeLeftColor = params.eyeColor || '#171716';
  const eyeRightColor = params.oddEyes ? params.eyeColorRight : eyeLeftColor;
  const materials = {
    body: toon(plumage.base), wing: toon(plumage.wing), featherEdge: toon(plumage.featherEdge || plumage.chest),
    tail: toon(plumage.tail || plumage.wing), stripe: toon(plumage.stripe), marking: toon(plumage.marking || plumage.stripe),
    cere: toon(plumage.cere), beak: toon(plumage.beak),
    beakShadow: toon(plumage.beakShadow || '#c89532'), foot: toon(plumage.foot || '#aa9c9c'),
    eyeLeft: toon(eyeLeftColor), eyeRight: toon(eyeRightColor), throatDot: toon(plumage.throatDot || '#8e8985'),
  };

  const prims = createBodyPrimitives(params, headC, headRadius);
  const cellSize = quality === 'draft' ? 0.064 : 0.042;
  const bodyGeometry = meshFromSDF(prims, cellSize, -0.12);
  bodyGeometry.userData.meshCellSize = cellSize;
  bodyGeometry.userData.meshQuality = quality;
  bodyGeometry.userData.meshMode = 'bird-sdf-v3';

  const visible = new THREE.Group();
  visible.name = 'birdVisible';
  visible.rotation.y = -0.22;
  root.add(visible);

  const fur = new THREE.Mesh(bodyGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  fur.name = 'fur';
  fur.geometry.userData.meshMode = 'bird-sdf-v3';
  visible.add(fur);
  const body = addOutlined(visible, bodyGeometry, materials.body, 'body');

  const head = new THREE.Group();
  head.name = 'head';
  head.position.copy(headC);
  head.rotation.y = 0.08;
  visible.add(head);
  const { face, eyeGroups } = addFace(head, headRadius, params, materials);

  const chest = new THREE.Group();
  chest.name = 'chest';
  chest.position.set(0, 0.68, 0.21);
  visible.add(chest);

  const wingScale = 0.84 + (params.earSize - 1) * 0.26;
  const leftWing = addWing(visible, -1, attachments.leftWingRoot.clone().add(V(0, -0.03, -0.015)), wingScale, materials, false);
  const rightWing = addWing(visible, 1, attachments.rightWingRoot.clone().add(V(0, -0.03, 0.15)), wingScale, materials, true);
  const tail = addTail(visible, attachments.tailRoot, params, materials);

  const feet = new THREE.Group();
  feet.name = 'feet';
  visible.add(feet);
  addFoot(feet, -1, attachments.leftHip, 0, materials, segments);
  addFoot(feet, 1, attachments.rightHip, 0, materials, segments);

  if (params.pose === 'loaf' || params.pose === 'containerCrouch' || params.pose === 'slouchSit') {
    visible.position.y -= 0.08;
    body.scale.y *= 0.90;
    feet.visible = false;
  } else if (params.pose === 'stretch') {
    leftWing.rotation.z = -0.95;
    rightWing.rotation.z = 0.95;
    head.rotation.x = -0.08;
  } else if (params.pose === 'biped') {
    body.scale.y *= 1.06;
    head.position.y += 0.045;
  } else if (params.pose === 'sideFlat') {
    visible.rotation.z = Math.PI * 0.42;
    visible.position.y += 0.08;
  } else if (params.pose === 'banana') {
    tail.scale.y *= 1.16;
  }

  const surfaceDetails = new THREE.Group();
  surfaceDetails.name = 'surfaceDetails';
  root.add(surfaceDetails);
  const animatedParts = [body, chest, head, leftWing, rightWing, tail];
  const baseTransforms = new Map(animatedParts.map((part) => [part, {
    position: part.position.clone(), rotation: part.rotation.clone(), scale: part.scale.clone(),
  }]));
  const resetParts = () => {
    for (const [part, base] of baseTransforms) {
      part.position.copy(base.position);
      part.rotation.copy(base.rotation);
      part.scale.copy(base.scale);
    }
    root.userData.animationRootLift = 0;
  };

  root.userData.headC = headC.clone();
  root.userData.hr = headRadius;
  root.userData.muzzle = V(0, headC.y - headRadius * 0.20, headC.z + headRadius);
  root.userData.buttC = attachments.tailRoot.clone();
  root.userData.attachments = Object.fromEntries(Object.entries(attachments).map(([key, value]) => [key, value.clone()]));
  root.userData.colliders = [
    { c: V(0, 0.56, 0), r: 0.37 },
    { c: headC.clone(), r: headRadius },
  ];
  root.userData.visualProfile = {
    species: 'budgerigar', modelVersion: 'sdf-v3', realism: 0.7, anime: 0.3,
    tailToBodyRatio: 0.72 * params.tailLength / 0.90,
  };
  root.userData.birdParts = { body, chest, head, face, leftWing, rightWing, tail, feet, eyeGroups };
  root.userData.resetBirdParts = resetParts;
  root.userData.updateEyeAnimation = (time, gazeX = 0, gazeY = 0) => {
    const blink = Math.sin(time * 0.81 + params.seed * 0.13) > 0.982 ? 0.10 : 1;
    for (const eye of eyeGroups) {
      eye.scale.y = blink;
      eye.rotation.y = gazeX * 0.08;
      eye.rotation.x = -gazeY * 0.06;
    }
  };
  root.userData.updateStaticIdle = (time, enabled = true) => {
    if (!enabled) return { enabled: false };
    const breath = Math.sin(time * 2.25) * 0.006;
    const curiosity = Math.max(0, Math.sin(time * 0.34 + params.seed * 0.01) - 0.84) / 0.16;
    const wingTwitch = Math.max(0, Math.sin(time * 0.63 + params.seed * 0.03) - 0.94) / 0.06;
    body.scale.z = baseTransforms.get(body).scale.z * (1 + breath);
    head.rotation.z = baseTransforms.get(head).rotation.z + curiosity * 0.13;
    head.rotation.y = baseTransforms.get(head).rotation.y + Math.sin(time * 0.52) * 0.025 + curiosity * 0.045;
    leftWing.rotation.z = baseTransforms.get(leftWing).rotation.z - wingTwitch * 0.035;
    rightWing.rotation.z = baseTransforms.get(rightWing).rotation.z + wingTwitch * 0.035;
    tail.rotation.z = baseTransforms.get(tail).rotation.z + Math.sin(time * 1.32) * 0.014 + wingTwitch * 0.018;
    return { enabled: true, tailAngle: tail.rotation.z, leftEarAngle: leftWing.rotation.z, rightEarAngle: rightWing.rotation.z };
  };
  root.userData.setTransientFluff = (amount = 0) => {
    const scale = 1 + Math.max(0, amount) * 0.022;
    body.scale.x = baseTransforms.get(body).scale.x * scale;
    body.scale.z = baseTransforms.get(body).scale.z * scale;
  };
  root.userData.updateDynamicCoat = (next = {}) => {
    if (next.dynamicCoatBase) materials.body.color.set(next.dynamicCoatBase);
    if (next.dynamicCoatA) materials.wing.color.set(next.dynamicCoatA);
    if (next.dynamicCoatB) materials.stripe.color.set(next.dynamicCoatB);
  };
  root.userData.prepareDynamicCoatExport = () => () => {};
  root.userData.buildTimings = {
    meshMs: performance.now() - startedAt,
    vertexDataMs: 0,
    detailsMs: performance.now() - startedAt,
    totalMs: performance.now() - startedAt,
  };
  root.userData.variant = rng.next();
  return root;
}
