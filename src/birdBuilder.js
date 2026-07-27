import * as THREE from 'three';
import { createRng } from './rng.js';
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

function toon(color) {
  return new THREE.MeshToonMaterial({ color, gradientMap: TOON_GRADIENT, emissive: color, emissiveIntensity: 0.075 });
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

function addPlain(parent, geometry, material, name, transform = {}) {
  const group = new THREE.Group();
  group.name = `${name}Group`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  group.add(mesh);
  if (transform.position) group.position.copy(transform.position);
  if (transform.rotation) group.rotation.set(...transform.rotation);
  if (transform.scale) group.scale.set(...transform.scale);
  parent.add(group);
  return group;
}

function capsuleBetween(a, b, radius, segments, material, parent, name, outlineScale = 1.018) {
  const length = a.distanceTo(b);
  const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 2), 5, segments);
  const group = addOutlined(parent, geometry, material, name, {}, outlineScale);
  group.position.copy(a).lerp(b, 0.5);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return group;
}

function createPearGeometry(segments) {
  const profile = [
    [0.10, -0.45], [0.29, -0.41], [0.40, -0.27], [0.43, -0.05],
    [0.38, 0.17], [0.29, 0.34], [0.15, 0.43], [0.05, 0.45],
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  return new THREE.LatheGeometry(profile, segments);
}

function createWingGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.31);
  shape.bezierCurveTo(0.18, 0.24, 0.21, -0.05, 0.08, -0.36);
  shape.bezierCurveTo(0.02, -0.43, -0.04, -0.43, -0.09, -0.35);
  shape.bezierCurveTo(-0.20, -0.05, -0.17, 0.23, 0, 0.31);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.065, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.018, bevelThickness: 0.018,
  });
  geometry.translate(0, 0, -0.0325);
  return geometry;
}

function createFeatherGeometry(length, width, segments) {
  return new THREE.CapsuleGeometry(width, Math.max(0.04, length - width * 2), 5, Math.max(8, segments));
}

function createTailFeatherGeometry(length, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, length * 0.5);
  shape.bezierCurveTo(width, length * 0.32, width * 0.78, -length * 0.28, 0, -length * 0.5);
  shape.bezierCurveTo(-width * 0.78, -length * 0.28, -width, length * 0.32, 0, length * 0.5);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.032, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.008, bevelThickness: 0.008,
  });
  geometry.translate(0, 0, -0.016);
  return geometry;
}

function addWing(parent, side, center, scale, materials, segments) {
  const wing = new THREE.Group();
  wing.name = side < 0 ? 'leftWing' : 'rightWing';
  wing.position.copy(center);
  wing.rotation.z = side * -0.055;
  wing.scale.set(scale * 1.22, scale * 0.86, scale);
  parent.add(wing);

  addOutlined(wing, createWingGeometry(), materials.wing, 'wingShell', {
    scale: [side, 1, 1], rotation: [0.06, 0, 0],
  });
  for (let i = 0; i < 4; i++) {
    addOutlined(
      wing,
      createFeatherGeometry(0.22 + i * 0.035, 0.014 + i * 0.002, Math.max(8, segments / 2)),
      i === 0 ? materials.stripe : materials.featherEdge,
      `wingFeather${i}`,
      {
        position: new THREE.Vector3(side * (0.045 + i * 0.024), -0.085 - i * 0.052, 0.096),
        rotation: [0.12, 0, side * (0.08 + i * 0.025)],
        scale: [1, 1, 0.62],
      },
      1.012
    );
  }
  return wing;
}

function addTail(parent, bodyY, params, materials) {
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(0.10, bodyY + 0.12, -0.03);
  tail.rotation.x = 0.08 + params.tailCurl * 0.1;
  tail.rotation.z = 0.72;
  parent.add(tail);

  const mainLength = 0.69 * params.tailLength;
  for (const [side, name] of [[-1, 'mainTailLeft'], [1, 'mainTailRight']]) {
    addOutlined(
      tail,
      createTailFeatherGeometry(mainLength, 0.088),
      materials.tail,
      name,
      {
        position: new THREE.Vector3(side * 0.072, -mainLength * 0.26, side * 0.012),
        rotation: [0.10, 0, side * 0.045],
        scale: [1, 1, 0.84],
      }
    );
  }
  for (const [side, name] of [[-1, 'sideTailLeft'], [1, 'sideTailRight']]) {
    const length = mainLength * 0.72;
    addOutlined(
      tail,
      createTailFeatherGeometry(length, 0.096),
      materials.wing,
      name,
      {
        position: new THREE.Vector3(side * 0.135, -length * 0.22, 0.018),
        rotation: [0.06, 0, side * 0.13],
        scale: [1, 1, 0.84],
      }
    );
  }
  return tail;
}

function addFoot(parent, side, floorY, z, legLength, materials, segments) {
  const x = side * 0.135;
  const legTop = new THREE.Vector3(x, floorY + 0.25 * legLength, z - 0.015);
  const ankle = new THREE.Vector3(x, floorY + 0.045, z);
  const leg = capsuleBetween(legTop, ankle, 0.022, Math.max(7, segments / 2), materials.foot, parent, side < 0 ? 'leftLeg' : 'rightLeg');

  const foot = new THREE.Group();
  foot.name = side < 0 ? 'leftFoot' : 'rightFoot';
  parent.add(foot);
  const prefix = side < 0 ? 'left' : 'right';
  const toeSpecs = [
    ['ToeFrontOuter', side * 0.035, 0.155], ['ToeFrontInner', side * -0.018, 0.135],
    ['ToeBackOuter', side * 0.042, -0.105], ['ToeBackInner', side * -0.016, -0.09],
  ];
  for (const [suffix, dx, dz] of toeSpecs) {
    capsuleBetween(
      new THREE.Vector3(x, floorY + 0.026, z),
      new THREE.Vector3(x + dx, floorY + 0.016, z + dz),
      0.0105,
      6,
      materials.foot,
      foot,
      `${prefix}${suffix}`,
      1.012
    );
  }
  return leg;
}

function addEye(head, side, headRadius, material, eyeSize) {
  const eyeGroup = new THREE.Group();
  const prefix = side < 0 ? 'left' : 'right';
  eyeGroup.name = `${prefix}EyeGroup`;
  eyeGroup.position.set(side * headRadius * 0.58, headRadius * 0.10, headRadius * 0.80);
  head.add(eyeGroup);

  const eyeRadius = headRadius * 0.128 * eyeSize;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 18, 12), material);
  eye.name = `${prefix}Eye`;
  eye.scale.z = 0.48;
  eyeGroup.add(eye);

  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(eyeRadius * 0.29, 10, 8),
    new THREE.MeshBasicMaterial({ color: '#fffdf5' })
  );
  highlight.name = `${prefix}EyeHighlight`;
  highlight.position.set(-eyeRadius * 0.25, eyeRadius * 0.30, eyeRadius * 0.50);
  eyeGroup.add(highlight);
  return eyeGroup;
}

function addFace(head, headRadius, params, materials) {
  const face = new THREE.Group();
  face.name = 'face';
  head.add(face);
  const eyeGroups = [
    addEye(face, -1, headRadius, materials.eyeLeft, params.eyeSize),
    addEye(face, 1, headRadius, materials.eyeRight, params.eyeSize),
  ];

  for (const side of [-1, 1]) {
    addOutlined(face, new THREE.SphereGeometry(headRadius * 0.135, 14, 9), materials.cheek, side < 0 ? 'leftCheek' : 'rightCheek', {
      position: new THREE.Vector3(side * headRadius * 0.55, -headRadius * 0.22, headRadius * 0.80),
      scale: [1.06, 0.72, 0.34],
    }, 1.012);
    for (let i = 0; i < 2; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.025, 8, 6), materials.throatDot);
      dot.name = `${side < 0 ? 'left' : 'right'}ThroatDot${i}`;
      dot.position.set(side * headRadius * (0.28 + i * 0.09), -headRadius * (0.34 + i * 0.035), headRadius * 0.92);
      face.add(dot);
    }
  }

  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      addOutlined(face, new THREE.CapsuleGeometry(headRadius * 0.014, headRadius * (0.075 + i * 0.012), 3, 7), materials.marking, `foreheadMark${side}-${i}`, {
        position: new THREE.Vector3(side * headRadius * (0.20 + i * 0.11), headRadius * (0.49 - i * 0.04), headRadius * (0.90 + i * 0.01)),
        rotation: [0, 0, side * (0.68 - i * 0.08)],
        scale: [1, 1, 0.38],
      }, 1.008);
    }
  }

  addOutlined(face, new THREE.SphereGeometry(headRadius * 0.18, 14, 9), materials.cere, 'cere', {
    position: new THREE.Vector3(0, -headRadius * 0.06, headRadius * 0.91),
    scale: [1.14, 0.50, 0.44],
  }, 1.012);
  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.018, 8, 6), materials.throatDot);
    nostril.name = side < 0 ? 'leftNostril' : 'rightNostril';
    nostril.position.set(side * headRadius * 0.075, -headRadius * 0.045, headRadius * 0.995);
    face.add(nostril);
  }
  addOutlined(face, new THREE.SphereGeometry(headRadius * 0.17, 14, 9), materials.beak, 'upperBeak', {
    position: new THREE.Vector3(0, -headRadius * 0.22, headRadius * 1.00),
    scale: [1.00, 0.74, 0.76],
  });
  addOutlined(face, new THREE.ConeGeometry(headRadius * 0.075, headRadius * 0.17, 14), materials.beak, 'beakHook', {
    position: new THREE.Vector3(0, -headRadius * 0.315, headRadius * 1.025),
    rotation: [0, 0, Math.PI],
    scale: [0.72, 0.82, 0.64],
  }, 1.01);
  addOutlined(face, new THREE.ConeGeometry(headRadius * 0.09, headRadius * 0.19, 14), materials.beakShadow, 'lowerBeak', {
    position: new THREE.Vector3(0, -headRadius * 0.37, headRadius * 0.99),
    rotation: [Math.PI, 0, 0],
    scale: [0.92, 1, 0.72],
  }, 1.012);
  return { face, eyeGroups };
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
  const widthScale = 0.94 + (params.chubbiness - 1) * 0.18 + fluff * 0.018;
  const bodyY = 0.56;
  const bodyHeight = 0.90 + fluff * 0.012;
  const headRadius = 0.25 * params.headSize;
  const headC = new THREE.Vector3(0, bodyY + 0.39, 0.055);
  const eyeLeftColor = params.eyeColor || '#171716';
  const eyeRightColor = params.oddEyes ? params.eyeColorRight : eyeLeftColor;
  const materials = {
    body: toon(plumage.base), chest: toon(plumage.chest), wing: toon(plumage.wing),
    featherEdge: toon(plumage.featherEdge || plumage.chest), tail: toon(plumage.tail || plumage.wing),
    stripe: toon(plumage.stripe), marking: toon(plumage.marking || plumage.stripe),
    cheek: toon(plumage.cheek), cere: toon(plumage.cere), beak: toon(plumage.beak),
    beakShadow: toon(plumage.beakShadow || '#c99632'), foot: toon(plumage.foot || '#a99b9a'),
    eyeLeft: toon(eyeLeftColor), eyeRight: toon(eyeRightColor), throatDot: toon(plumage.throatDot || '#8d8880'),
  };

  const hitGeometry = new THREE.CapsuleGeometry(0.36 * widthScale, 0.64, 8, segments);
  const fur = new THREE.Mesh(hitGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  fur.name = 'fur';
  fur.position.set(0, bodyY + 0.12, 0);
  fur.scale.set(1, 1.08, 0.82);
  fur.geometry.userData.meshCellSize = quality === 'draft' ? 0.09 : 0.055;
  fur.geometry.userData.meshMode = `bird-${quality}`;
  root.add(fur);

  const visible = new THREE.Group();
  visible.name = 'birdVisible';
  visible.rotation.y = -0.43;
  root.add(visible);

  const body = addOutlined(visible, createPearGeometry(segments), materials.body, 'body', {
    position: new THREE.Vector3(0, bodyY, 0),
    scale: [0.90 * widthScale, bodyHeight, 0.65 * widthScale],
  });
  const neckBridge = addPlain(visible, new THREE.SphereGeometry(0.30, segments, Math.max(12, segments / 2)), materials.body, 'neckBridge', {
    position: new THREE.Vector3(0, bodyY + 0.285, 0.01),
    scale: [0.86 * widthScale, 0.76, 0.64 * widthScale],
  });
  const chest = addPlain(visible, new THREE.SphereGeometry(0.31, segments, Math.max(12, segments / 2)), materials.chest, 'chest', {
    position: new THREE.Vector3(0, bodyY - 0.045, 0.255),
    scale: [0.75 * widthScale, 1.04, 0.30],
  });
  const head = addOutlined(visible, new THREE.SphereGeometry(headRadius, segments, Math.max(12, segments / 2)), materials.body, 'head', {
    position: headC,
    scale: [1.00, 1.05 + fluff * 0.012, 0.90],
    rotation: [0, 0.10, 0.025],
  });

  const wingScale = 0.82 + (params.earSize - 1) * 0.28;
  const leftWing = addWing(visible, -1, new THREE.Vector3(-0.225 * widthScale, bodyY + 0.055, 0.19), wingScale, materials, segments);
  const rightWing = addWing(visible, 1, new THREE.Vector3(0.225 * widthScale, bodyY + 0.055, 0.19), wingScale, materials, segments);
  const tail = addTail(visible, bodyY, params, materials);
  const { face, eyeGroups } = addFace(head, headRadius, params, materials);

  const feet = new THREE.Group();
  feet.name = 'feet';
  visible.add(feet);
  addFoot(feet, -1, 0, 0.075, params.legLength, materials, segments);
  addFoot(feet, 1, 0, 0.075, params.legLength, materials, segments);

  if (params.pose === 'loaf' || params.pose === 'containerCrouch' || params.pose === 'slouchSit') {
    visible.position.y -= 0.11;
    body.scale.y *= 0.82;
    body.scale.x *= 1.08;
    feet.visible = false;
  } else if (params.pose === 'stretch') {
    leftWing.rotation.z = -0.78;
    rightWing.rotation.z = 0.78;
    head.rotation.x = -0.10;
  } else if (params.pose === 'biped') {
    body.scale.y *= 1.10;
    head.position.y += 0.07;
  } else if (params.pose === 'sideFlat') {
    visible.rotation.z = Math.PI * 0.42;
    visible.position.y += 0.08;
  } else if (params.pose === 'banana') {
    tail.scale.y *= 1.20;
    body.scale.y *= 1.05;
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
  root.userData.muzzle = new THREE.Vector3(0, headC.y - headRadius * 0.22, headC.z + headRadius * 0.96);
  root.userData.buttC = new THREE.Vector3(0, bodyY - 0.08, -0.25);
  root.userData.colliders = [
    { c: new THREE.Vector3(0, bodyY, 0), r: 0.37 * widthScale },
    { c: headC.clone(), r: headRadius },
  ];
  root.userData.visualProfile = {
    species: 'budgerigar', realism: 0.7, anime: 0.3,
    tailToBodyRatio: 0.69 * params.tailLength / bodyHeight,
  };
  root.userData.birdParts = { body, chest, neckBridge, head, face, leftWing, rightWing, tail, feet, eyeGroups };
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
    const breath = Math.sin(time * 2.25) * 0.010;
    const curiosity = Math.max(0, Math.sin(time * 0.34 + params.seed * 0.01) - 0.84) / 0.16;
    const wingTwitch = Math.max(0, Math.sin(time * 0.63 + params.seed * 0.03) - 0.94) / 0.06;
    body.scale.z = baseTransforms.get(body).scale.z * (1 + breath * 0.4);
    chest.scale.y = baseTransforms.get(chest).scale.y * (1 + breath * 1.2);
    chest.scale.z = baseTransforms.get(chest).scale.z * (1 + breath * 1.6);
    head.rotation.z = baseTransforms.get(head).rotation.z + curiosity * 0.16;
    head.rotation.y = baseTransforms.get(head).rotation.y + Math.sin(time * 0.52) * 0.035 + curiosity * 0.06;
    leftWing.rotation.z = baseTransforms.get(leftWing).rotation.z - wingTwitch * 0.045;
    rightWing.rotation.z = baseTransforms.get(rightWing).rotation.z + wingTwitch * 0.045;
    tail.rotation.z = baseTransforms.get(tail).rotation.z + Math.sin(time * 1.32) * 0.018 + wingTwitch * 0.025;
    return { enabled: true, tailAngle: tail.rotation.z, leftEarAngle: leftWing.rotation.z, rightEarAngle: rightWing.rotation.z };
  };
  root.userData.setTransientFluff = (amount = 0) => {
    const scale = 1 + Math.max(0, amount) * 0.028;
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
    meshMs: 0, vertexDataMs: 0, detailsMs: performance.now() - startedAt, totalMs: performance.now() - startedAt,
  };
  root.userData.variant = rng.next();
  return root;
}
