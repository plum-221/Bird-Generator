import assert from 'node:assert/strict';
import {
  OUTDOOR_NPCS,
  OUTDOOR_WORLD_RADIUS,
  OUTDOOR_HOUSE_CENTER,
  OUTDOOR_TREES,
  advanceOutdoorBuild,
  applyOutdoorBoundary,
  createOutdoorFarmState,
  findNearbyOutdoorNpc,
  interactOutdoorFarm,
  isOutdoorTestMuted,
  moveOutdoorPlayer,
  normalizeOutdoorInput,
  outdoorCropStage,
  outdoorDialogueFor,
  outdoorHouseColliders,
  outdoorTerrainHeight,
  resolveOutdoorCollisions,
  shouldShowMobileOutdoorControls,
  stepOutdoorCharacter,
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

const cameraMoved = moveOutdoorPlayer(
  { x: 0, z: 0, heading: 0 },
  { up: true },
  0.1,
  { speed: 5, cameraHeading: Math.PI / 2 }
);
assert.ok(cameraMoved.x > 0.49 && Math.abs(cameraMoved.z) < 1e-6, 'forward movement must follow the rotated camera');

assert.notEqual(outdoorTerrainHeight(0, 0), outdoorTerrainHeight(20, 20), 'outdoor terrain must not be flat');
assert.equal(OUTDOOR_TREES.length, 54, 'tree layout must expose every physical tree');
const tree = OUTDOOR_TREES[0];
const blocked = resolveOutdoorCollisions({ x: tree.x, z: tree.z }, { circles: [tree] });
assert.ok(Math.hypot(blocked.x - tree.x, blocked.z - tree.z) >= tree.radius + 0.45, 'tree trunks must push the player outside their volume');

const walls = outdoorHouseColliders(3);
assert.equal(walls.length, 5, 'completed walls must expose collision segments and a door gap');
const doorPass = resolveOutdoorCollisions({ x: OUTDOOR_HOUSE_CENTER.x, z: OUTDOOR_HOUSE_CENTER.z + 2.5 }, { boxes: walls });
assert.equal(doorPass.x, OUTDOOR_HOUSE_CENTER.x, 'front door gap must remain passable');

let jumper = stepOutdoorCharacter({ x: 0, z: 0, y: outdoorTerrainHeight(0, 0), grounded: true }, {}, 0.05, { jump: true });
assert.ok(jumper.y > jumper.groundY && jumper.verticalVelocity > 0 && !jumper.grounded, 'jump must leave the terrain');
for (let i = 0; i < 40; i += 1) jumper = stepOutdoorCharacter(jumper, {}, 0.05);
assert.equal(jumper.grounded, true, 'gravity must land the player back on terrain');

let farm = createOutdoorFarmState(0);
farm = interactOutdoorFarm(farm, 0, 2);
assert.equal(outdoorCropStage(farm.slots[0], 2), 'seeded');
assert.equal(outdoorCropStage(farm.slots[0], 14), 'sprout');
assert.equal(outdoorCropStage(farm.slots[0], 30), 'grown');
farm = interactOutdoorFarm(farm, 0, 30);
assert.equal(farm.harvests, 1, 'grown crops must be harvestable');

let build = { stage: 0 };
for (let i = 0; i < 4; i += 1) build = advanceOutdoorBuild(build);
assert.deepEqual({ stage: build.stage, label: build.label, complete: build.complete }, { stage: 4, label: 'roof', complete: true });

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
assert.equal(outdoorDialogueFor(firstNpc, 'zh-CN', 2).isLast, true, 'dialogue must expose its final line so the UI can close');

assert.equal(isOutdoorTestMuted('?test-muted=1'), true);
assert.equal(isOutdoorTestMuted('?e2e=1'), true);
assert.equal(isOutdoorTestMuted('?test-muted=0'), false);

assert.equal(shouldShowMobileOutdoorControls({ mode: 'outdoor', coarsePointer: true, width: 390 }), true);
assert.equal(shouldShowMobileOutdoorControls({ mode: 'indoor', coarsePointer: true, width: 390 }), false);
assert.equal(shouldShowMobileOutdoorControls({ mode: 'outdoor', coarsePointer: false, width: 1280 }), false);

console.log('outdoor walk tests passed');
