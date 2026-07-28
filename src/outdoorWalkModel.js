export const OUTDOOR_WORLD_RADIUS = 56;
export const OUTDOOR_SOFT_WALL = 4;
export const OUTDOOR_TALK_DISTANCE = 2.8;
export const OUTDOOR_TALK_EXIT_DISTANCE = 4.2;
export const OUTDOOR_PLAYER_RADIUS = 0.46;
export const OUTDOOR_JUMP_SPEED = 6.2;
export const OUTDOOR_GRAVITY = 15.5;
export const OUTDOOR_TERRAIN_SIZE = 220;
export const OUTDOOR_TERRAIN_SEGMENTS = 96;
export const OUTDOOR_GARDEN_CENTER = Object.freeze({ x: 13, z: 7 });
export const OUTDOOR_HOUSE_CENTER = Object.freeze({ x: -17, z: 9 });
export const OUTDOOR_BUILD_STAGES = Object.freeze(['empty', 'foundation', 'frame', 'walls', 'roof']);

const smoothstep = (edge0, edge1, value) => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export function outdoorTerrainHeight(x, z) {
  const base = Math.sin(x * 0.105) * 0.72
    + Math.cos(z * 0.083) * 0.55
    + Math.sin((x + z) * 0.048) * 0.68;
  const flattenAround = (center, inner, outer) => smoothstep(inner, outer, Math.hypot(x - center.x, z - center.z));
  const gardenBlend = flattenAround(OUTDOOR_GARDEN_CENTER, 3.8, 7.5);
  const houseBlend = flattenAround(OUTDOOR_HOUSE_CENTER, 4.8, 8.5);
  const gardenHeight = Math.sin(OUTDOOR_GARDEN_CENTER.x * 0.105) * 0.72
    + Math.cos(OUTDOOR_GARDEN_CENTER.z * 0.083) * 0.55
    + Math.sin((OUTDOOR_GARDEN_CENTER.x + OUTDOOR_GARDEN_CENTER.z) * 0.048) * 0.68;
  const houseHeight = Math.sin(OUTDOOR_HOUSE_CENTER.x * 0.105) * 0.72
    + Math.cos(OUTDOOR_HOUSE_CENTER.z * 0.083) * 0.55
    + Math.sin((OUTDOOR_HOUSE_CENTER.x + OUTDOOR_HOUSE_CENTER.z) * 0.048) * 0.68;
  let height = gardenHeight + (base - gardenHeight) * gardenBlend;
  height = houseHeight + (height - houseHeight) * houseBlend;
  return height;
}

export function createOutdoorTerrainHeightfield({
  size = OUTDOOR_TERRAIN_SIZE,
  segments = OUTDOOR_TERRAIN_SEGMENTS,
} = {}) {
  const safeSegments = Math.max(2, Math.floor(segments));
  const safeSize = Math.max(1, Number(size) || OUTDOOR_TERRAIN_SIZE);
  const stride = safeSegments + 1;
  const cellSize = safeSize / safeSegments;
  const origin = -safeSize * 0.5;
  const heights = new Float32Array(stride * stride);
  for (let zIndex = 0; zIndex < stride; zIndex += 1) {
    for (let xIndex = 0; xIndex < stride; xIndex += 1) {
      heights[zIndex * stride + xIndex] = outdoorTerrainHeight(
        origin + xIndex * cellSize,
        origin + zIndex * cellSize
      );
    }
  }
  return { size: safeSize, segments: safeSegments, stride, cellSize, origin, heights };
}

export function sampleOutdoorTerrainHeightfield(field, x, z) {
  if (!field?.heights || !field.stride) return outdoorTerrainHeight(x, z);
  const gridX = Math.max(0, Math.min(field.segments, (x - field.origin) / field.cellSize));
  const gridZ = Math.max(0, Math.min(field.segments, (z - field.origin) / field.cellSize));
  const x0 = Math.min(field.segments - 1, Math.floor(gridX));
  const z0 = Math.min(field.segments - 1, Math.floor(gridZ));
  const tx = gridX - x0;
  const tz = gridZ - z0;
  const row0 = z0 * field.stride;
  const row1 = (z0 + 1) * field.stride;
  const h00 = field.heights[row0 + x0];
  const h10 = field.heights[row0 + x0 + 1];
  const h01 = field.heights[row1 + x0];
  const h11 = field.heights[row1 + x0 + 1];
  const near = h00 + (h10 - h00) * tx;
  const far = h01 + (h11 - h01) * tx;
  return near + (far - near) * tz;
}

export function createOutdoorTreeLayout(count = 28, seed = 2210728) {
  let value = seed >>> 0;
  const rand = () => {
    value += 0x6d2b79f5;
    let n = value;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  const trees = [];
  while (trees.length < count) {
    const angle = rand() * Math.PI * 2;
    const radius = 18 + rand() * 34;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.hypot(x - OUTDOOR_GARDEN_CENTER.x, z - OUTDOOR_GARDEN_CENTER.z) < 7) continue;
    if (Math.hypot(x - OUTDOOR_HOUSE_CENTER.x, z - OUTDOOR_HOUSE_CENTER.z) < 8) continue;
    const scale = 0.78 + rand() * 1.05;
    trees.push({ id: `tree-${trees.length}`, x, z, y: outdoorTerrainHeight(x, z), scale, radius: 0.38 * scale, variant: trees.length % 3 });
  }
  return trees;
}

export const OUTDOOR_TREES = Object.freeze(createOutdoorTreeLayout());

function resolveCircle(position, playerRadius, collider) {
  const dx = position.x - collider.x;
  const dz = position.z - collider.z;
  const minimum = playerRadius + collider.radius;
  const distance = Math.hypot(dx, dz);
  if (distance >= minimum) return position;
  const nx = distance > 1e-6 ? dx / distance : 1;
  const nz = distance > 1e-6 ? dz / distance : 0;
  return { ...position, x: collider.x + nx * minimum, z: collider.z + nz * minimum };
}

function resolveBox(position, playerRadius, box) {
  const minX = box.x - box.halfX - playerRadius;
  const maxX = box.x + box.halfX + playerRadius;
  const minZ = box.z - box.halfZ - playerRadius;
  const maxZ = box.z + box.halfZ + playerRadius;
  if (position.x <= minX || position.x >= maxX || position.z <= minZ || position.z >= maxZ) return position;
  const distances = [
    { key: 'x', value: minX, distance: position.x - minX },
    { key: 'x', value: maxX, distance: maxX - position.x },
    { key: 'z', value: minZ, distance: position.z - minZ },
    { key: 'z', value: maxZ, distance: maxZ - position.z },
  ].sort((a, b) => a.distance - b.distance);
  return { ...position, [distances[0].key]: distances[0].value };
}

export function outdoorHouseColliders(stage = 0) {
  if (stage < 3) return [];
  const { x, z } = OUTDOOR_HOUSE_CENTER;
  return [
    { type: 'box', x: x - 2.8, z, halfX: 0.16, halfZ: 2.5 },
    { type: 'box', x: x + 2.8, z, halfX: 0.16, halfZ: 2.5 },
    { type: 'box', x, z: z - 2.5, halfX: 2.8, halfZ: 0.16 },
    { type: 'box', x: x - 1.9, z: z + 2.5, halfX: 0.9, halfZ: 0.16 },
    { type: 'box', x: x + 1.9, z: z + 2.5, halfX: 0.9, halfZ: 0.16 },
  ];
}

export function outdoorGardenColliders() {
  const { x, z } = OUTDOOR_GARDEN_CENTER;
  return [
    { type: 'box', x: x - 1.025, z: z - 1.225, halfX: 0.85, halfZ: 1.05 },
    { type: 'box', x: x + 1.025, z: z - 1.225, halfX: 0.85, halfZ: 1.05 },
    { type: 'box', x: x - 1.025, z: z + 1.225, halfX: 0.85, halfZ: 1.05 },
    { type: 'box', x: x + 1.025, z: z + 1.225, halfX: 0.85, halfZ: 1.05 },
  ];
}

export function outdoorNpcColliders(npcs = OUTDOOR_NPCS) {
  return npcs.map((npc) => ({ x: npc.x, z: npc.z, radius: 0.58 * (npc.scale ?? 0.72) }));
}

export function resolveOutdoorCollisions(position, {
  playerRadius = OUTDOOR_PLAYER_RADIUS,
  circles = OUTDOOR_TREES,
  boxes = [],
} = {}) {
  let resolved = { ...position };
  for (const collider of circles) resolved = resolveCircle(resolved, playerRadius, collider);
  for (const collider of boxes) resolved = resolveBox(resolved, playerRadius, collider);
  return resolved;
}

const npc = (id, coatId, x, z, scale, name, lines) => ({
  id, coatId, x, z, scale, name, lines,
});

export const OUTDOOR_NPCS = Object.freeze([
  npc('moss', 'classic', -9, -13, 0.78,
    { 'zh-CN': '苔苔', 'ja-JP': 'コケ', en: 'Moss' },
    {
      'zh-CN': ['风从花田绕了一圈才到这里。', '你慢慢走，路边的小花不会催你。', '我在数云朵，刚刚数到第七朵。'],
      'ja-JP': ['花畑をめぐった風が、ここまで来たよ。', 'ゆっくり歩こう。道の花は急かさないよ。', '雲を数えていたんだ。いま七つ目。'],
      en: ['The breeze reached us after circling the flowers.', 'Walk slowly. The little flowers are in no hurry.', 'I was counting clouds. That one makes seven.'],
    }),
  npc('pebble', 'blue', 11, -18, 0.72,
    { 'zh-CN': '小石', 'ja-JP': 'コイシ', en: 'Pebble' },
    {
      'zh-CN': ['溪水把每颗石头都磨得圆圆的。', '桥上听起来像一首很轻的歌。', '你听，水里藏着第二种风声。'],
      'ja-JP': ['小川が石をみんな丸くしたんだ。', '橋の上では小さな歌に聞こえるよ。', '聞いて。水の中にもう一つの風がある。'],
      en: ['The stream has rounded every stone it met.', 'From the bridge it sounds like a very soft song.', 'Listen. There is another kind of wind inside the water.'],
    }),
  npc('sunny', 'yellow', 24, -5, 0.8,
    { 'zh-CN': '晴团', 'ja-JP': 'ヒナタ', en: 'Sunny' },
    {
      'zh-CN': ['这块草地晒得刚刚好。', '黄色的花会把阳光留到傍晚。', '如果累了，就和影子一起坐一会儿。'],
      'ja-JP': ['ここの芝生は日当たりがちょうどいいよ。', '黄色い花は夕方まで光をしまっておくんだ。', '疲れたら影と一緒に座ろう。'],
      en: ['This patch of grass has exactly enough sunshine.', 'Yellow flowers keep a little light until evening.', 'If you are tired, sit with your shadow for a while.'],
    }),
  npc('mint', 'mint', 31, 15, 0.74,
    { 'zh-CN': '薄荷', 'ja-JP': 'ミント', en: 'Mint' },
    {
      'zh-CN': ['山看起来很远，其实一直在陪我们。', '站高一点，风景会自己打开。', '我喜欢看树梢一层一层变淡。'],
      'ja-JP': ['山は遠く見えるけど、ずっと一緒だよ。', '少し高く立つと、景色がひらくんだ。', '木の梢が少しずつ淡くなるのが好き。'],
      en: ['The mountains look far away, but they keep us company.', 'Stand a little higher and the view opens by itself.', 'I like watching the treetops fade layer by layer.'],
    }),
  npc('sprout', 'green', 13, 29, 0.7,
    { 'zh-CN': '芽芽', 'ja-JP': 'メメ', en: 'Sprout' },
    {
      'zh-CN': ['新叶子每天都比昨天勇敢一点。', '树荫里有一条凉凉的小路。', '我把最好看的叶子留在树上了。'],
      'ja-JP': ['新しい葉は昨日より少し勇敢だね。', '木陰には涼しい小道があるよ。', 'いちばんきれいな葉は木に残しておいた。'],
      en: ['New leaves are a little braver every day.', 'There is a cool little path beneath the trees.', 'I left the prettiest leaf where it belongs—on the tree.'],
    }),
  npc('cream', 'classic', -6, 34, 0.76,
    { 'zh-CN': '奶盖', 'ja-JP': 'ミルク', en: 'Cream' },
    {
      'zh-CN': ['长椅不会走，所以最懂得等人。', '今天适合什么都不赶。', '坐下来以后，远处的云会走得更快。'],
      'ja-JP': ['ベンチは歩かないから、待つのが上手。', '今日は何も急がなくていい日だよ。', '座ると遠くの雲が少し速く見える。'],
      en: ['A bench never walks, so it knows how to wait.', 'Today is a good day not to hurry anything.', 'When you sit down, the distant clouds seem to move faster.'],
    }),
  npc('ripple', 'blue', -24, 23, 0.73,
    { 'zh-CN': '涟涟', 'ja-JP': 'ナミ', en: 'Ripple' },
    {
      'zh-CN': ['水面把天空借来用了一会儿。', '每一道波纹都在画一个新的圆。', '别怕走慢，倒影也走得很慢。'],
      'ja-JP': ['水面が空を少し借りているね。', '波紋はいつも新しい丸を描くんだ。', 'ゆっくりで大丈夫。影もゆっくり歩くよ。'],
      en: ['The water borrowed the sky for a little while.', 'Every ripple is drawing a new circle.', 'There is no need to rush. Reflections walk slowly too.'],
    }),
  npc('pollen', 'yellow', -34, 3, 0.69,
    { 'zh-CN': '花粉', 'ja-JP': 'ポポ', en: 'Pollen' },
    {
      'zh-CN': ['花田里每种颜色都有自己的位置。', '我刚刚和一只蝴蝶打过招呼。', '风一吹，整片花田就一起点头。'],
      'ja-JP': ['花畑では色ごとに居場所があるんだ。', 'さっき蝶にあいさつしたよ。', '風が吹くと花畑みんなでうなずくよ。'],
      en: ['Every color has its own place in the meadow.', 'I just said hello to a butterfly.', 'When the wind blows, the whole flower field nods.'],
    }),
  npc('fern', 'green', -27, -25, 0.77,
    { 'zh-CN': '蕨蕨', 'ja-JP': 'シダ', en: 'Fern' },
    {
      'zh-CN': ['这边的路会绕回阳光里。', '树根知道所有回家的方向。', '你看见那块像小鸟的云了吗？'],
      'ja-JP': ['この道はまた日なたへ戻るよ。', '木の根は帰り道を全部知っている。', '鳥みたいな雲、見えた？'],
      en: ['This path loops back into the sunshine.', 'Tree roots know every way home.', 'Did you see that cloud shaped like a bird?'],
    }),
  npc('dew', 'mint', -5, -35, 0.71,
    { 'zh-CN': '露珠', 'ja-JP': 'ツユ', en: 'Dew' },
    {
      'zh-CN': ['清晨的露珠还藏在草尖下面。', '走过这里时，鞋边会沾上一点清凉。', '南边的坡很长，但风景值得慢慢看。'],
      'ja-JP': ['朝露がまだ草の先に隠れているよ。', 'ここを歩くと足元が少しひんやりする。', '南の坂は長いけど、景色はゆっくり見る価値があるよ。'],
      en: ['Morning dew is still hiding beneath the grass tips.', 'Walking here leaves a little coolness by your feet.', 'The southern slope is long, but the view rewards a slow walk.'],
    }),
]);

export function normalizeOutdoorInput(input = {}) {
  const x = Number(Boolean(input.right)) - Number(Boolean(input.left));
  const z = Number(Boolean(input.down)) - Number(Boolean(input.up));
  const length = Math.hypot(x, z);
  return length > 1 ? { x: x / length, z: z / length } : { x, z };
}

export function applyOutdoorBoundary(
  position,
  radius = OUTDOOR_WORLD_RADIUS,
  softWall = OUTDOOR_SOFT_WALL
) {
  let x = Number(position?.x) || 0;
  let z = Number(position?.z) || 0;
  const distance = Math.hypot(x, z);
  const boundaryAmount = Math.max(0, Math.min(1, (distance - (radius - softWall)) / softWall));
  if (distance > radius && distance > 0) {
    const scale = radius / distance;
    x *= scale;
    z *= scale;
  }
  return { x, z, boundaryAmount };
}

export function moveOutdoorPlayer(
  state,
  input,
  dt,
  { speed = 5.2, radius = OUTDOOR_WORLD_RADIUS, cameraHeading = 0, circles = [], boxes = [] } = {}
) {
  const local = normalizeOutdoorInput(input);
  const forwardX = Math.sin(cameraHeading);
  const forwardZ = -Math.cos(cameraHeading);
  const rightX = Math.cos(cameraHeading);
  const rightZ = Math.sin(cameraHeading);
  const direction = {
    x: rightX * local.x + forwardX * -local.z,
    z: rightZ * local.x + forwardZ * -local.z,
  };
  const moving = direction.x !== 0 || direction.z !== 0;
  const safeDt = Math.max(0, Math.min(Number(dt) || 0, 0.1));
  const candidate = applyOutdoorBoundary({
    x: (Number(state?.x) || 0) + direction.x * speed * safeDt,
    z: (Number(state?.z) || 0) + direction.z * speed * safeDt,
  }, radius);
  const collided = resolveOutdoorCollisions(candidate, { circles, boxes });
  const next = applyOutdoorBoundary(collided, radius);
  const targetHeading = moving
    ? Math.atan2(direction.x, direction.z)
    : Number(state?.heading) || 0;
  return { ...next, heading: targetHeading, moving, direction };
}

export function stepOutdoorCharacter(state, input, dt, options = {}) {
  const moved = moveOutdoorPlayer(state, input, dt, options);
  const safeDt = Math.max(0, Math.min(Number(dt) || 0, 0.1));
  const groundY = (options.groundHeight ?? outdoorTerrainHeight)(moved.x, moved.z);
  let verticalVelocity = Number(state?.verticalVelocity) || 0;
  let y = Number.isFinite(state?.y) ? state.y : groundY;
  let grounded = y <= groundY + 1e-4;
  if (options.jump && grounded) {
    verticalVelocity = OUTDOOR_JUMP_SPEED;
    grounded = false;
  }
  if (!grounded) {
    verticalVelocity -= OUTDOOR_GRAVITY * safeDt;
    y += verticalVelocity * safeDt;
  }
  if (y <= groundY) {
    y = groundY;
    verticalVelocity = 0;
    grounded = true;
  }
  return { ...moved, y, groundY, verticalVelocity, grounded };
}

export function createOutdoorFarmState(now = 0) {
  return { slots: Array.from({ length: 4 }, (_, index) => ({ index, plantedAt: null })), harvests: 0, now };
}

export function outdoorCropStage(slot, now, growSeconds = 24) {
  if (slot?.plantedAt == null) return 'empty';
  const progress = Math.max(0, (now - slot.plantedAt) / growSeconds);
  if (progress >= 1) return 'grown';
  if (progress >= 0.38) return 'sprout';
  return 'seeded';
}

export function interactOutdoorFarm(state, slotIndex, now) {
  const next = { ...state, slots: state.slots.map((slot) => ({ ...slot })), now };
  const slot = next.slots[slotIndex];
  if (!slot) return next;
  if (outdoorCropStage(slot, now) === 'grown') {
    slot.plantedAt = null;
    next.harvests += 1;
  } else if (slot.plantedAt == null) {
    slot.plantedAt = now;
  }
  return next;
}

export function advanceOutdoorBuild(state = { stage: 0 }) {
  const stage = Math.min(OUTDOOR_BUILD_STAGES.length - 1, (Number(state.stage) || 0) + 1);
  return { ...state, stage, label: OUTDOOR_BUILD_STAGES[stage], complete: stage === OUTDOOR_BUILD_STAGES.length - 1 };
}

export function findNearbyOutdoorNpc(position, npcs = OUTDOOR_NPCS, maxDistance = OUTDOOR_TALK_DISTANCE) {
  let closest = null;
  let closestDistance = maxDistance;
  for (const candidate of npcs) {
    const distance = Math.hypot(candidate.x - position.x, candidate.z - position.z);
    if (distance > closestDistance) continue;
    closest = candidate;
    closestDistance = distance;
  }
  return closest ? { ...closest, distance: closestDistance } : null;
}

export function outdoorBubbleFor(npcData, locale = 'zh-CN', index = 0) {
  if (!npcData) return { speaker: '', text: '', index: 0 };
  const language = npcData.lines[locale] ? locale : 'en';
  const lines = npcData.lines[language];
  const normalizedIndex = ((Math.floor(index) % lines.length) + lines.length) % lines.length;
  return {
    speaker: npcData.name[language] ?? npcData.name.en,
    text: lines[normalizedIndex],
    index: normalizedIndex,
  };
}

export function isOutdoorTestMuted(search = '') {
  const params = new URLSearchParams(String(search).replace(/^\?/, ''));
  return params.get('test-muted') === '1' || params.get('e2e') === '1';
}

export function shouldShowMobileOutdoorControls({ mode, coarsePointer, width }) {
  return mode === 'outdoor' && Boolean(coarsePointer) && Number(width) <= 820;
}
