#!/usr/bin/env node
/**
 * Ambil batas kecamatan Kota Surabaya dari OpenStreetMap, kelompokkan ke
 * lima wilayah (P/U/T/S/B-SUB), lalu tulis modul GeoJSON untuk peta.
 *
 * Sumber: OpenStreetMap contributors (ODbL).
 * Jalankan: node site/scripts/build-boundaries.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import osmtogeojson from 'osmtogeojson';
import polygonClipping from 'polygon-clipping';
import simplify from 'simplify-js';
import polylabel from 'polylabel';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT_FILE = path.join(ROOT, 'frontend', 'src', 'lib', 'surabaya-boundaries.js');
const CACHE_FILE = path.join(ROOT, 'data', 'osm-surabaya-boundaries.json');

const CITY_RELATION = 8225862;

export const REGION_META = [
  {
    code: 'P-SUB',
    key: 'pusat',
    label: 'Surabaya Pusat',
    color: '#E7D9B8',
    kecamatan: ['Genteng', 'Simokerto', 'Bubutan', 'Tegalsari'],
  },
  {
    code: 'U-SUB',
    key: 'utara',
    label: 'Surabaya Utara',
    color: '#CFE0DD',
    kecamatan: ['Bulak', 'Kenjeran', 'Semampir', 'Pabean Cantian', 'Krembangan'],
  },
  {
    code: 'T-SUB',
    key: 'timur',
    label: 'Surabaya Timur',
    color: '#E8CFC7',
    kecamatan: ['Gubeng', 'Gunung Anyar', 'Sukolilo', 'Tambaksari', 'Mulyorejo', 'Rungkut', 'Tenggilis Mejoyo'],
  },
  {
    code: 'S-SUB',
    key: 'selatan',
    label: 'Surabaya Selatan',
    color: '#D9D2EA',
    kecamatan: ['Wonokromo', 'Wonocolo', 'Wiyung', 'Karang Pilang', 'Jambangan', 'Gayungan', 'Dukuh Pakis', 'Sawahan'],
  },
  {
    code: 'B-SUB',
    key: 'barat',
    label: 'Surabaya Barat',
    color: '#DDE0BD',
    kecamatan: ['Benowo', 'Pakal', 'Asemrowo', 'Sukomanunggal', 'Tandes', 'Sambikerep', 'Lakarsantri'],
  },
];

const KECAMATAN_IDS = {
  Genteng: 8224396,
  Simokerto: 8224405,
  Semampir: 8224478,
  Kenjeran: 8224558,
  Bulak: 8224593,
  Krembangan: 8224636,
  Bubutan: 8224671,
  Sawahan: 8224735,
  Sukomanunggal: 8224825,
  Asemrowo: 8224843,
  Pakal: 8224860,
  Tandes: 8225068,
  Benowo: 8225081,
  Tambaksari: 8225121,
  Lakarsantri: 8225133,
  Sukolilo: 8225175,
  Mulyorejo: 8225259,
  'Dukuh Pakis': 8225347,
  Sambikerep: 8225358,
  Gubeng: 8225432,
  Rungkut: 8225437,
  Gayungan: 8225520,
  'Tenggilis Mejoyo': 8225522,
  'Gunung Anyar': 8225536,
  Wonocolo: 8225558,
  Wiyung: 8225727,
  'Karang Pilang': 8225765,
  Wonokromo: 8225796,
  Jambangan: 8225829,
  Tegalsari: 8225844,
  'Pabean Cantian': 8225858,
};

function overpassQuery() {
  const ids = [...Object.values(KECAMATAN_IDS), CITY_RELATION].join(',');
  return `[out:json][timeout:120];\n(\n  relation(id:${ids});\n);\nout geom;\n`;
}

async function loadRaw() {
  if (fs.existsSync(CACHE_FILE)) return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'surabaya-design-directory/2.0 (boundary build)',
    },
    body: new URLSearchParams({ data: overpassQuery() }),
  });
  if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
  const json = await response.json();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(json));
  return json;
}

function ringArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return Math.abs(area / 2);
}

function largestPolygon(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  return geometry.coordinates.reduce(
    (best, polygon) => (ringArea(polygon[0]) > ringArea(best[0]) ? polygon : best),
    geometry.coordinates[0],
  );
}

function simplifyRing(ring, tolerance) {
  if (ring.length < 4) return ring;
  const points = ring.map(([x, y]) => ({ x, y }));
  const simplified = simplify(points, tolerance, true).map((point) => [Number(point.x.toFixed(5)), Number(point.y.toFixed(5))]);
  if (simplified.length < 3) return ring;
  const first = simplified[0];
  const last = simplified[simplified.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) simplified.push([...first]);
  return simplified;
}

function simplifyGeometry(geometry, tolerance) {
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, tolerance)) };
  }
  return {
    type: 'MultiPolygon',
    coordinates: geometry.coordinates.map((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance))),
  };
}

async function main() {
  const raw = await loadRaw();
  const collection = osmtogeojson(raw);
  const features = collection.features.filter(
    (feature) =>
      feature.geometry &&
      ['Polygon', 'MultiPolygon'].includes(feature.geometry.type) &&
      feature.properties?.admin_level === '6',
  );

  const byName = new Map(features.map((feature) => [feature.properties.name, feature]));
  const missing = Object.keys(KECAMATAN_IDS).filter((name) => !byName.has(name));
  if (missing.length) throw new Error(`Kecamatan tidak ditemukan: ${missing.join(', ')}`);

  const kecamatanFeatures = [];
  const regionFeatures = [];

  for (const region of REGION_META) {
    const geometries = [];
    for (const name of region.kecamatan) {
      const source = byName.get(name);
      const geometry = simplifyGeometry(source.geometry, 0.00028);
      geometries.push(geometry.coordinates);
      kecamatanFeatures.push({
        type: 'Feature',
        properties: { name, regionCode: region.code, regionLabel: region.label },
        geometry,
      });
    }

    const merged = polygonClipping.union(...geometries);
    const regionGeometry = simplifyGeometry({ type: 'MultiPolygon', coordinates: merged }, 0.0004);
    const labelAt = polylabel(largestPolygon(regionGeometry), 1e-5).map((value) => Number(value.toFixed(5)));
    regionFeatures.push({
      type: 'Feature',
      properties: {
        code: region.code,
        key: region.key,
        label: region.label,
        color: region.color,
        labelLng: labelAt[0],
        labelLat: labelAt[1],
      },
      geometry: regionGeometry,
    });
  }

  const citySource = collection.features.find(
    (feature) => feature.properties?.admin_level === '5' && feature.geometry && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type),
  );
  if (!citySource) throw new Error('Batas kota Surabaya tidak ditemukan.');
  const cityGeometry = simplifyGeometry(citySource.geometry, 0.0003);

  const labels = Object.fromEntries(
    regionFeatures.map((feature) => [feature.properties.code, [feature.properties.labelLng, feature.properties.labelLat]]),
  );

  const module = `/* Dihasilkan oleh site/scripts/build-boundaries.js — jangan edit manual. */
export const BOUNDARY_ATTRIBUTION = '© OpenStreetMap contributors (ODbL)';

export const REGION_META = ${JSON.stringify(
    REGION_META.map(({ kecamatan, ...region }) => ({ ...region, kecamatan })),
    null,
    2,
  )};

export const REGION_LABELS = ${JSON.stringify(labels, null, 2)};

export const SURABAYA_CITY_GEOJSON = ${JSON.stringify(cityGeometry)};

export const SURABAYA_KECAMATAN_GEOJSON = ${JSON.stringify({
    type: 'FeatureCollection',
    features: kecamatanFeatures,
  })};

export const SURABAYA_REGION_GEOJSON = ${JSON.stringify({
    type: 'FeatureCollection',
    features: regionFeatures,
  })};
`;
  fs.writeFileSync(OUT_FILE, module);
  console.log(`Batas wilayah ditulis: ${path.relative(ROOT, OUT_FILE)} (${(module.length / 1024).toFixed(0)} KB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
