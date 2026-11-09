import { safeUrl } from './directory';

export const FALLBACK_CATEGORY = { key: 'BR', label: 'Branding', color: '#D9E36B' };
export const FALLBACK_REGION = { code: 'P-SUB', key: 'pusat', label: 'Surabaya Pusat' };

export function categoryMap(categories) {
  return new Map((categories || []).map((category) => [category.key, category]));
}

export function regionMap(regions) {
  return new Map((regions || []).map((region) => [region.code, region]));
}

export function studioTags(studio) {
  if (Array.isArray(studio?.tags) && studio.tags.length) return studio.tags;
  if (studio?.categoryCode) return [studio.categoryCode];
  return ['BR'];
}

export function categoryInfo(map, studio) {
  return map.get(studioTags(studio)[0]) || FALLBACK_CATEGORY;
}

export function categoryInfos(map, studio) {
  return studioTags(studio).map((key) => map.get(key) || FALLBACK_CATEGORY);
}

export function regionInfo(map, studio) {
  return map.get(studio?.regionCode) || FALLBACK_REGION;
}

export function studioCode(studio) {
  return studio?.code || `${studio?.regionCode || 'P-SUB'} ${String(studio?.regionNumber || studio?.no || 1).padStart(2, '0')}`;
}

export function studioHref(studio) {
  return `studio.html?id=${encodeURIComponent(studio?.id || '')}`;
}

export function categoryHref(code) {
  return `jelajahi.html?category=${encodeURIComponent(code)}`;
}

export function regionHref(code) {
  return `jelajahi.html?region=${encodeURIComponent(code)}`;
}

export function formatVerified(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function sortStudios(studios) {
  return [...studios].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id'));
}

export function filterStudios({ studios, query = '', category = null, region = null }) {
  const needle = query.trim().toLowerCase();
  return studios.filter((studio) => {
    if (category && !studioTags(studio).includes(category)) return false;
    if (region && studio.regionCode !== region) return false;
    if (!needle) return true;
    const haystack = [
      studio.name,
      studio.category,
      studio.regionLabel,
      studio.regionCode,
      studio.code,
      studio.address,
      studio.sourceKeyword,
      ...studioTags(studio),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function studioLinks(studio) {
  const email = Array.isArray(studio?.emails) ? studio.emails[0] : '';
  return [
    { label: 'WEBSITE', href: safeUrl(studio?.website), external: true },
    { label: 'INSTAGRAM', href: safeUrl(studio?.instagram), external: true },
    { label: 'GOOGLE MAPS', href: safeUrl(studio?.mapsUrl), external: true },
    { label: 'EMAIL', href: email ? `mailto:${email}` : '', external: false },
  ].filter((link) => link.href);
}

export function relativePinPosition(studio, bounds = { west: 112.58, east: 112.92, south: -7.39, north: -7.13 }) {
  const lng = Number(studio?.longitude);
  const lat = Number(studio?.latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return { x: 50, y: 50 };
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(94, Math.max(6, y)) };
}

export function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
