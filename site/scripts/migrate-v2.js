#!/usr/bin/env node
/**
 * Migrasi data direktori v1 -> v2.
 *
 * Menambahkan kategori ringkas (6), wilayah (5), kode studio, dan field
 * editorial kosong yang nanti bisa diisi lewat admin. Aman dijalankan
 * berulang: field yang sudah ada tidak ditimpa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = path.join(ROOT, 'site', 'data', 'directory.json');

export const CATEGORIES = [
  {
    key: 'BR',
    label: 'Branding',
    color: '#D9E36B',
    description: 'Identitas visual, strategi merek, dan sistem desain.',
  },
  {
    key: 'ED',
    label: 'Editorial',
    color: '#8BCB9E',
    description: 'Buku, majalah, laporan, dan desain terbitan.',
  },
  {
    key: 'MO',
    label: 'Motion & Animation',
    color: '#F2D24B',
    description: 'Animasi, motion graphics, video, dan media bergerak.',
  },
  {
    key: 'AD',
    label: 'Advertising',
    color: '#F2A7C3',
    description: 'Kampanye, biro iklan, dan komunikasi pemasaran.',
  },
  {
    key: 'IL',
    label: 'Illustration',
    color: '#F07A6A',
    description: 'Ilustrasi, gambar, seni visual, dan desain grafis.',
  },
  {
    key: 'UX',
    label: 'UI/UX',
    color: '#B8A7F0',
    description: 'Produk digital, antarmuka, dan pengalaman pengguna.',
  },
];

export const REGIONS = [
  { code: 'P-SUB', key: 'pusat', label: 'Surabaya Pusat', anchor: [112.75, -7.265] },
  { code: 'U-SUB', key: 'utara', label: 'Surabaya Utara', anchor: [112.755, -7.215] },
  { code: 'T-SUB', key: 'timur', label: 'Surabaya Timur', anchor: [112.8, -7.29] },
  { code: 'S-SUB', key: 'selatan', label: 'Surabaya Selatan', anchor: [112.735, -7.325] },
  { code: 'B-SUB', key: 'barat', label: 'Surabaya Barat', anchor: [112.69, -7.26] },
];

const KECAMATAN = {
  // Pusat
  tegalsari: 'pusat',
  genteng: 'pusat',
  bubutan: 'pusat',
  simokerto: 'pusat',
  sawahan: 'pusat',
  // Utara
  kenjeran: 'utara',
  'pabean cantian': 'utara',
  semampir: 'utara',
  bulak: 'utara',
  tambaksari: 'utara',
  // Timur
  gubeng: 'timur',
  sukolilo: 'timur',
  rungkut: 'timur',
  'tenggilis mejoyo': 'timur',
  mulyorejo: 'timur',
  'gn. anyar': 'timur',
  'gunung anyar': 'timur',
  // Selatan
  gayungan: 'selatan',
  wonokromo: 'selatan',
  wiyung: 'selatan',
  jambangan: 'selatan',
  dukuhpakis: 'selatan',
  'dukuh pakis': 'selatan',
  wonocolo: 'selatan',
  'karang pilang': 'selatan',
  // Barat
  sukomanunggal: 'barat',
  lakarsantri: 'barat',
  sambikerep: 'barat',
  benowo: 'barat',
  tandes: 'barat',
  asemrowo: 'barat',
  pakal: 'barat',
};

const CATEGORY_BY_GROUP = {
  agency: 'BR',
  branding: 'BR',
  visual: 'IL',
  digital: 'UX',
  advertising: 'AD',
  media: 'MO',
  product: 'IL',
  art: 'IL',
  other: 'BR',
};

const CATEGORY_BY_RAW = [
  [/situs|web|digital|ui|ux/i, 'UX'],
  [/animasi|motion|media|video/i, 'MO'],
  [/iklan|advertising|periklanan/i, 'AD'],
  [/grafis|ilustrasi|seni|galeri|model|industri/i, 'IL'],
  [/editorial|penerbit|buku|majalah/i, 'ED'],
  [/penjenamaan|branding|citra|konsultan|agensi|desain|manajemen|asosiasi|perusahaan/i, 'BR'],
];

function clean(value) {
  return String(value ?? '').trim();
}

function regionFromAddress(address) {
  const text = String(address || '').toLowerCase();
  if (!text) return null;
  let found = null;
  let foundLength = 0;
  for (const [key, region] of Object.entries(KECAMATAN)) {
    if (text.includes(key) && key.length > foundLength) {
      found = region;
      foundLength = key.length;
    }
  }
  return found;
}

function nearestRegion(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'pusat';
  let best = REGIONS[0];
  let bestDistance = Infinity;
  for (const region of REGIONS) {
    const [anchorLng, anchorLat] = region.anchor;
    const distance = (lng - anchorLng) ** 2 + (lat - anchorLat) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = region;
    }
  }
  return best.key;
}

export function categoriesFor(studio) {
  const name = clean(studio.name).toLowerCase();
  const raw = clean(studio.category).toLowerCase();
  const groupCode = CATEGORY_BY_GROUP[studio.group] || 'BR';
  const tags = [];

  if (/iklan|advertising|periklanan/.test(raw) || /advertising|iklan/.test(name)) tags.push('AD');
  else if (/animasi|media|motion|video/.test(raw) || /motion|animation|media/.test(name)) tags.push('MO');
  else if (/situs|website|web|ui\/ux|digital/.test(raw) || /website|web |digital|ui\/ux/.test(name)) tags.push('UX');
  else if (/editorial|penerbit|buku|majalah|percetakan/.test(raw)) tags.push('ED');
  else if (/grafis|ilustrasi|seni|galeri|model|industri/.test(raw) || /graphic|illustration|gallery|art/.test(name)) tags.push('IL');
  else if (/penjenamaan|branding|citra|konsultan|agensi|desain|manajemen|asosiasi|perusahaan/.test(raw) || /branding|brand|design|studio|agency/.test(name)) tags.push('BR');
  else tags.push(groupCode);

  if (groupCode !== tags[0]) tags.push(groupCode);
  return tags.slice(0, 2);
}

function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const studios = Array.isArray(data.studios) ? data.studios : [];
  const generatedDate = clean(data.generatedAt).slice(0, 10) || new Date().toISOString().slice(0, 10);

  for (const studio of studios) {
    const region = studio.regionLocked
      ? studio.region
      : regionFromAddress(studio.address) || nearestRegion(studio.latitude, studio.longitude);
    const regionInfo = REGIONS.find((item) => item.key === region) || REGIONS[0];
    studio.region = regionInfo.key;
    studio.regionCode = regionInfo.code;
    studio.regionLabel = regionInfo.label;

    if (studio.tagsVersion !== 2) {
      studio.tags = categoriesFor(studio);
      studio.tagsVersion = 2;
    }
    studio.categoryCode = studio.tags[0] || 'BR';
    studio.description =
      studio.description ||
      `${studio.name} adalah ${clean(studio.category) || 'studio desain'} yang berbasis di ${regionInfo.label}, Surabaya.`;
    studio.specializations = Array.isArray(studio.specializations) ? studio.specializations : [];
    studio.team = Array.isArray(studio.team) ? studio.team : [];
    studio.process = Array.isArray(studio.process) ? studio.process : [];
    studio.portfolio = Array.isArray(studio.portfolio) ? studio.portfolio : [];
    studio.verifiedAt = studio.verifiedAt || generatedDate;
    studio.bookPage = studio.bookPage || String(studio.no || 0).padStart(3, '0');
  }

  // Nomor urut per wilayah, diurutkan berdasarkan nama.
  for (const region of REGIONS) {
    const rows = studios
      .filter((studio) => studio.region === region.key)
      .sort((a, b) => clean(a.name).localeCompare(clean(b.name), 'id'));
    rows.forEach((studio, index) => {
      studio.regionNumber = index + 1;
      studio.code = `${region.code} ${String(index + 1).padStart(2, '0')}`;
    });
  }

  data.schemaVersion = 2;
  data.categories = CATEGORIES;
  data.regions = REGIONS.map(({ anchor, ...region }) => region);
  data.studios = studios;

  fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Migrasi v2 selesai: ${studios.length} studio, ${CATEGORIES.length} kategori, ${REGIONS.length} wilayah.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
