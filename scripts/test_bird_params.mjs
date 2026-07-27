import assert from 'node:assert/strict';
import { PLUMAGES, POSES } from '../src/birdPresets.js';
import { BIRD_PARAMETER_LIMITS, DEFAULT_BIRD_PARAMS, DEFAULT_BIRD_SEED, clampBirdParams } from '../src/birdParams.js';

assert.equal(DEFAULT_BIRD_PARAMS.coatId, 'snow');
assert.equal(DEFAULT_BIRD_PARAMS.seed, DEFAULT_BIRD_SEED);
assert.ok(DEFAULT_BIRD_PARAMS.chubbiness > 1, 'default photo bird should be round');
assert.ok(PLUMAGES.some(({ id }) => id === DEFAULT_BIRD_PARAMS.coatId));
assert.ok(POSES.some(({ id }) => id === DEFAULT_BIRD_PARAMS.pose));
for (const plumage of PLUMAGES) {
  for (const key of ['id', 'name', 'base', 'chest', 'wing', 'stripe', 'cheek', 'cere', 'beak']) {
    assert.ok(plumage[key], `plumage ${plumage.id} must define ${key}`);
  }
}
const clamped = clampBirdParams({ headSize: 99, chubbiness: -5, tailLength: Number.NaN });
assert.equal(clamped.headSize, BIRD_PARAMETER_LIMITS.headSize[1]);
assert.equal(clamped.chubbiness, BIRD_PARAMETER_LIMITS.chubbiness[0]);
assert.equal(clamped.tailLength, DEFAULT_BIRD_PARAMS.tailLength);
assert.deepEqual(clampBirdParams({ seed: 42 }), clampBirdParams({ seed: 42 }));
console.log({ status: 'ok', presets: PLUMAGES.length, poses: POSES.length, seed: DEFAULT_BIRD_SEED });
