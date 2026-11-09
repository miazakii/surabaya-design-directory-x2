import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, REGIONS, categoriesFor } from '../site/scripts/migrate-v2.js';

test('v2 memiliki enam kategori dan lima wilayah', () => {
  assert.equal(CATEGORIES.length, 6);
  assert.equal(REGIONS.length, 5);
  assert.deepEqual(CATEGORIES.map((category) => category.key), ['BR', 'ED', 'MO', 'AD', 'IL', 'UX']);
  assert.deepEqual(REGIONS.map((region) => region.code), ['P-SUB', 'U-SUB', 'T-SUB', 'S-SUB', 'B-SUB']);
});

test('kategori v2 diturunkan dari nama dan kategori mentah', () => {
  assert.deepEqual(categoriesFor({ name: 'Studio Web Surabaya', category: 'Perancang Situs Web', group: 'digital' }), ['UX']);
  assert.deepEqual(categoriesFor({ name: '77 Advertising Workshop', category: 'Biro Iklan', group: 'advertising' }), ['AD']);
  assert.deepEqual(categoriesFor({ name: 'Studio Animasi', category: 'Studio animasi', group: 'media' }), ['MO']);
  assert.deepEqual(categoriesFor({ name: 'GRADIN digital agency', category: 'Perancang Grafis', group: 'visual' }), ['UX', 'IL']);
});

test('kategori v2 selalu punya fallback dari grup', () => {
  const tags = categoriesFor({ name: 'Studio Tanpa Kategori', category: '', group: 'other' });
  assert.ok(tags.length >= 1);
  assert.ok(CATEGORIES.some((category) => category.key === tags[0]));
});
