import { shouldShowMobileOutdoorControls } from './outdoorWalkModel.js';

const KEY_DIRECTIONS = new Map([
  ['KeyW', 'up'], ['ArrowUp', 'up'],
  ['KeyS', 'down'], ['ArrowDown', 'down'],
  ['KeyA', 'left'], ['ArrowLeft', 'left'],
  ['KeyD', 'right'], ['ArrowRight', 'right'],
]);

export function createOutdoorControls({
  root, actionRoot, toggleButton,
  onModeChange, onJump, onEmote, onInteract, onBuild, onToy,
}) {
  const pressed = new Set();
  const pointerDirections = new Map();
  let mode = 'indoor';

  const isEditable = (target) => target instanceof Element
    && !!target.closest('input, select, textarea, button, [contenteditable="true"]');

  function refreshMobileVisibility() {
    const forceMobile = new URLSearchParams(window.location.search).get('mobile-controls') === '1';
    const visible = shouldShowMobileOutdoorControls({
      mode,
      coarsePointer: forceMobile || matchMedia('(pointer: coarse)').matches,
      width: window.innerWidth,
    });
    root?.toggleAttribute('hidden', !visible);
    root?.setAttribute('aria-hidden', String(!visible));
    actionRoot?.toggleAttribute('hidden', !visible);
    actionRoot?.setAttribute('aria-hidden', String(!visible));
    document.getElementById('viewport')?.setAttribute('data-outdoor-mobile-controls', String(visible));
  }

  function setMode(next) {
    mode = next === 'outdoor' ? 'outdoor' : 'indoor';
    pressed.clear();
    pointerDirections.clear();
    document.getElementById('app')?.setAttribute('data-scene-mode', mode);
    document.getElementById('viewport')?.setAttribute('data-scene-mode', mode);
    toggleButton?.setAttribute('aria-pressed', String(mode === 'outdoor'));
    toggleButton?.classList.toggle('is-outdoor', mode === 'outdoor');
    const label = toggleButton?.querySelector('.outdoor-mode-toggle__label');
    if (label) label.textContent = mode === 'outdoor' ? '回到房间' : '出去散步';
    refreshMobileVisibility();
  }

  function keyDown(event) {
    if (mode !== 'outdoor' || isEditable(event.target)) return;
    const direction = KEY_DIRECTIONS.get(event.code);
    if (direction) {
      pressed.add(direction);
      event.preventDefault();
    } else if (event.repeat) {
      return;
    } else if (event.code === 'Space') {
      onJump?.();
      event.preventDefault();
    } else if (event.code === 'KeyQ') {
      onEmote?.();
      event.preventDefault();
    } else if (event.code === 'KeyF') {
      onInteract?.();
      event.preventDefault();
    } else if (event.code === 'KeyB') {
      onBuild?.();
      event.preventDefault();
    } else if (event.code === 'KeyT') {
      onToy?.();
      event.preventDefault();
    }
  }

  function keyUp(event) {
    const direction = KEY_DIRECTIONS.get(event.code);
    if (direction) pressed.delete(direction);
  }

  const directionButtons = [...(root?.querySelectorAll('[data-outdoor-direction]') ?? [])];
  for (const button of directionButtons) {
    const direction = button.dataset.outdoorDirection;
    button.addEventListener('pointerdown', (event) => {
      button.setPointerCapture?.(event.pointerId);
      pointerDirections.set(event.pointerId, direction);
      pressed.add(direction);
      button.dataset.pressed = 'true';
      event.preventDefault();
    });
    const release = (event) => {
      const released = pointerDirections.get(event.pointerId);
      pointerDirections.delete(event.pointerId);
      if (released && ![...pointerDirections.values()].includes(released)) pressed.delete(released);
      button.dataset.pressed = 'false';
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }

  toggleButton?.addEventListener('click', () => onModeChange?.(mode === 'outdoor' ? 'indoor' : 'outdoor'));
  document.getElementById('outdoor-jump-button')?.addEventListener('click', () => onJump?.());
  document.getElementById('outdoor-emote-button')?.addEventListener('click', () => onEmote?.());
  document.getElementById('outdoor-interact-button')?.addEventListener('click', () => onInteract?.());
  document.getElementById('outdoor-build-button')?.addEventListener('click', () => onBuild?.());
  document.getElementById('outdoor-toy-button')?.addEventListener('click', () => onToy?.());
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', () => pressed.clear());
  window.addEventListener('resize', refreshMobileVisibility);
  matchMedia('(pointer: coarse)').addEventListener?.('change', refreshMobileVisibility);
  setMode('indoor');

  return {
    getInput: () => Object.fromEntries([...pressed].map((key) => [key, true])),
    setMode,
    getMode: () => mode,
  };
}
