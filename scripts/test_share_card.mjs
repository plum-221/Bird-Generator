import assert from 'node:assert/strict';
import {
  getShareCardDescriptor,
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

const catPalette = {
  base: '#f6dfbd',
  primary: '#e6913f',
  secondary: '#ad5d22',
  accent: '#d99a2b',
};
const catSignature = getShareCardDescriptor(42, catPalette);
const alternate = getShareCardDescriptor(42, catPalette, 9876);
const alternateRepeat = getShareCardDescriptor(42, catPalette, 9876);

assert.equal(catSignature.theme.name, 'cat-signature');
assert.equal(catSignature.theme.pattern, 'cat-paws');
assert.equal(catSignature.theme.primary, catPalette.primary);
assert.ok(['R', 'SR', 'AR'].includes(catSignature.rarity));
assert.match(alternate.theme.name, /^cat-remix-/);
assert.notDeepEqual(alternate.theme, catSignature.theme, 'alternate skin should visibly remix the cat palette');
assert.deepEqual(alternate, alternateRepeat, 'the same skin variant should be reproducible');
assert.match(SHARE_CARD_REPOSITORY.url, /^https:\/\/github\.com\/ringhyacinth\//);

console.log('share card descriptor checks passed');
