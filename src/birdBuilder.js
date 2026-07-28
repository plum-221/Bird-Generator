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
  shape.bezierCurveTo(0.12, -0.025, 0.19, -0.15, 0.27, -0.24);
  shape.bezierCurveTo(0.34, -0.31, 0.30, -0.38, 0.19, -0.40);
  shape.bezierCurveTo(0.055, -0.42, -0.018, -0.29, 0.002, -0.14);
  shape.bezierCurveTo(0.012, -0.065, -0.008, -0.018, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.038, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.012, bevelThickness: 0.012,
  });
  geometry.translate(0, 0, -0.019);
  return geometry;
}

function createWingFeatherGeometry(length, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.30, -length * 0.08, width * 0.78, -length * 0.48, width, -length * 0.66);
  shape.bezierCurveTo(width * 0.78, -length * 0.88, width * 0.34, -length, 0, -length);
  shape.bezierCurveTo(-width * 0.08, -length * 0.66, -width * 0.05, -length * 0.18, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.004, bevelThickness: 0.004,
  });
  geometry.translate(0, 0, -0.007);
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
  wing.rotation.y = Math.PI * 0.5 - side * 0.28;
  wing.scale.setScalar(scale);
  parent.add(wing);

  addOutlined(wing, createWingGeometry(), materials.wing, 'wingShell');
  const prefix = side < 0 ? 'left' : 'right';
  addOutlined(wing, createWingFeatherGeometry(0.29, 0.13), materials.featherEdge, `${prefix}WingFeatherPrimary`, {
    position: V(0.040, -0.065, side * 0.040),
    rotation: [0, 0, -0.035],
  }, 1.012);
  addOutlined(wing, createWingFeatherGeometry(0.21, 0.09), materials.stripe, `${prefix}WingFeatherSecondary`, {
    position: V(0.055, -0.075, side * 0.050),
    rotation: [0, 0, -0.055],
  }, 1.012);
  wing.userData.design = 'compact-leaf';
  wing.userData.foldedPlane = 'side-back';
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
  const footMaterial = side < 0 ? materials.footFar : materials.foot;
  const toeTipMaterial = side < 0 ? materials.footTipFar : materials.footTip;
  const ankle = V(hip.x * 1.05, floorY + 0.055, 0.075);
  const leg = capsuleBetween(hip, ankle, 0.024, Math.max(7, segments / 2), footMaterial, parent, `${prefix}Leg`);
  const foot = new THREE.Group();
  foot.name = `${prefix}Foot`;
  parent.add(foot);

  addOutlined(foot, new THREE.SphereGeometry(0.036, 12, 8), footMaterial, `${prefix}FootPalm`, {
    position: ankle,
    scale: [1.12, 0.62, 1.38],
  }, 1.025);

  const toes = [
    ['ToeFrontOuter', side * 0.042, 0.155], ['ToeFrontInner', side * -0.018, 0.132],
    ['ToeBackOuter', side * 0.044, -0.105], ['ToeBackInner', side * -0.016, -0.09],
  ];
  for (const [suffix, dx, dz] of toes) {
    const tip = V(ankle.x + dx, floorY + 0.014, ankle.z + dz);
    const mid = ankle.clone().lerp(tip, 0.58);
    mid.y = floorY + 0.034;
    capsuleBetween(
      ankle,
      mid,
      0.014,
      6,
      footMaterial,
      foot,
      `${prefix}${suffix}`
    );
    capsuleBetween(mid, tip, 0.011, 6, toeTipMaterial, foot, `${prefix}${suffix}Tip`);
  }
  return leg;
}

function headSurfaceAnchor(headRadius, xRatio, yRatio, lift = 0) {
  const radii = V(headRadius, headRadius * 1.06, headRadius * 0.93);
  const x = headRadius * xRatio;
  const y = headRadius * yRatio;
  const radial = (x / radii.x) ** 2 + (y / radii.y) ** 2;
  const z = radii.z * Math.sqrt(Math.max(0.001, 1 - radial));
  const normal = V(x / (radii.x ** 2), y / (radii.y ** 2), z / (radii.z ** 2)).normalize();
  return { point: V(x, y, z + lift), normal };
}

function smallHeadSurfaceClearance(headRadius) {
  return Math.max(0, 0.255 - headRadius) * 0.24;
}

function addEye(face, side, headRadius, material, eyeSize) {
  const prefix = side < 0 ? 'left' : 'right';
  const group = new THREE.Group();
  group.name = `${prefix}EyeGroup`;
  const radius = headRadius * 0.105 * eyeSize;
  const surfaceLift = radius * 0.18 + smallHeadSurfaceClearance(headRadius);
  const anchor = headSurfaceAnchor(headRadius, side * 0.55, 0.08, surfaceLift);
  group.position.copy(anchor.point);
  group.quaternion.setFromUnitVectors(V(0, 0, 1), anchor.normal);
  group.userData.surfaceAnchored = true;
  group.userData.surfaceNormal = anchor.normal.clone();
  group.userData.surfaceLift = surfaceLift;
  face.add(group);

  const gaze = new THREE.Group();
  gaze.name = `${prefix}EyeGaze`;
  group.userData.gaze = gaze;
  group.add(gaze);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), material);
  eye.name = `${prefix}Eye`;
  eye.scale.z = 0.48;
  gaze.add(eye);
  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.28, 10, 8),
    new THREE.MeshBasicMaterial({ color: '#fffdf7' })
  );
  highlight.name = `${prefix}EyeHighlight`;
  highlight.position.set(-radius * 0.26, radius * 0.30, radius * 0.48);
  gaze.add(highlight);
  return group;
}

function addFace(headRig, headRadius, params, materials) {
  const face = new THREE.Group();
  face.name = 'face';
  face.position.z = 0.004 + Math.max(0, 0.255 - headRadius) * 0.35;
  face.userData.surfaceOffset = face.position.z;
  headRig.add(face);
  const eyeGroups = [
    addEye(face, -1, headRadius, materials.eyeLeft, params.eyeSize),
    addEye(face, 1, headRadius, materials.eyeRight, params.eyeSize),
  ];


  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const mark = new THREE.Mesh(new THREE.CapsuleGeometry(headRadius * 0.012, headRadius * 0.07, 3, 7), materials.marking);
      mark.name = `foreheadMark${side}-${i}`;
      const surfaceLift = headRadius * 0.006 + smallHeadSurfaceClearance(headRadius);
      const pitchClearance = headRadius * 0.08;
      const anchor = headSurfaceAnchor(headRadius, side * (0.18 + i * 0.105), 0.47 - i * 0.035, surfaceLift);
      const align = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), anchor.normal);
      const twist = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), side * (0.65 - i * 0.08));
      mark.position.copy(anchor.point).addScaledVector(anchor.normal, pitchClearance);
      mark.quaternion.copy(align).multiply(twist);
      mark.scale.z = 0.36;
      mark.userData.surfaceAnchored = true;
      mark.userData.surfaceNormal = anchor.normal.clone();
      mark.userData.surfaceLift = surfaceLift + pitchClearance;
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

function deriveBirdAnatomy(params) {
  const fluff = params.fluffy ? params.furFluff : 0.3;
  const width = 0.94 + (params.chubbiness - 1) * 0.16 + fluff * 0.014;
  const bodyLift = (params.legLength - 0.9) * 0.13;
  const headRadius = 0.255 * params.headSize;
  const headC = V(0, 0.86 + bodyLift + headRadius * 0.59, 0.045);
  return {
    fluff,
    width,
    bodyLift,
    headRadius,
    headC,
    wingScale: (0.86 + (params.earSize - 1) * 0.30) * (0.98 + (width - 1) * 0.12),
    attachments: {
      leftWingRoot: V(-0.310 * width, 0.79 + bodyLift + (headRadius - 0.270) * 0.12, 0.015),
      rightWingRoot: V(0.310 * width, 0.79 + bodyLift + (headRadius - 0.270) * 0.12, 0.015),
      tailRoot: V(0, 0.56 + bodyLift, -0.285 * width),
      leftHip: V(-0.123 * width, 0.225 + bodyLift, 0.005),
      rightHip: V(0.123 * width, 0.225 + bodyLift, 0.005),
    },
  };
}

function createBodyPrimitives(params, anatomy) {
  const { bodyLift, headC, headRadius, width } = anatomy;
  const prims = [];
  const P = (primitive) => prims.push(primitive);
  P(sphere({ c: V(0, 0.48 + bodyLift, 0), r: 0.37, s: [1.02 * width, 1.02, 0.76 * width], k: 0.16, tag: 'belly' }));
  P(sphere({ c: V(0, 0.69 + bodyLift, 0.035), r: 0.32, s: [0.93 * width, 1.10, 0.74 * width], k: 0.17, tag: 'chest' }));
  P(sphere({ c: V(0, 0.86 + bodyLift, 0.02), r: 0.25, s: [0.90 * width, 0.96, 0.78 * width], k: 0.16, tag: 'neck' }));
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

  const anatomy = deriveBirdAnatomy(params);
  const { headRadius, headC, attachments } = anatomy;
  const eyeLeftColor = params.eyeColor || '#171716';
  const eyeRightColor = params.oddEyes ? params.eyeColorRight : eyeLeftColor;
  const materials = {
    body: toon(plumage.base), wing: toon(plumage.wing), featherEdge: toon(plumage.featherEdge || plumage.chest),
    tail: toon(plumage.tail || plumage.wing), stripe: toon(plumage.stripe), marking: toon(plumage.marking || plumage.stripe),
    cere: toon(plumage.cere), beak: toon(plumage.beak),
    beakShadow: toon(plumage.beakShadow || '#c89532'), foot: toon(plumage.foot || '#aa9c9c'),
    footFar: toon(new THREE.Color(plumage.foot || '#aa9c9c').multiplyScalar(0.78).getStyle()),
    footTip: toon(new THREE.Color(plumage.foot || '#aa9c9c').multiplyScalar(0.68).getStyle()),
    footTipFar: toon(new THREE.Color(plumage.foot || '#aa9c9c').multiplyScalar(0.54).getStyle()),
    eyeLeft: toon(eyeLeftColor), eyeRight: toon(eyeRightColor), throatDot: toon(plumage.throatDot || '#8e8985'),
  };

  const prims = createBodyPrimitives(params, anatomy);
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
  chest.position.set(0, 0.68 + anatomy.bodyLift, 0.21);
  visible.add(chest);

  const leftWing = addWing(visible, -1, attachments.leftWingRoot, anatomy.wingScale, materials, false);
  const rightWing = addWing(visible, 1, attachments.rightWingRoot, anatomy.wingScale, materials, true);
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
  const interactionAnchor = (point, radius) => ({
    x: point.x, y: point.y, z: point.z, r: radius,
  });
  const interactionAnchors = {
    head: interactionAnchor(headC, headRadius * 1.16),
    chest: interactionAnchor(V(0, 0.72 + anatomy.bodyLift, 0.13), 0.29 * anatomy.width),
    beak: interactionAnchor(V(0, headC.y - headRadius * 0.22, headC.z + headRadius), headRadius * 0.22),
    leftWing: interactionAnchor(attachments.leftWingRoot, 0.24 * anatomy.wingScale),
    rightWing: interactionAnchor(attachments.rightWingRoot, 0.24 * anatomy.wingScale),
    body: interactionAnchor(V(0, 0.48 + anatomy.bodyLift, 0), 0.39 * anatomy.width),
  };
  const expressionCurrent = {
    eyeX: 1, eyeY: 1, headTilt: 0, headPitch: 0,
    wingLift: 0, bodyBob: 0, fluff: 0,
  };
  const expressionKeys = Object.keys(expressionCurrent);

  root.userData.headC = headC.clone();
  root.userData.hr = headRadius;
  root.userData.muzzle = V(0, headC.y - headRadius * 0.20, headC.z + headRadius);
  root.userData.buttC = attachments.tailRoot.clone();
  root.userData.attachments = Object.fromEntries(Object.entries(attachments).map(([key, value]) => [key, value.clone()]));
  root.userData.colliders = [
    { c: V(0, 0.56 + anatomy.bodyLift, 0), r: 0.37 * anatomy.width },
    { c: headC.clone(), r: headRadius },
  ];
  root.userData.visualProfile = {
    species: 'budgerigar', modelVersion: 'sdf-v3', realism: 0.7, anime: 0.3,
    tailToBodyRatio: 0.72 * params.tailLength / 0.90,
  };
  root.userData.birdParts = { body, chest, head, face, leftWing, rightWing, tail, feet, eyeGroups };
  root.userData.resetBirdParts = resetParts;
  root.userData.getInteractionAnchors = () => Object.fromEntries(
    Object.entries(interactionAnchors).map(([key, anchor]) => [key, { ...anchor }])
  );
  root.userData.applyExpression = (sample = {}, dt = 1 / 60, modelEnabled = true) => {
    const expression = modelEnabled ? sample.expression : null;
    const intensity = modelEnabled ? Math.max(0, sample.intensity ?? 0) : 0;
    const factor = 1 - Math.exp(-Math.min(Math.max(dt, 0), 0.1) * 15);
    for (const key of expressionKeys) {
      const neutral = key === 'eyeX' || key === 'eyeY' ? 1 : 0;
      const target = expression ? neutral + ((expression[key] ?? neutral) - neutral) * intensity : neutral;
      expressionCurrent[key] += (target - expressionCurrent[key]) * factor;
    }
    head.rotation.x = baseTransforms.get(head).rotation.x + expressionCurrent.headPitch;
    head.rotation.z += expressionCurrent.headTilt;
    leftWing.rotation.z -= expressionCurrent.wingLift;
    rightWing.rotation.z += expressionCurrent.wingLift;
    body.position.y = baseTransforms.get(body).position.y + expressionCurrent.bodyBob;
    body.scale.x = baseTransforms.get(body).scale.x * (1 + expressionCurrent.fluff * 0.035);
    body.scale.z *= 1 + expressionCurrent.fluff * 0.026;
    for (const eye of eyeGroups) {
      const gaze = eye.userData.gaze;
      gaze.scale.x = expressionCurrent.eyeX;
      gaze.scale.y *= expressionCurrent.eyeY;
    }
    root.userData.expressionState = sample.state ?? 'neutral';
    return { state: root.userData.expressionState, ...expressionCurrent };
  };
  root.userData.clearExpression = () => {
    Object.assign(expressionCurrent, {
      eyeX: 1, eyeY: 1, headTilt: 0, headPitch: 0,
      wingLift: 0, bodyBob: 0, fluff: 0,
    });
    root.userData.expressionState = 'neutral';
  };
  root.userData.updateEyeAnimation = (time, gazeX = 0, gazeY = 0) => {
    const blink = Math.sin(time * 0.81 + params.seed * 0.13) > 0.982 ? 0.10 : 1;
    for (const eye of eyeGroups) {
      const gaze = eye.userData.gaze;
      gaze.scale.y = blink;
      gaze.rotation.y = gazeX * 0.08;
      gaze.rotation.x = -gazeY * 0.06;
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
