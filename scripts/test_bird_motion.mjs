import assert from 'node:assert/strict';
import { BIRD_MOTION_ACTIONS, getBirdRigCompatibility } from '../src/birdMotionRig.js';
import { createBirdMotionStateMachine } from '../src/birdMotionStateMachine.js';

assert.equal(BIRD_MOTION_ACTIONS.length, 14);
assert.equal(new Set(BIRD_MOTION_ACTIONS.map(({ id }) => id)).size, 14);
for (const action of BIRD_MOTION_ACTIONS) {
  assert.ok(action.duration > 0);
  assert.equal(getBirdRigCompatibility('standing', action.id).grade, 'full');
}
const machine = createBirdMotionStateMachine();
machine.setKey('KeyW', true);
const walking = machine.update(0.1);
assert.equal(walking.action, 'walk');
assert.ok(walking.position.z > 0);
machine.setKey('KeyW', false);
assert.ok(machine.triggerCode('Space'));
assert.equal(machine.update(0.01).action, 'jump');
console.log({ status: 'ok', actions: BIRD_MOTION_ACTIONS.length });
