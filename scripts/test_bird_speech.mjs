import assert from 'node:assert/strict';
import { SPEECH_BUBBLE_COPY } from '../src/speechBubbles.js';

const forbidden = {
  'zh-CN': [/猫/, /喵/, /收费一条鱼/, /拍左脸/, /吃鱼/],
  'ja-JP': [/猫/, /なでるなら魚/, /左顔/],
  en: [/\bcat\b/i, /catting/i, /one pet costs one fish/i, /left side/i],
};

for (const [locale, copy] of Object.entries(SPEECH_BUBBLE_COPY)) {
  assert.ok(Array.isArray(copy.bird) && copy.bird.length >= 10, `${locale} must define bird dialogue`);
  assert.equal(Object.keys(copy.expressions ?? {}).length, 10, `${locale} must define all expression dialogue`);
  for (const [state, lines] of Object.entries(copy.expressions)) {
    assert.ok(Array.isArray(lines) && lines.length >= 2, `${locale}.${state} needs varied dialogue`);
  }
  assert.equal(copy.cat, undefined, `${locale} must not retain cat dialogue`);
  const serialized = JSON.stringify(copy);
  for (const pattern of forbidden[locale]) {
    assert.ok(!pattern.test(serialized), `${locale} contains forbidden cat-era copy: ${pattern}`);
  }
}

console.log({ status: 'ok', locales: Object.keys(SPEECH_BUBBLE_COPY).length });
