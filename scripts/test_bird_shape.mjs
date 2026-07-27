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
assert.ok(bird.userData.visualProfile.tailToBodyRatio >= 0.48);

const bounds = new Box3()
  .setFromObject(bird.getObjectByName('body'))
  .union(new Box3().setFromObject(bird.getObjectByName('head')));
const size = bounds.getSize(new Vector3());
assert.ok(size.y > size.x * 1.15, `standing torso must be vertical, got ${size.x.toFixed(2)}×${size.y.toFixed(2)}`);

console.log({ status: 'ok', parts: names.size, silhouette: [size.x, size.y, size.z].map((v) => Number(v.toFixed(3))) });
