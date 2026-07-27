import * as THREE from 'three';

export const BIRD_MOTION_ACTIONS = [
  { id: 'idle', name: '轻轻呼吸', duration: 2, loop: true, family: 'idle' },
  { id: 'idle-alert', name: '警觉歪头', duration: 2, loop: true, family: 'idle' },
  { id: 'walk', name: '小步走', duration: 0.8, loop: true, family: 'locomotion' },
  { id: 'run', name: '快速蹦跳', duration: 0.55, loop: true, family: 'locomotion' },
  { id: 'sneak', name: '悄悄靠近', duration: 1.2, loop: true, family: 'locomotion' },
  { id: 'jump', name: '跳起来', duration: 1.1, loop: false, family: 'airborne' },
  { id: 'fall', name: '轻盈落下', duration: 0.7, loop: false, family: 'airborne' },
  { id: 'sit', name: '蓬松团坐', duration: 1, loop: false, family: 'transition' },
  { id: 'rest-pose', name: '安心休息', duration: 1.8, loop: true, family: 'idle' },
  { id: 'bark', name: '啾啾叫', duration: 1.1, loop: true, family: 'expression' },
  { id: 'bite', name: '轻轻啄', duration: 0.7, loop: true, family: 'expression' },
  { id: 'fetch', name: '展翅扑接', duration: 1.2, loop: true, family: 'expression' },
  { id: 'howl', name: '仰头高歌', duration: 1.8, loop: true, family: 'expression' },
  { id: 'death', name: '侧躺撒娇', duration: 1.4, loop: false, family: 'collapse' },
];

const ACTION_BY_ID = new Map(BIRD_MOTION_ACTIONS.map((action) => [action.id, action]));

export function getBirdRigCompatibility(_pose = 'standing', actionId = 'idle') {
  const action = ACTION_BY_ID.get(actionId) ?? ACTION_BY_ID.get('idle');
  return { grade: 'full', scale: 1, label: '程序化鸟类骨骼', actionFamily: action.family };
}

function phaseFor(action, time, speed) {
  const progress = Math.max(0, time * Math.max(0.1, speed)) / action.duration;
  return action.loop ? progress % 1 : Math.min(1, progress);
}

export function createBirdMotionRig(bird) {
  const parts = bird.userData.birdParts;
  if (!parts) throw new Error('Bird motion rig requires birdParts metadata');
  const animatedParts = Object.values(parts).filter((part) => part?.position);
  const bases = new Map(animatedParts.map((part) => [part, {
    position: part.position.clone(), rotation: part.rotation.clone(), scale: part.scale.clone(),
  }]));
  let state = null;
  const reset = () => {
    bird.userData.resetBirdParts?.();
    for (const [part, base] of bases) {
      part.position.copy(base.position); part.rotation.copy(base.rotation); part.scale.copy(base.scale);
    }
    bird.userData.animationRootLift = 0;
    state = null;
  };
  const update = (time, { actionId = 'idle', speed = 1, intensity = 1, travelDirection = 1 } = {}) => {
    reset();
    const action = ACTION_BY_ID.get(actionId) ?? ACTION_BY_ID.get('idle');
    const phase = phaseFor(action, time, speed);
    const wave = Math.sin(phase * Math.PI * 2);
    const beat = Math.sin(phase * Math.PI);
    const amount = THREE.MathUtils.clamp(intensity, 0, 1.6);
    const { head, body, chest, leftWing, rightWing, tail, feet } = parts;
    let lift = 0;
    if (actionId === 'idle') {
      body.scale.y *= 1 + wave * 0.012 * amount;
      head.rotation.y = wave * 0.06 * amount;
    } else if (actionId === 'idle-alert') {
      head.rotation.z = wave * 0.22 * amount;
      head.rotation.y = Math.sin(phase * Math.PI) * 0.18;
    } else if (['walk', 'run', 'sneak'].includes(actionId)) {
      const stride = actionId === 'run' ? 0.12 : actionId === 'sneak' ? 0.045 : 0.075;
      lift = Math.abs(wave) * stride * amount;
      body.rotation.z = wave * 0.04 * amount;
      feet.rotation.z = wave * 0.08 * travelDirection;
    } else if (actionId === 'jump' || actionId === 'fall') {
      lift = Math.max(0, beat) * (actionId === 'jump' ? 0.75 : 0.4) * amount;
      leftWing.rotation.z = -beat * 1.05 * amount;
      rightWing.rotation.z = beat * 1.05 * amount;
      tail.rotation.x -= beat * 0.28;
    } else if (actionId === 'sit' || actionId === 'rest-pose') {
      body.scale.y *= 0.88;
      body.scale.x *= 1.1;
      chest.scale.x *= 1.08;
      head.position.y -= 0.08;
    } else if (actionId === 'bark') {
      head.rotation.x = -0.12 + wave * 0.08;
      chest.scale.x *= 1 + Math.abs(wave) * 0.04;
    } else if (actionId === 'bite') {
      head.rotation.x = beat * 0.48;
      head.position.z += beat * 0.08;
    } else if (actionId === 'fetch') {
      leftWing.rotation.z = -Math.abs(wave) * 1.32;
      rightWing.rotation.z = Math.abs(wave) * 1.32;
      lift = Math.abs(wave) * 0.18;
    } else if (actionId === 'howl') {
      head.rotation.x = -0.55 * beat;
      leftWing.rotation.z = -0.2 * beat;
      rightWing.rotation.z = 0.2 * beat;
    } else if (actionId === 'death') {
      head.rotation.z = -beat * 0.3;
    }
    bird.userData.animationRootLift = lift;
    state = {
      actionId: action.id, phase, progress: phase, rootX: 0, rootZ: 0,
      rootPitch: 0, rootYaw: 0, rootRoll: actionId === 'death' ? beat * 0.95 : 0,
      headLift: head.position.y - bases.get(head).position.y, gaitAmplitude: lift,
      compatibility: getBirdRigCompatibility('standing', action.id),
      rigSafety: { leg: 1, tail: 1, wing: 1 }, boneLengthError: 0, buttVisible: false,
    };
    return state;
  };
  return {
    type: 'procedural-bird-rig', update, reset,
    getState: () => state,
    getCompatibility: (actionId) => getBirdRigCompatibility('standing', actionId),
    getDiagnostics: () => ({ triangles: 0, degenerate: 0, flipped: 0, maxStretch: 1, maxStretchRegion: 'none' }),
    getWeightStats: () => ({ maxInfluences: 1, bonesUsed: 11, invalidWeights: 0, maxWeightError: 0 }),
    skeleton: { bones: Array.from({ length: 11 }, (_, index) => ({ name: `birdBone${index}` })) },
  };
}
