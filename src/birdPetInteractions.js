export const BIRD_EXPRESSIONS = Object.freeze({
  happy: { eyeX: 1.04, eyeY: 0.82, headTilt: 0.07, headPitch: -0.03, wingLift: 0.08, bodyBob: 0.018, fluff: 0.10, symbol: 'sparkle' },
  love: { eyeX: 1.03, eyeY: 0.58, headTilt: 0.13, headPitch: 0.02, wingLift: 0.14, bodyBob: 0.012, fluff: 0.14, symbol: 'heart' },
  shy: { eyeX: 0.98, eyeY: 0.68, headTilt: -0.10, headPitch: 0.05, wingLift: -0.05, bodyBob: -0.008, fluff: 0.12, symbol: 'blush' },
  curious: { eyeX: 1.12, eyeY: 1.08, headTilt: 0.20, headPitch: -0.02, wingLift: 0.02, bodyBob: 0.006, fluff: 0.04, symbol: 'question' },
  surprised: { eyeX: 1.18, eyeY: 1.22, headTilt: -0.03, headPitch: -0.12, wingLift: 0.13, bodyBob: 0.025, fluff: 0.18, symbol: 'exclaim' },
  startled: { eyeX: 1.24, eyeY: 1.28, headTilt: 0.04, headPitch: -0.16, wingLift: 0.32, bodyBob: 0.055, fluff: 0.42, symbol: 'sweat' },
  angry: { eyeX: 1.06, eyeY: 0.50, headTilt: -0.05, headPitch: 0.07, wingLift: -0.11, bodyBob: 0.005, fluff: 0.30, symbol: 'anger' },
  sad: { eyeX: 0.94, eyeY: 0.62, headTilt: -0.07, headPitch: 0.11, wingLift: -0.08, bodyBob: -0.012, fluff: 0.02, symbol: 'ellipsis' },
  sleepy: { eyeX: 0.96, eyeY: 0.16, headTilt: 0.04, headPitch: 0.13, wingLift: -0.06, bodyBob: -0.015, fluff: 0.08, symbol: 'sleep' },
  proud: { eyeX: 1.02, eyeY: 0.74, headTilt: 0.10, headPitch: -0.09, wingLift: 0.11, bodyBob: 0.018, fluff: 0.16, symbol: 'note' },
});

export const INTERACTION_REACTIONS = Object.freeze({
  'pet-head': { state: 'love', duration: 1.4, priority: 2 },
  'pet-chest': { state: 'shy', duration: 1.5, priority: 2 },
  'pet-body': { state: 'proud', duration: 1.3, priority: 1 },
  'tap-beak': { state: 'surprised', duration: 1.1, priority: 3 },
  'touch-wing': { state: 'sad', duration: 1.2, priority: 2 },
  tease: { state: 'angry', duration: 1.8, priority: 4 },
  'toy-near': { state: 'curious', duration: 1.4, priority: 2 },
  'toy-hit': { state: 'happy', duration: 1.5, priority: 3 },
  'body-lift': { state: 'startled', duration: 1.7, priority: 5 },
  'idle-sleep': { state: 'sleepy', duration: Infinity, priority: 0 },
});

const neutralSample = () => ({ state: 'neutral', intensity: 0, symbol: '', expression: null });

export function createBirdExpressionController({ idleAfter = 18, cooldown = 0.6 } = {}) {
  let active = null;
  let activeUntil = 0;
  let cooldownUntil = 0;
  let lastActivity = 0;
  let sleeping = false;

  const sample = (time) => {
    if (!active) return neutralSample();
    const remaining = activeUntil - time;
    const fade = Number.isFinite(activeUntil) && remaining < 0.18
      ? Math.max(0, remaining / 0.18)
      : 1;
    const expression = BIRD_EXPRESSIONS[active.state];
    return {
      state: active.state,
      intensity: active.intensity * fade,
      symbol: expression.symbol,
      expression,
      eventId: active.eventId,
    };
  };

  const markActivity = (time) => {
    lastActivity = time;
    if (sleeping) {
      sleeping = false;
      active = null;
      activeUntil = 0;
    }
  };

  const trigger = (eventId, time, intensity = 1) => {
    const reaction = INTERACTION_REACTIONS[eventId];
    if (!reaction) return sample(time);
    if (eventId !== 'idle-sleep') markActivity(time);
    if (
      active
      && time < activeUntil
      && reaction.priority < active.priority
      && eventId !== active.eventId
    ) return sample(time);
    if (time < cooldownUntil && reaction.priority < 3) return sample(time);

    active = {
      eventId,
      state: reaction.state,
      priority: reaction.priority,
      intensity: Math.max(0.25, Math.min(1.35, intensity)),
    };
    activeUntil = Number.isFinite(reaction.duration) ? time + reaction.duration : Infinity;
    sleeping = eventId === 'idle-sleep';
    return sample(time);
  };

  const update = (time) => {
    if (active && Number.isFinite(activeUntil) && time >= activeUntil) {
      active = null;
      cooldownUntil = time + cooldown;
    }
    if (!active && time - lastActivity >= idleAfter) {
      return trigger('idle-sleep', time);
    }
    return sample(time);
  };

  const reset = (time = 0) => {
    active = null;
    activeUntil = 0;
    cooldownUntil = 0;
    lastActivity = time;
    sleeping = false;
    return neutralSample();
  };

  return { trigger, update, markActivity, reset, get state() { return active?.state ?? 'neutral'; } };
}

function distanceSquared(point, anchor) {
  return (point.x - anchor.x) ** 2 + (point.y - anchor.y) ** 2 + (point.z - anchor.z) ** 2;
}

export function classifyBirdInteraction({ objectName = '', point, anchors }) {
  if (!point || !anchors) return null;
  const name = objectName.toLowerCase();
  if (/(beak|cere|nostril)/.test(name)) return 'beak';
  if (/wing/.test(name)) return 'wing';
  if (anchors.head && distanceSquared(point, anchors.head) <= anchors.head.r ** 2) return 'head';
  if (anchors.leftWing && distanceSquared(point, anchors.leftWing) <= anchors.leftWing.r ** 2) return 'wing';
  if (anchors.rightWing && distanceSquared(point, anchors.rightWing) <= anchors.rightWing.r ** 2) return 'wing';
  if (anchors.chest && distanceSquared(point, anchors.chest) <= anchors.chest.r ** 2) return 'chest';
  if (anchors.body && distanceSquared(point, anchors.body) <= anchors.body.r ** 2) return 'body';
  return null;
}

const ZONE_EVENTS = {
  head: 'pet-head',
  chest: 'pet-chest',
  body: 'pet-body',
  beak: 'tap-beak',
  wing: 'touch-wing',
};

export function createBirdGestureTracker({ strokeDistance = 12, strokeTime = 0.12, teaseWindow = 0.9 } = {}) {
  let active = null;
  let recent = [];

  const escalate = (event, time) => {
    recent = recent.filter((entry) => time - entry.time <= teaseWindow);
    recent.push({ id: event.id, time });
    if (recent.length >= 3 && event.id !== 'body-lift') {
      recent = [];
      return { id: 'tease', intensity: 1 };
    }
    return event;
  };

  const begin = ({ zone, x, y, time }) => {
    active = { zone, startX: x, startY: y, lastX: x, lastY: y, startTime: time, distance: 0, emitted: false };
  };

  const move = ({ x, y, time }) => {
    if (!active) return null;
    active.distance += Math.hypot(x - active.lastX, y - active.lastY);
    active.lastX = x;
    active.lastY = y;
    if (active.emitted || active.distance < strokeDistance || time - active.startTime < strokeTime) return null;
    active.emitted = true;
    const id = ZONE_EVENTS[active.zone] ?? 'pet-body';
    return escalate({ id, intensity: Math.min(1.25, 0.78 + active.distance / 65) }, time);
  };

  const end = ({ x, y, time }) => {
    if (!active) return null;
    active.distance += Math.hypot(x - active.lastX, y - active.lastY);
    const gesture = active;
    active = null;
    if (gesture.emitted) return null;
    const id = ZONE_EVENTS[gesture.zone] ?? 'pet-body';
    return escalate({ id, intensity: 0.86 }, time);
  };

  const cancel = () => { active = null; };
  return { begin, move, end, cancel, get activeZone() { return active?.zone ?? null; } };
}
