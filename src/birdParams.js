export const BIRD_PARAMETER_LIMITS = Object.freeze({
  headSize: [0.65, 1.65],
  chubbiness: [0.6, 2.2],
  legLength: [0.45, 1.8],
  earSize: [0.55, 1.8],
  tailLength: [0.45, 2.4],
  tailCurl: [-0.6, 1.2],
  eyeSize: [0.7, 1.5],
  irisScale: [0.25, 1.15],
  furFluff: [0.15, 2.4],
});

export const DEFAULT_BIRD_SEED = 521075;

export const DEFAULT_BIRD_PARAMS = Object.freeze({
  seed: DEFAULT_BIRD_SEED,
  pose: 'standing',
  coatId: 'snow',
  eyeColor: '#171716',
  oddEyes: false,
  eyeColorRight: '#304d68',
  headSize: 1.08,
  chubbiness: 1.38,
  legLength: 0.82,
  earSize: 1.02,
  eyeSize: 1.08,
  irisScale: 0.72,
  wateryEyes: false,
  wateryEyeShape: 0.4,
  tailLength: 1.05,
  tailCurl: 0.05,
  fluffy: true,
  furFluff: 1.18,
});

export function clampBirdParams(source = {}) {
  const result = { ...DEFAULT_BIRD_PARAMS, ...source };
  for (const [key, [min, max]] of Object.entries(BIRD_PARAMETER_LIMITS)) {
    const value = Number(result[key]);
    result[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : DEFAULT_BIRD_PARAMS[key];
  }
  result.seed = Number.isFinite(Number(result.seed)) ? Math.trunc(Number(result.seed)) : DEFAULT_BIRD_SEED;
  return result;
}

