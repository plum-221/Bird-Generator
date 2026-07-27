import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { buildBird } from '../src/birdBuilder.js';
import { DEFAULT_BIRD_PARAMS } from '../src/birdParams.js';

const bird = buildBird(DEFAULT_BIRD_PARAMS, 'draft');
bird.updateMatrixWorld(true);

const names = new Set();
bird.traverse((node) => names.add(node.name));
for (const required of [
  'body', 'head', 'leftWing', 'rightWing', 'upperBeak', 'lowerBeak', 'cere',
  'leftEyeHighlight', 'rightEyeHighlight', 'mainTailLeft', 'mainTailRight',
  'leftToeFrontOuter', 'leftToeFrontInner', 'leftToeBackOuter', 'leftToeBackInner',
  'rightToeFrontOuter', 'rightToeFrontInner', 'rightToeBackOuter', 'rightToeBackInner',
]) {
  assert.ok(names.has(required), `bird V2 must include ${required}`);
}

assert.equal(bird.userData.birdParts.eyeGroups.length, 2);
assert.ok(bird.userData.birdParts.face, 'face must move with the head');
const [leftEyeGroup, rightEyeGroup] = bird.userData.birdParts.eyeGroups;
for (const eyeGroup of [leftEyeGroup, rightEyeGroup]) {
  assert.equal(eyeGroup.userData.surfaceAnchored, true, 'eyes must use head-surface anchors');
  assert.ok(Math.abs(eyeGroup.userData.surfaceNormal.length() - 1) < 1e-6, 'eye surface normal must be normalized');
}
assert.ok(leftEyeGroup.userData.surfaceNormal.x < 0 && rightEyeGroup.userData.surfaceNormal.x > 0, 'eye normals must face outward symmetrically');
const foreheadMarks = [...names].filter((name) => name.startsWith('foreheadMark'));
assert.equal(foreheadMarks.length, 6, 'bird must keep six forehead feather marks');
for (const name of foreheadMarks) {
  assert.equal(bird.getObjectByName(name).userData.surfaceAnchored, true, `${name} must use a head-surface anchor`);
}
assert.ok(!bird.getObjectByName('leftCheek'), 'left cheek geometry must be removed');
assert.ok(!bird.getObjectByName('rightCheek'), 'right cheek geometry must be removed');
assert.equal([...names].filter((name) => name.includes('ThroatDot')).length, 0, 'decorative throat dots must be removed');
assert.equal(typeof bird.userData.getInteractionAnchors, 'function', 'bird must expose anatomical interaction anchors');
assert.equal(typeof bird.userData.applyExpression, 'function', 'bird must expose an additive expression interface');
const interactionAnchors = bird.userData.getInteractionAnchors();
for (const key of ['head', 'chest', 'beak', 'leftWing', 'rightWing', 'body']) {
  assert.ok(interactionAnchors[key]?.r > 0, `missing interaction anchor ${key}`);
}
const expressionHead = bird.getObjectByName('head');
const expressionWing = bird.getObjectByName('leftWing');
const baseHeadTilt = expressionHead.rotation.z;
const baseWingTilt = expressionWing.rotation.z;
bird.userData.updateEyeAnimation(0, 0, 0);
bird.userData.applyExpression({ state: 'love', intensity: 1, expression: {
  eyeX: 1.03, eyeY: 0.58, headTilt: 0.13, headPitch: 0.02,
  wingLift: 0.14, bodyBob: 0.012, fluff: 0.14,
} }, 0.5);
assert.ok(expressionHead.rotation.z > baseHeadTilt + 0.08, 'love expression must visibly tilt the head');
assert.ok(expressionWing.rotation.z < baseWingTilt - 0.08, 'love expression must lift the folded wing');
assert.ok(leftEyeGroup.userData.gaze.scale.y < 0.75, 'love expression must soften the eyes through EyeGaze');
assert.ok(bird.userData.visualProfile, 'bird must publish visual profile metadata');
assert.equal(bird.userData.visualProfile.species, 'budgerigar');
assert.equal(bird.userData.visualProfile.modelVersion, 'sdf-v3');
assert.ok(bird.userData.visualProfile.tailToBodyRatio >= 0.48);
assert.equal(bird.getObjectByName('body').geometry.userData.meshMode, 'bird-sdf-v3');

const attachments = bird.userData.attachments;
assert.ok(attachments, 'bird must publish anatomical attachments');
assert.ok(attachments.leftWingRoot.x < -0.18 && attachments.leftWingRoot.y > 0.7, 'left wing root must sit on shoulder-back');
assert.ok(attachments.rightWingRoot.x > 0.18 && attachments.rightWingRoot.y > 0.7, 'right wing root must sit on shoulder-back');
assert.ok(Math.abs(attachments.tailRoot.x) < 0.03 && attachments.tailRoot.z < -0.2, 'tail must start at rump midline');
assert.ok(attachments.leftHip.y < 0.3 && attachments.rightHip.y < 0.3, 'legs must start below abdomen');
assert.ok(Math.abs(attachments.leftHip.x + attachments.rightHip.x) < 0.001, 'hips must be symmetric');

const bounds = new Box3()
  .setFromObject(bird.getObjectByName('body'))
  .union(new Box3().setFromObject(bird.getObjectByName('head')));
const size = bounds.getSize(new Vector3());
assert.ok(size.y > size.x * 1.15, `standing torso must be vertical, got ${size.x.toFixed(2)}×${size.y.toFixed(2)}`);

const positions = bird.getObjectByName('body').geometry.attributes.position;
const widthInBand = (minY, maxY) => {
  let minX = Infinity;
  let maxX = -Infinity;
  for (let index = 0; index < positions.count; index++) {
    const y = positions.getY(index);
    if (y < minY || y >= maxY) continue;
    minX = Math.min(minX, positions.getX(index));
    maxX = Math.max(maxX, positions.getX(index));
  }
  return maxX - minX;
};
const shoulderWidth = widthInBand(0.72, 0.86);
const lowerChestWidth = widthInBand(0.58, 0.72);
assert.ok(shoulderWidth <= lowerChestWidth * 1.02, `shoulder contour must taper smoothly, got ${shoulderWidth.toFixed(3)} vs ${lowerChestWidth.toFixed(3)}`);

const leftWing = bird.getObjectByName('leftWing');
const rightWing = bird.getObjectByName('rightWing');
assert.equal(leftWing.userData.design, 'compact-leaf', 'left wing must use compact leaf design');
assert.equal(rightWing.userData.design, 'compact-leaf', 'right wing must use compact leaf design');
assert.equal(leftWing.userData.foldedPlane, 'side-back', 'folded wing must lie on the body side');
assert.ok(bird.getObjectByName('leftWingFeatherPrimary'), 'wing must contain a shaped primary feather panel');
assert.ok(bird.getObjectByName('leftWingFeatherSecondary'), 'wing must contain a shaped secondary feather panel');
assert.ok(!bird.getObjectByName('wingFeather0'), 'capsule wing stripes must be removed');

for (const side of ['left', 'right']) {
  const palm = bird.getObjectByName(`${side}FootPalm`);
  const toe = bird.getObjectByName(`${side}ToeFrontOuter`);
  const toeTip = bird.getObjectByName(`${side}ToeFrontOuterTip`);
  assert.ok(palm, `${side} foot must include a stylized palm connector`);
  assert.equal(toe.material.type, 'MeshToonMaterial', `${side} toes must use toon shading`);
  assert.equal(toeTip.material.type, 'MeshToonMaterial', `${side} toe tips must use toon shading`);
  assert.notEqual(toeTip.material.color.getHex(), toe.material.color.getHex(), `${side} toe tips must form a darker toon block`);
  assert.ok(bird.getObjectByName(`${side}ToeFrontOuterOutline`), `${side} toes must keep a visible outline`);
}

const makeBird = (overrides) => {
  const model = buildBird({ ...DEFAULT_BIRD_PARAMS, ...overrides }, 'draft');
  model.updateMatrixWorld(true);
  return model;
};
const slim = makeBird({ chubbiness: 0.6, furFluff: 0.15 });
const round = makeBird({ chubbiness: 2.2, furFluff: 2.4 });
assert.ok(
  Math.abs(round.userData.attachments.rightWingRoot.x) > Math.abs(slim.userData.attachments.rightWingRoot.x) + 0.025,
  'wing roots must follow body width'
);
assert.ok(
  Math.abs(round.userData.attachments.rightHip.x) > Math.abs(slim.userData.attachments.rightHip.x) + 0.01,
  'hips must follow body width'
);
assert.ok(
  Math.abs(round.userData.attachments.tailRoot.z) > Math.abs(slim.userData.attachments.tailRoot.z) + 0.02,
  'tail root must follow body depth'
);

const smallHead = makeBird({ headSize: 0.65 });
const largeHead = makeBird({ headSize: 1.65 });
assert.ok(largeHead.userData.headC.y > smallHead.userData.headC.y + 0.1, 'head center must rise as head radius grows');
assert.ok(
  smallHead.userData.birdParts.face.userData.surfaceOffset > largeHead.userData.birdParts.face.userData.surfaceOffset + 0.02,
  'small heads must push face details forward to remain on the surface'
);
assert.ok(
  smallHead.getObjectByName('leftEyeGroup').userData.surfaceLift
    > largeHead.getObjectByName('leftEyeGroup').userData.surfaceLift + 0.015,
  'small heads must give surface-anchored eyes enough clearance from the blended body shell'
);

const shortLegs = makeBird({ legLength: 0.45 });
const longLegs = makeBird({ legLength: 1.8 });
assert.ok(
  longLegs.userData.attachments.leftHip.y > shortLegs.userData.attachments.leftHip.y + 0.12,
  'leg length must change the hip-to-floor distance'
);
for (const model of [shortLegs, longLegs]) {
  const footBounds = new Box3().setFromObject(model.userData.birdParts.feet);
  assert.ok(Math.abs(footBounds.min.y) < 0.02, `feet must stay grounded, got y=${footBounds.min.y.toFixed(3)}`);
}

const smallWings = makeBird({ earSize: 0.55 });
const largeWings = makeBird({ earSize: 1.8 });
assert.ok(
  largeWings.getObjectByName('leftWing').scale.x > smallWings.getObjectByName('leftWing').scale.x + 0.3,
  'wing size control must scale the compact wing without moving its root'
);

console.log({ status: 'ok', parts: names.size, silhouette: [size.x, size.y, size.z].map((v) => Number(v.toFixed(3))) });
