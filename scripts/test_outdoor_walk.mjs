import assert from 'node:assert/strict';
import {
  OUTDOOR_NPCS,
  OUTDOOR_WORLD_RADIUS,
  applyOutdoorBoundary,
  findNearbyOutdoorNpc,
  isOutdoorTestMuted,
  moveOutdoorPlayer,
  normalizeOutdoorInput,
  outdoorDialogueFor,
  shouldShowMobileOutdoorControls,
} from '../src/outdoorWalkModel.js';

const diagonal = normalizeOutdoorInput({ up: true, right: true });
assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 1) < 1e-9, 'diagonal input must be normalized');
assert.ok(diagonal.x > 0 && diagonal.z < 0, 'up-right must move toward positive x and negative z');

const idle = normalizeOutdoorInput({ up: true, down: true, left: true, right: true });
assert.deepEqual(idle, { x: 0, z: 0 }, 'opposing directions must cancel');

const moved = moveOutdoorPlayer(
  { x: 0, z: 0, heading: 0 },
  { up: true, right: true },
  0.1,
  { speed: 6 }
);
assert.ok(moved.moving, 'directional input must mark the player as moving');
assert.ok(moved.x > 0.42 && moved.z < -0.42, 'movement must cover the expected normalized distance');
assert.ok(moved.heading > 2.2 && moved.heading < 2.5, 'heading must follow the travel direction');

const bounded = applyOutdoorBoundary({ x: OUTDOOR_WORLD_RADIUS + 12, z: 0 });
assert.equal(bounded.x, OUTDOOR_WORLD_RADIUS, 'outer boundary must keep the player inside the world');
assert.equal(bounded.z, 0);
assert.equal(bounded.boundaryAmount, 1, 'hard boundary contact must be exposed for camera/UI feedback');

const soft = applyOutdoorBoundary({ x: OUTDOOR_WORLD_RADIUS - 2, z: 0 });
assert.ok(soft.boundaryAmount > 0 && soft.boundaryAmount < 1, 'soft wall must begin before the hard boundary');

assert.equal(OUTDOOR_NPCS.length, 10, 'the first outdoor release must include ten birds');
assert.equal(new Set(OUTDOOR_NPCS.map((npc) => npc.id)).size, 10, 'NPC ids must be stable and unique');
assert.ok(new Set(OUTDOOR_NPCS.map((npc) => npc.coatId)).size >= 5, 'NPCs must cover all five plumage families');
for (const npc of OUTDOOR_NPCS) {
  assert.ok(npc.name['zh-CN'] && npc.name.en && npc.name['ja-JP'], `${npc.id} must have three localized names`);
  assert.ok(npc.lines['zh-CN']?.length >= 3, `${npc.id} must have at least three Chinese lines`);
  assert.ok(npc.lines.en?.length >= 3, `${npc.id} must have at least three English lines`);
  assert.ok(npc.lines['ja-JP']?.length >= 3, `${npc.id} must have at least three Japanese lines`);
}

const firstNpc = OUTDOOR_NPCS[0];
const nearNpc = findNearbyOutdoorNpc({ x: firstNpc.x + 1, z: firstNpc.z }, OUTDOOR_NPCS, 2.8);
assert.equal(nearNpc?.id, firstNpc.id, 'nearby lookup must return the closest talkable bird');
assert.equal(findNearbyOutdoorNpc({ x: 999, z: 999 }, OUTDOOR_NPCS, 2.8), null, 'far players must not receive a talk target');

assert.equal(outdoorDialogueFor(firstNpc, 'zh-CN', 0).speaker, firstNpc.name['zh-CN']);
assert.equal(outdoorDialogueFor(firstNpc, 'en', 99).text, firstNpc.lines.en[99 % firstNpc.lines.en.length]);
assert.equal(outdoorDialogueFor(firstNpc, 'fr', 1).speaker, firstNpc.name.en, 'unsupported locales must fall back to English');

assert.equal(isOutdoorTestMuted('?test-muted=1'), true);
assert.equal(isOutdoorTestMuted('?e2e=1'), true);
assert.equal(isOutdoorTestMuted('?test-muted=0'), false);

assert.equal(shouldShowMobileOutdoorControls({ mode: 'outdoor', coarsePointer: true, width: 390 }), true);
assert.equal(shouldShowMobileOutdoorControls({ mode: 'indoor', coarsePointer: true, width: 390 }), false);
assert.equal(shouldShowMobileOutdoorControls({ mode: 'outdoor', coarsePointer: false, width: 1280 }), false);

console.log('outdoor walk tests passed');
