const BASE_PLUMAGES = [
  { id: 'snow', name: '照片同款·奶油白', base: '#f7f1e5', chest: '#fff8e9', wing: '#e2dbce', featherEdge: '#f3ecdf', tail: '#c9c3b7', stripe: '#aaa39b', marking: '#b8b0a7', throatDot: '#8e8985', cheek: '#f1d9c9', cere: '#e7bdae', beak: '#e4bc42', beakShadow: '#c89532', foot: '#aa9c9c' },
  { id: 'sky', name: '天空蓝白', base: '#e5f2f2', chest: '#f2fbf8', wing: '#c8e3e8', featherEdge: '#e8f5f5', tail: '#8eb9c7', stripe: '#718e9b', marking: '#8aa2aa', throatDot: '#667b85', cheek: '#f1e5d4', cere: '#b9c9e4', beak: '#ddba55', beakShadow: '#b98f37', foot: '#a49b9e' },
  { id: 'classic', name: '黄绿虎皮', base: '#9bd25e', chest: '#b7e66e', wing: '#d9dc63', featherEdge: '#edf09c', tail: '#4f8060', stripe: '#3e4d38', marking: '#4d5c42', throatDot: '#39483c', cheek: '#f2d552', cere: '#bdcee8', beak: '#d9ad42', beakShadow: '#ae7f2f', foot: '#a49a9a' },
  { id: 'sunny', name: '纯黄小鸟', base: '#f2dc69', chest: '#fbea83', wing: '#e9cf58', featherEdge: '#f9e98a', tail: '#cfb447', stripe: '#d2b647', marking: '#d8bd50', throatDot: '#9e8940', cheek: '#f7e194', cere: '#e6c7b6', beak: '#d3a83c', beakShadow: '#ab7f2d', foot: '#aa9c99' },
  { id: 'mint', name: '薄荷青', base: '#a9ddc6', chest: '#c8edd8', wing: '#89c9af', featherEdge: '#bee8d5', tail: '#568f7b', stripe: '#50796f', marking: '#668b80', throatDot: '#486a62', cheek: '#f0e2c4', cere: '#c7c9e7', beak: '#d9b24b', beakShadow: '#ad8431', foot: '#a19b9d' },
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
