import assert from 'node:assert/strict';
import {
  BIRD_EXPRESSIONS,
  INTERACTION_REACTIONS,
  classifyBirdInteraction,
  createBirdExpressionController,
  createBirdGestureTracker,
} from '../src/birdPetInteractions.js';

assert.equal(Object.keys(BIRD_EXPRESSIONS).length, 10, 'the first expression pack must contain ten states');
for (const id of ['happy', 'love', 'shy', 'curious', 'surprised', 'startled', 'angry', 'sad', 'sleepy', 'proud']) {
  assert.ok(BIRD_EXPRESSIONS[id], `missing expression ${id}`);
}
for (const eventId of ['pet-head', 'pet-chest', 'tap-beak', 'touch-wing', 'tease', 'toy-near', 'toy-hit', 'body-lift', 'idle-sleep']) {
  assert.ok(INTERACTION_REACTIONS[eventId], `missing reaction ${eventId}`);
}

const controller = createBirdExpressionController({ idleAfter: 2, cooldown: 0.6 });
assert.equal(controller.trigger('pet-head', 0).state, 'love');
assert.equal(controller.trigger('body-lift', 0.2).state, 'startled', 'high-priority lift must interrupt petting');
assert.equal(controller.update(2).state, 'neutral', 'expressions must recover to neutral');
controller.markActivity(2.1);
assert.equal(controller.update(3.9).state, 'neutral');
assert.equal(controller.update(4.2).state, 'sleepy', 'idle timeout must trigger sleepy state');
assert.equal(controller.trigger('tap-beak', 4.3).state, 'surprised', 'input must wake a sleepy bird immediately');

const held = createBirdExpressionController({ idleAfter: 20, cooldown: 0.1 });
let heldSample = held.trigger('pet-head', 0, 1, {
  duration: 0.5,
  expressionPatch: { headTilt: -0.11, eyeY: 0.46 },
  symbolDuration: 0.2,
});
assert.equal(heldSample.expression.headTilt, -0.11, 'continuous petting must follow the stroke direction');
assert.equal(heldSample.expression.eyeY, 0.46, 'continuous head petting must soften the eyes');
assert.equal(held.update(0.1).symbol, 'heart', 'continuous petting may show one initial symbol');
assert.equal(held.update(0.3).symbol, '', 'continuous petting must not keep symbols on screen');
assert.equal(held.update(0.6).state, 'neutral', 'continuous petting must recover shortly after movement stops');

const anchors = {
  head: { x: 0, y: 1.1, z: 0, r: 0.3 },
  chest: { x: 0, y: 0.72, z: 0.16, r: 0.28 },
  leftWing: { x: -0.3, y: 0.75, z: 0, r: 0.22 },
  rightWing: { x: 0.3, y: 0.75, z: 0, r: 0.22 },
  body: { x: 0, y: 0.46, z: 0, r: 0.38 },
};
assert.equal(classifyBirdInteraction({ objectName: 'upperBeak', point: { x: 0, y: 1, z: 0 }, anchors }), 'beak');
assert.equal(classifyBirdInteraction({ objectName: 'leftWingFeatherPrimary', point: { x: -0.3, y: 0.75, z: 0 }, anchors }), 'wing');
assert.equal(classifyBirdInteraction({ objectName: 'fur', point: { x: 0, y: 1.12, z: 0 }, anchors }), 'head');
assert.equal(classifyBirdInteraction({ objectName: 'fur', point: { x: 0, y: 0.72, z: 0.16 }, anchors }), 'chest');
assert.equal(classifyBirdInteraction({ objectName: 'fur', point: { x: 0, y: 0.4, z: 0 }, anchors }), 'body');

const gestures = createBirdGestureTracker();
gestures.begin({ zone: 'head', x: 0, y: 0, time: 0 });
assert.equal(gestures.move({ x: 18, y: 2, time: 0.32 })?.id, 'pet-head');
gestures.end({ x: 18, y: 2, time: 0.4 });

const continuous = createBirdGestureTracker({ sustainInterval: 0.15 });
continuous.begin({ zone: 'head', x: 0, y: 0, time: 0 });
const continuousStart = continuous.move({ x: 18, y: 2, time: 0.2 });
assert.equal(continuousStart?.phase, 'start');
assert.equal(continuousStart?.continuous, true);
assert.equal(continuous.move({ x: 18, y: 2, time: 0.4 }), null, 'holding still must not refresh petting');
const continuousSustain = continuous.move({ x: 4, y: 3, time: 0.42 });
assert.equal(continuousSustain?.phase, 'sustain');
assert.equal(continuousSustain?.id, 'pet-head');
for (let index = 0; index < 5; index++) {
  const event = continuous.move({
    x: index % 2 ? 18 : 4,
    y: 3,
    time: 0.62 + index * 0.2,
  });
  assert.notEqual(event?.id, 'tease', 'one long petting gesture must never escalate to teasing');
}
assert.equal(continuous.end({ x: 18, y: 3, time: 1.8 })?.phase, 'end');

gestures.begin({ zone: 'beak', x: 10, y: 10, time: 1 });
assert.equal(gestures.end({ x: 11, y: 10, time: 1.12 })?.id, 'tap-beak');

let lastEvent = null;
for (let i = 0; i < 3; i++) {
  const time = 2 + i * 0.2;
  gestures.begin({ zone: 'head', x: 4, y: 4, time });
  lastEvent = gestures.end({ x: 5, y: 4, time: time + 0.08 });
}
assert.equal(lastEvent?.id, 'tease', 'three rapid interactions must escalate to teasing');

console.log({
  status: 'ok',
  expressions: Object.keys(BIRD_EXPRESSIONS).length,
  reactions: Object.keys(INTERACTION_REACTIONS).length,
});
