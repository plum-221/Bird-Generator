const BASE_PLUMAGES = [
  { id: 'snow', name: '照片同款·奶油白', base: '#f4efe2', chest: '#fffaf0', wing: '#e8e0cf', stripe: '#c9c1b2', cheek: '#f4ead3', cere: '#e7c6b8', beak: '#e4bd43' },
  { id: 'sky', name: '天空蓝白', base: '#dceff2', chest: '#eefafa', wing: '#c8e2e8', stripe: '#718e9b', cheek: '#f3f1e4', cere: '#b9c9e4', beak: '#ddba55' },
  { id: 'classic', name: '黄绿虎皮', base: '#8ecb54', chest: '#a9df65', wing: '#d6dc62', stripe: '#3e4d38', cheek: '#f3dc54', cere: '#bdcee8', beak: '#d9ad42' },
  { id: 'sunny', name: '纯黄小鸟', base: '#f0d85d', chest: '#fae977', wing: '#e6c94d', stripe: '#d2b647', cheek: '#f5de75', cere: '#e6c7b6', beak: '#d3a83c' },
  { id: 'mint', name: '薄荷青', base: '#9ed8bd', chest: '#bce8cf', wing: '#87c6ad', stripe: '#50796f', cheek: '#f1e9ca', cere: '#c7c9e7', beak: '#d9b24b' },
];

export const PLUMAGES = BASE_PLUMAGES.map((plumage) => ({
  ...plumage,
  soft: {
    pattern: 'patch', base: plumage.base, colorA: plumage.wing, colorB: plumage.stripe,
    count: 12, scale: 1, softness: 0, irregularity: 0.35,
    body: { density: 9, width: 0.2, irregularity: 0.35 },
    head: { density: 15, width: 0.18, irregularity: 0.28 },
  },
}));

export const EYE_COLORS = [
  { id: 'black', name: '黑豆眼', color: '#171716' },
  { id: 'brown', name: '深棕', color: '#4b3428' },
  { id: 'ruby', name: '红宝石', color: '#78332f' },
  { id: 'blue', name: '深蓝', color: '#304d68' },
  { id: 'odd', name: '异瞳', color: 'odd' },
];

export const POSES = [
  { id: 'standing', name: '乖乖站立' },
  { id: 'loaf', name: '蓬松团坐' },
  { id: 'containerCrouch', name: '窝里休息' },
  { id: 'stretch', name: '伸展翅膀' },
  { id: 'biped', name: '挺胸站立' },
  { id: 'slouchSit', name: '放松坐姿' },
  { id: 'sideFlat', name: '侧躺撒娇' },
  { id: 'banana', name: '长尾站姿' },
];
