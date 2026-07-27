import * as THREE from 'three';

export const BIRD_EXPRESSION_SYMBOLS = Object.freeze({
  sparkle: ['✦', '✧'],
  heart: ['♥', '♡'],
  blush: ['〃', '〃'],
  question: ['?'],
  exclaim: ['!'],
  sweat: ['!', '◜'],
  anger: ['#'],
  ellipsis: ['…'],
  sleep: ['Z', 'z'],
  note: ['♪', '·'],
});

const anchorWorld = new THREE.Vector3();
const anchorScreen = new THREE.Vector3();

export function createBirdExpressionOverlay({ element, hintElement, viewport, camera, getBird }) {
  let visibleState = '';

  function setGlyphs(symbol) {
    element.replaceChildren();
    for (const [index, glyph] of (BIRD_EXPRESSION_SYMBOLS[symbol] ?? []).entries()) {
      const span = document.createElement('span');
      span.className = `bird-expression-glyph glyph-${index + 1}`;
      span.textContent = glyph;
      element.appendChild(span);
    }
  }

  function hide() {
    element.classList.remove('is-visible');
    element.setAttribute('aria-hidden', 'true');
    viewport.dataset.birdExpression = 'neutral';
    visibleState = '';
  }

  function position() {
    const bird = getBird();
    const head = bird?.getObjectByName('head');
    if (!bird || !head) return false;
    head.updateWorldMatrix(true, false);
    head.getWorldPosition(anchorWorld);
    anchorWorld.y += (bird.userData.hr ?? 0.25) * 1.28;
    anchorScreen.copy(anchorWorld).project(camera);
    if (anchorScreen.z < -1 || anchorScreen.z > 1) return false;
    const x = (anchorScreen.x * 0.5 + 0.5) * viewport.clientWidth;
    const y = (-anchorScreen.y * 0.5 + 0.5) * viewport.clientHeight;
    const lateralOffset = element.dataset.symbol === 'blush' ? 0 : 66;
    element.style.left = `${THREE.MathUtils.clamp(x + lateralOffset, 52, viewport.clientWidth - 52).toFixed(1)}px`;
    element.style.top = `${THREE.MathUtils.clamp(y, 54, viewport.clientHeight - 70).toFixed(1)}px`;
    return true;
  }

  function update(sample) {
    if (!sample?.expression || sample.intensity <= 0.06 || !position()) {
      hide();
      return;
    }
    if (sample.state !== visibleState) {
      visibleState = sample.state;
      element.dataset.expression = sample.state;
      element.dataset.symbol = sample.symbol;
      setGlyphs(sample.symbol);
      element.classList.remove('is-pop');
      void element.offsetWidth;
      element.classList.add('is-pop');
    }
    element.style.setProperty('--expression-strength', Math.min(1.2, sample.intensity).toFixed(3));
    element.classList.add('is-visible');
    element.setAttribute('aria-hidden', 'false');
    viewport.dataset.birdExpression = sample.state;
    viewport.dataset.birdExpressionSymbol = sample.symbol;
  }

  function markInteraction() {
    hintElement?.classList.add('is-dismissed');
    viewport.dataset.petInteracted = 'true';
  }

  hide();
  return { update, hide, markInteraction };
}
