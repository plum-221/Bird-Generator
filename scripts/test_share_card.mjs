import assert from 'node:assert/strict';
import {
  getShareCardDescriptor,
  getShareCardFilename,
  SHARE_CARD_REPOSITORY,
} from '../src/shareCard.js';

const first = getShareCardDescriptor(0);
const repeat = getShareCardDescriptor(0);
const nextTheme = getShareCardDescriptor(1);
const normalized = getShareCardDescriptor(-1);

assert.equal(first.serial, '0052');
assert.equal(first.theme.name, 'peach');
assert.deepEqual(first, repeat, 'the same seed should produce the same card');
assert.equal(nextTheme.theme.name, 'sky');
assert.equal(nextTheme.serial, '0125');
assert.deepEqual(normalized, nextTheme, 'negative seeds should normalize consistently');

const birdPalette = {
  base: '#f6dfbd',
  primary: '#e6913f',
  secondary: '#ad5d22',
  accent: '#d99a2b',
};
const birdSignature = getShareCardDescriptor(42, birdPalette);
const alternate = getShareCardDescriptor(42, birdPalette, 9876);
const alternateRepeat = getShareCardDescriptor(42, birdPalette, 9876);

assert.equal(birdSignature.theme.name, 'bird-signature');
assert.equal(birdSignature.theme.pattern, 'bird-feathers');
assert.equal(birdSignature.theme.primary, birdPalette.primary);
assert.ok(['R', 'SR', 'AR'].includes(birdSignature.rarity));
assert.match(alternate.theme.name, /^bird-remix-/);
assert.notDeepEqual(alternate.theme, birdSignature.theme, 'alternate skin should visibly remix the bird palette');
assert.deepEqual(alternate, alternateRepeat, 'the same skin variant should be reproducible');
assert.equal(SHARE_CARD_REPOSITORY.label, 'github.com/plum-221/Bird-Generator');
assert.equal(SHARE_CARD_REPOSITORY.url, 'https://github.com/plum-221/Bird-Generator');
assert.equal(getShareCardFilename(42), 'bird_card_42.png');
assert.equal(getShareCardFilename(-42), 'bird_card_42.png');

console.log('share card descriptor checks passed');
