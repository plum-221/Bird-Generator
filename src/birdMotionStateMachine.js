import { BIRD_MOTION_ACTIONS } from './birdMotionRig.js';

const durations = new Map(BIRD_MOTION_ACTIONS.map(({ id, duration }) => [id, duration]));
export const MOTION_KEY_BINDINGS = [
  { keys: 'W / ↑', action: '前进' }, { keys: 'S / ↓', action: '后退' },
  { keys: 'A D / ← →', action: '转向' }, { keys: 'Shift', action: '快速蹦跳' },
  { keys: 'Ctrl', action: '悄悄靠近' }, { keys: 'Space', action: '跳跃' },
  { keys: 'C / Z / X', action: '歪头 / 团坐 / 休息' },
  { keys: 'Q / E / F / H', action: '啾叫 / 啄 / 展翅 / 高歌' }, { keys: 'G / K', action: '落下 / 撒娇' },
];
export const MOTION_ACTION_HOTKEYS = { Space: 'jump', KeyQ: 'bark', KeyE: 'bite', KeyF: 'fetch', KeyH: 'howl', KeyG: 'fall', KeyK: 'death' };
export const MOTION_POSTURE_HOTKEYS = { KeyC: 'idle-alert', KeyZ: 'sit', KeyX: 'rest-pose' };
const movement = new Set(['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight']);
export const isMotionControlCode = (code) => movement.has(code) || code in MOTION_ACTION_HOTKEYS || code in MOTION_POSTURE_HOTKEYS;

export function createBirdMotionStateMachine() {
  const keys = new Set();
  const position = { x: 0, z: 0 };
  let heading = 0, baseState = 'idle', transientAction = null, transientRemaining = 0, action = 'idle';
  const reset = ({ keepHeading = false } = {}) => {
    keys.clear(); position.x = 0; position.z = 0; if (!keepHeading) heading = 0;
    baseState = 'idle'; transientAction = null; transientRemaining = 0; action = 'idle';
  };
  const trigger = (next) => {
    if (!durations.has(next)) return false;
    transientAction = next; transientRemaining = durations.get(next) + 0.12; return true;
  };
  const triggerCode = (code) => {
    if (code in MOTION_ACTION_HOTKEYS) return trigger(MOTION_ACTION_HOTKEYS[code]);
    if (code in MOTION_POSTURE_HOTKEYS) {
      const next = MOTION_POSTURE_HOTKEYS[code]; baseState = baseState === next ? 'idle' : next;
      transientAction = null; transientRemaining = 0; return true;
    }
    return false;
  };
  const update = (dt, { speedScale = 1 } = {}) => {
    const safeDt = Math.min(0.1, Math.max(0, Number(dt) || 0));
    const forward = keys.has('KeyW') || keys.has('ArrowUp');
    const backward = keys.has('KeyS') || keys.has('ArrowDown');
    const left = keys.has('KeyA') || keys.has('ArrowLeft');
    const right = keys.has('KeyD') || keys.has('ArrowRight');
    const fast = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const sneak = keys.has('ControlLeft') || keys.has('ControlRight');
    const moveInput = Number(forward) - Number(backward);
    heading += (Number(left) - Number(right)) * 1.65 * safeDt;
    if (transientRemaining > 0) { transientRemaining = Math.max(0, transientRemaining - safeDt); if (!transientRemaining) transientAction = null; }
    const locomotion = moveInput || left || right ? (sneak ? 'sneak' : fast ? 'run' : 'walk') : null;
    action = transientAction ?? locomotion ?? baseState;
    if (moveInput) {
      const distance = (sneak ? 0.28 : fast ? 1.05 : 0.56) * speedScale * safeDt * Math.sign(moveInput);
      position.x += Math.sin(heading) * distance; position.z += Math.cos(heading) * distance;
    }
    return { action, position: { ...position }, heading, travelDirection: moveInput < 0 ? -1 : 1, moving: !!moveInput, turning: left || right, running: fast, sneaking: sneak, transientAction, baseState, keys: [...keys] };
  };
  return { update, reset, trigger, triggerCode, setKey: (code, down) => down ? keys.add(code) : keys.delete(code), clearKeys: () => keys.clear(), getState: () => ({ action, position: { ...position }, heading, transientAction, baseState, keys: [...keys] }) };
}
