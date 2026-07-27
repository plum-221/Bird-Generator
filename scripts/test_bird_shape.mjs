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

console.log({ status: 'ok', parts: names.size, silhouette: [size.x, size.y, size.z].map((v) => Number(v.toFixed(3))) });
