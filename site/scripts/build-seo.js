import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stableId } from '../../src/data-quality.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SITE_DIR = path.join(ROOT, 'site');
const DATA_FILE = path.join(SITE_DIR, 'data', 'directory.json');
const CONTENT_FILE = path.join(SITE_DIR, 'data', 'content.json');
const OUT_DIR = path.resolve(ROOT, process.env.SEO_OUT_DIR || 'dist');
const STUDIOS_DIR = path.join(OUT_DIR, 'studios');
let SITE_URL = 'https://miazakii.github.io/surabaya-design-directory-x2';
let SITE_NAME = 'Direktori Studio Desain Surabaya';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function safeUrl(url) {
  const text = String(url ?? '').trim();
  if (!text) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(text)) return text;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(text)) return `https://${text}`;
  return '';
}

function truncate(text, max = 160) {
  const value = String(text ?? '').trim();
  return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;
}

function safeFileId(id) {
  return String(id || '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || stableId('studio');
}

function studioUrl(id) {
  return `${SITE_URL}/studios/${encodeURIComponent(safeFileId(id))}.html`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function categoryMap(categories) {
  return new Map((categories || []).map((category) => [category.key, category]));
}

function regionMap(regions) {
  return new Map((regions || []).map((region) => [region.code, region]));
}

function tagsFor(studio, categories) {
  const map = categoryMap(categories);
  const keys = Array.isArray(studio.tags) && studio.tags.length ? studio.tags : [studio.categoryCode || 'BR'];
  return keys.map((key) => map.get(key) || { key: 'BR', label: 'Branding', color: '#D9E36B' });
}

function qrMarkup(seed) {
  const text = String(seed || 'studio');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const size = 13;
  const cells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const finder = (x < 4 && y < 4) || (x > size - 5 && y < 4) || (x < 4 && y > size - 5);
      if (finder) {
        const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1;
        const inner =
          (x >= 1 && x <= 2 && y >= 1 && y <= 2) ||
          (x >= size - 3 && x <= size - 2 && y >= 1 && y <= 2) ||
          (x >= 1 && x <= 2 && y >= size - 3 && y <= size - 2);
        cells.push(edge || inner);
      } else {
        hash ^= x * 31 + y * 17 + hash;
        cells.push((hash >>> 0) % 3 === 0);
      }
    }
  }
  return cells.map((on) => `<span data-on="${on}"></span>`).join('');
}

function pinPosition(studio) {
  const bounds = { west: 112.58, east: 112.92, south: -7.39, north: -7.13 };
  const lng = Number(studio.longitude);
  const lat = Number(studio.latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return { x: 50, y: 50 };
  return {
    x: Math.min(94, Math.max(6, ((lng - bounds.west) / (bounds.east - bounds.west)) * 100)),
    y: Math.min(92, Math.max(8, ((bounds.north - lat) / (bounds.north - bounds.south)) * 100)),
  };
}

function getCssHref() {
  try {
    const html = fs.readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8');
    const match = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/i.exec(html);
    if (!match) return '../assets/directory.css';
    const href = match[1];
    if (/^https?:\/\//i.test(href)) return href;
    return `../${href.replace(/^\.\//, '')}`;
  } catch {
    return '../assets/directory.css';
  }
}

function sectionTitle(number, title, id) {
  return `<div id="${esc(id)}" style="display:flex;align-items:baseline;gap:12px;border-bottom:1px solid var(--v2-line);padding-bottom:8px;margin-bottom:16px;">
    <span class="v2-mono" style="font-size:16px;font-weight:700;">${esc(number)}</span>
    <h2 class="v2-section-title" style="margin:0;">${esc(title)}</h2>
  </div>`;
}

function studioPage(studio, directory, content) {
  const categories = directory.categories || [];
  const regions = directory.regions || [];
  const tags = tagsFor(studio, categories);
  const primary = tags[0];
  const region = regionMap(regions).get(studio.regionCode);
  const description = String(studio.description || '').trim() || `${studio.name} adalah studio desain yang berbasis di ${region?.label || 'Surabaya'}.`;
  const canonical = studioUrl(studio.id);
  const website = safeUrl(studio.website);
  const instagram = safeUrl(studio.instagram);
  const maps = safeUrl(studio.mapsUrl);
  const email = Array.isArray(studio.emails) ? studio.emails[0] : '';
  const phone = String(studio.phone || '').trim();
  const address = String(studio.address || '').trim();
  const pin = pinPosition(studio);
  const code = studio.code || `${studio.regionCode || 'P-SUB'} ${String(studio.regionNumber || 1).padStart(2, '0')}`;
  const links = [
    website ? `<a href="${esc(website)}" target="_blank" rel="noopener noreferrer">WEBSITE ↗</a>` : '',
    instagram ? `<a href="${esc(instagram)}" target="_blank" rel="noopener noreferrer">INSTAGRAM ↗</a>` : '',
    maps ? `<a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">GOOGLE MAPS ↗</a>` : '',
    email ? `<a href="mailto:${esc(email)}">EMAIL ↗</a>` : '',
  ].filter(Boolean).join('');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: studio.name,
    url: canonical,
    description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: studio.city || 'Surabaya',
      postalCode: studio.postalCode || '',
      addressCountry: 'ID',
    },
    ...(phone ? { telephone: phone } : {}),
    ...(website ? { sameAs: [website] } : {}),
    ...(studio.latitude != null && studio.longitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: Number(studio.latitude), longitude: Number(studio.longitude) } }
      : {}),
  };

  const cssHref = getCssHref();
  const nav = content.v2?.nav || [];

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(studio.name)} · ${esc(SITE_NAME)}</title>
  <meta name="description" content="${esc(truncate(description, 160))}">
  <meta name="robots" content="index,follow">
  <meta name="theme-color" content="#f1efe9">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="id_ID">
  <meta property="og:site_name" content="${esc(SITE_NAME)}">
  <meta property="og:title" content="${esc(studio.name)} · ${esc(SITE_NAME)}">
  <meta property="og:description" content="${esc(truncate(description, 160))}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(studio.name)} · ${esc(SITE_NAME)}">
  <meta name="twitter:description" content="${esc(truncate(description, 160))}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <link rel="stylesheet" href="${esc(cssHref)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
  <style>
    .sp-wrap{max-width:1180px;margin:0 auto;padding:32px 24px 48px;}
    .sp-back{font-family:ui-monospace,monospace;font-size:9px;font-weight:700;letter-spacing:.08em;text-decoration:none;color:var(--v2-ink);}
    .sp-back:hover{text-decoration:underline;}
    .sp-top{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:26px;align-items:center;margin-top:24px;}
    .sp-code-row{display:flex;align-items:stretch;gap:12px;}
    .sp-code{width:92px;flex:none;border:1px solid var(--v2-line);padding:8px;display:flex;flex-direction:column;justify-content:space-between;background:${esc(primary.color)};}
    .sp-code span{font-family:ui-monospace,monospace;font-size:9px;font-weight:700;}
    .sp-code strong{font-family:ui-monospace,monospace;font-size:30px;line-height:1;letter-spacing:-.08em;}
    .sp-archive{display:flex;align-items:center;border:1px solid var(--v2-line);background:var(--v2-paper-soft);padding:0 12px;font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.06em;}
    .sp-cover{position:relative;margin-top:12px;aspect-ratio:16/10;border:1px solid var(--v2-line);}
    .sp-cover span{position:absolute;left:8px;bottom:8px;border:1px solid var(--v2-line);background:var(--v2-paper);padding:4px 8px;font-family:ui-monospace,monospace;font-size:8px;}
    .sp-kicker{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--v2-muted);}
    .sp-title{font-size:clamp(2.4rem,5.2vw,4.6rem);font-weight:700;letter-spacing:-.055em;line-height:.94;margin:12px 0 0;}
    .sp-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px;}
    .sp-desc{max-width:560px;margin-top:16px;font-size:14px;line-height:1.65;color:var(--v2-muted);}
    .sp-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;}
    .sp-links a{display:inline-flex;border:1px solid var(--v2-line);background:var(--v2-paper-soft);padding:8px 10px;font-family:ui-monospace,monospace;font-size:9px;font-weight:700;letter-spacing:.06em;text-decoration:none;color:var(--v2-ink);}
    .sp-links a:hover{background:#e8e5dc;}
    .sp-body{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:40px;margin-top:48px;}
    .sp-section{margin-bottom:40px;}
    .sp-prose{max-width:760px;font-size:14px;line-height:1.7;color:var(--v2-muted);}
    .sp-prose p{margin:0 0 10px;}
    .sp-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--v2-line);margin-top:18px;font-size:12px;}
    .sp-facts > div{padding:10px 12px;border-right:1px solid var(--v2-line);}
    .sp-facts > div:last-child{border-right:0;}
    .sp-facts p{margin:4px 0 0;font-weight:700;}
    .sp-grid{display:grid;gap:12px;}
    .sp-grid--3{grid-template-columns:repeat(3,minmax(0,1fr));}
    .sp-card{border:1px solid var(--v2-line);background:var(--v2-paper-soft);}
    .sp-card .v2-hatch{aspect-ratio:4/3;position:relative;}
    .sp-card .v2-hatch span{position:absolute;left:8px;bottom:8px;border:1px solid var(--v2-line);background:var(--v2-paper);padding:3px 6px;font-family:ui-monospace,monospace;font-size:8px;}
    .sp-card .sp-card-body{border-top:1px solid var(--v2-line);padding:8px;font-size:12px;}
    .sp-card .sp-card-body small{display:block;color:var(--v2-muted);font-size:10px;}
    .sp-contact{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;border:1px solid var(--v2-line);background:var(--v2-paper-soft);padding:16px;}
    .sp-contact .full{grid-column:1/-1;}
    .sp-contact a{color:var(--v2-ink);text-decoration:underline;text-underline-offset:3px;font-size:13px;}
    .sp-contact p{margin:4px 0 0;font-size:13px;line-height:1.6;}
    .sp-side{position:sticky;top:24px;align-self:start;}
    .sp-index{border:1px solid var(--v2-line);background:var(--v2-paper-soft);}
    .sp-index a{display:flex;gap:12px;border-bottom:1px solid rgba(21,21,21,.18);padding:8px 12px;font-size:11px;text-decoration:none;color:var(--v2-ink);}
    .sp-index a:last-child{border-bottom:0;}
    .sp-index a:hover{background:#e8e5dc;}
    .sp-index .num{font-family:ui-monospace,monospace;font-size:9px;color:var(--v2-muted);width:20px;}
    .sp-mini{border:1px solid var(--v2-line);background:var(--v2-paper-soft);margin-top:16px;}
    .sp-mini-map{position:relative;aspect-ratio:4/3;overflow:hidden;}
    .sp-mini-map .v2-pin{position:absolute;transform:translate(-50%,-100%);}
    .sp-mini-foot{display:flex;justify-content:space-between;gap:8px;border-top:1px solid var(--v2-line);padding:8px 12px;font-family:ui-monospace,monospace;font-size:8px;}
    .sp-mini-foot a{color:var(--v2-ink);font-weight:700;text-decoration:none;}
    .sp-meta{border:1px solid var(--v2-line);background:var(--v2-paper-soft);margin-top:16px;}
    .sp-meta div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid var(--v2-line);padding:8px 12px;}
    .sp-meta div:last-child{border-bottom:0;}
    .sp-meta span{font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--v2-muted);}
    .sp-meta strong{font-family:ui-monospace,monospace;font-size:10px;font-weight:700;}
    .sp-qr{border:1px solid var(--v2-line);background:var(--v2-paper-soft);margin-top:16px;padding:12px;}
    .sp-qr .v2-qr{max-width:180px;margin:0 auto;}
    .sp-qr p{margin:8px 0 0;font-size:9px;line-height:1.5;color:var(--v2-muted);}
    .sp-note{margin-top:12px;font-size:10px;line-height:1.6;color:var(--v2-muted);}
    .sp-note a{color:var(--v2-ink);}
    .sp-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;border-top:1px solid var(--v2-line);padding:18px 0;margin-top:40px;font-family:ui-monospace,monospace;font-size:9px;color:var(--v2-muted);}
    .sp-foot a{color:var(--v2-muted);}
    @media(max-width:900px){
      .sp-top{grid-template-columns:1fr;}
      .sp-body{grid-template-columns:1fr;}
      .sp-side{position:static;}
      .sp-grid--3{grid-template-columns:repeat(2,minmax(0,1fr));}
    }
    @media(max-width:560px){
      .sp-wrap{padding:20px 16px 36px;}
      .sp-brand-sub{display:none;}
      .sp-grid--3{grid-template-columns:1fr;}
      .sp-contact{grid-template-columns:1fr;}
      .sp-facts{grid-template-columns:1fr;}
      .sp-facts > div{border-right:0;border-bottom:1px solid var(--v2-line);}
      .sp-facts > div:last-child{border-bottom:0;}
    }
  </style>
</head>
<body class="v2-page">
  <header style="border-bottom:1px solid var(--v2-line);position:sticky;top:0;z-index:20;background:var(--v2-paper);color:var(--v2-ink);">
    <div style="max-width:1440px;margin:0 auto;height:68px;display:flex;align-items:center;gap:16px;padding:0 24px;">
      <a href="../index.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--v2-ink);">
        <img src="../media/logo-arkai.png" alt="arkai" style="height:26px;width:auto;">
        <span class="v2-mono sp-brand-sub" style="font-size:9px;letter-spacing:.13em;color:var(--v2-muted);border-left:1px solid var(--v2-line-soft);padding-left:10px;">STUDIO DESAIN SURABAYA</span>
      </a>
      <nav style="margin-left:auto;display:flex;align-items:center;gap:20px;">
        ${nav.map((item) => {
          const isCta = /DAFTARKAN/i.test(item.label);
          const style = isCta
            ? 'display:inline-flex;border:1px solid var(--v2-line);background:var(--v2-ink);color:var(--v2-paper);padding:9px 12px;font-size:9px;font-weight:700;letter-spacing:.08em;text-decoration:none;'
            : 'font-size:10px;font-weight:700;letter-spacing:.1em;text-decoration:none;color:var(--v2-ink);';
          return `<a class="v2-mono" style="${style}" href="../${esc(item.href)}">${esc(item.label)}</a>`;
        }).join('')}
      </nav>
    </div>
  </header>

  <main id="main" class="sp-wrap">
    <a class="sp-back" href="../jelajahi.html?studio=${encodeURIComponent(studio.id)}">← KEMBALI KE PETA</a>

    <div class="sp-top">
      <div>
        <div class="sp-code-row">
          <div class="sp-code">
            <span>${esc(studio.regionCode || region?.code || 'P-SUB')}</span>
            <strong>${esc(String(studio.regionNumber || studio.no || 1).padStart(2, '0'))}</strong>
          </div>
          <div class="sp-archive">Arsip 2026–2027</div>
        </div>
        <div class="sp-cover v2-hatch">
          <span>FOTO SAMPUL · ENVIRONMENT · [GALERI STUDIO]</span>
        </div>
      </div>
      <div>
        <p class="sp-kicker">STUDIO DESAIN · ${esc(region?.label || 'SURABAYA')}</p>
        <h1 class="sp-title">${esc(studio.name)}</h1>
        <div class="sp-tags">
          ${tags.map((tag, index) => `<span class="v2-tag" style="background:${index === 0 ? esc(tag.color) : 'transparent'}"><span class="v2-mono" style="font-size:8px;font-weight:700;">${esc(tag.key)}</span> ${esc(tag.label)}</span>`).join('')}
        </div>
        <p class="sp-desc">${esc(description)}</p>
        <div class="sp-links">${links}</div>
      </div>
    </div>

    <div class="sp-body">
      <div>
        <section class="sp-section">
          ${sectionTitle('01', 'Tentang', 'tentang')}
          <div class="sp-prose">
            <p>${esc(description)}</p>
            ${studio.ageSummary ? `<p style="font-size:12px;">${esc(studio.ageSummary)}</p>` : ''}
          </div>
          <div class="sp-facts">
            <div><span class="v2-kicker">BERDIRI</span><p>${esc(studio.foundedYear || '—')}</p></div>
            <div><span class="v2-kicker">JENIS</span><p>${esc(studio.category || 'Studio desain')}</p></div>
            <div><span class="v2-kicker">WILAYAH</span><p>${esc(region?.label || 'Surabaya')}</p></div>
          </div>
        </section>

        <section class="sp-section">
          ${sectionTitle('02', 'Tim', 'tim')}
          <div class="sp-grid sp-grid--3">
            ${[0, 1, 2].map(() => `<div class="sp-card"><div class="v2-hatch"><span>PERSONEL</span></div><div class="sp-card-body"><strong>[Nama]</strong><small>[Peran]</small></div></div>`).join('')}
          </div>
          <p class="sp-note">Data tim belum diisi. Kirim koreksi jika Anda bagian dari studio ini.</p>
        </section>

        <section class="sp-section">
          ${sectionTitle('03', 'Spesialisasi', 'spesialisasi')}
          <div class="sp-tags">
            ${tags.map((tag) => `<span class="v2-tag" style="background:${esc(tag.color)}"><span class="v2-mono" style="font-size:8px;font-weight:700;">${esc(tag.key)}</span> ${esc(tag.label)}</span>`).join('')}
            ${(studio.specializations || []).map((item) => `<span class="v2-tag v2-tag--dashed">${esc(item)}</span>`).join('')}
          </div>
          <p class="sp-note">Kategori utama ditandai warna penuh. Tag bergaris putus-putus adalah spesialisasi bebas dari studio.</p>
        </section>

        <section class="sp-section">
          ${sectionTitle('04', 'Pendekatan & proses', 'proses')}
          <div class="sp-grid sp-grid--3">
            ${[0, 1, 2, 3].map((index) => `<div class="sp-card" style="padding:12px;"><span class="v2-kicker">LANGKAH ${String(index + 1).padStart(2, '0')}</span><p style="margin:8px 0 0;font-size:12px;font-weight:700;">Deskripsi proses belum diisi.</p></div>`).join('')}
          </div>
        </section>

        <section class="sp-section">
          ${sectionTitle('05', 'Portofolio & dokumentasi', 'portofolio')}
          <div class="sp-grid sp-grid--3">
            ${['KONT', 'KONT', 'PROCESS', 'ENVIRONMENT', 'ACTIVITY', 'PEOPLE'].map((label) => `<div class="sp-card"><div class="v2-hatch"><span>${label}</span></div><div class="sp-card-body" style="color:var(--v2-muted);">Dokumentasi belum diisi.</div></div>`).join('')}
          </div>
        </section>

        <section class="sp-section">
          ${sectionTitle('06', 'Kontak', 'kontak')}
          <div class="sp-contact">
            <div><span class="v2-kicker">WEBSITE</span>${website ? `<p><a href="${esc(website)}" target="_blank" rel="noopener noreferrer">${esc(website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></p>` : '<p>—</p>'}</div>
            <div><span class="v2-kicker">INSTAGRAM</span>${instagram ? `<p><a href="${esc(instagram)}" target="_blank" rel="noopener noreferrer">${esc(instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, ''))}</a></p>` : '<p>—</p>'}</div>
            <div><span class="v2-kicker">EMAIL</span>${email ? `<p><a href="mailto:${esc(email)}">${esc(email)}</a></p>` : '<p>—</p>'}</div>
            <div><span class="v2-kicker">TELEPON</span>${phone ? `<p><a href="tel:${esc(phone.replace(/\s+/g, ''))}">${esc(phone)}</a></p>` : '<p>—</p>'}</div>
            <div class="full"><span class="v2-kicker">ALAMAT</span><p>${esc(address || '—')}</p>${maps ? `<p><a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">BUKA DI GOOGLE MAPS ↗</a></p>` : ''}</div>
            ${Array.isArray(studio.openingHours) && studio.openingHours.length ? `<div class="full"><span class="v2-kicker">JAM BUKA</span><p style="font-size:11px;color:var(--v2-muted);">${studio.openingHours.map(esc).join('<br>')}</p></div>` : ''}
          </div>
          <p class="sp-note">Status usia adalah estimasi batas bawah aktivitas, bukan tanggal berdiri resmi. <a href="${esc(content.site?.issueUrl || '#')}" target="_blank" rel="noopener noreferrer">Ada data yang keliru? Ajukan koreksi</a>.</p>
        </section>
      </div>

      <aside class="sp-side">
        <nav class="sp-index">
          <p class="v2-kicker" style="margin:0;padding:8px 12px;border-bottom:1px solid var(--v2-line);">INDEKS</p>
          ${[
            ['01', 'Tentang', 'tentang'],
            ['02', 'Tim', 'tim'],
            ['03', 'Spesialisasi', 'spesialisasi'],
            ['04', 'Pendekatan & proses', 'proses'],
            ['05', 'Portofolio & dokumentasi', 'portofolio'],
            ['06', 'Kontak', 'kontak'],
          ].map(([number, label, id]) => `<a href="#${id}"><span class="num">${number}</span>${label}</a>`).join('')}
        </nav>

        <div class="sp-mini">
          <div class="sp-mini-map v2-hatch">
            <svg viewBox="0 0 400 300" style="position:absolute;inset:0;width:100%;height:100%;" aria-hidden="true">
              <path d="M42 218 L35 100 L140 54 L270 42 L350 120 L360 220 L280 268 L160 276 L70 258 Z" fill="#ece9e1" stroke="#151515" stroke-width="1.4"/>
              <path d="M35 100 L140 54 L140 190 L70 258" fill="none" stroke="#151515" stroke-width=".9" stroke-dasharray="4 4"/>
              <path d="M140 190 L360 220" fill="none" stroke="#151515" stroke-width=".9" stroke-dasharray="4 4"/>
              <path d="M140 190 L160 276" fill="none" stroke="#151515" stroke-width=".9" stroke-dasharray="4 4"/>
            </svg>
            <span class="v2-pin" style="left:${pin.x}%;top:${pin.y}%;--pin-color:${esc(primary.color)};">${esc(primary.key)}</span>
          </div>
          <div class="sp-mini-foot"><span>${esc(region?.label || 'Surabaya')}</span>${maps ? `<a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">BUKA DI GOOGLE MAPS ↗</a>` : ''}</div>
        </div>

        <div class="sp-meta">
          <div><span>Kode studio</span><strong>${esc(code)}</strong></div>
          <div><span>Halaman buku</span><strong>${esc(studio.bookPage || '—')}</strong></div>
          <div><span>Terakhir diverifikasi</span><strong>${formatDate(studio.verifiedAt)}</strong></div>
        </div>

        <div class="sp-qr">
          <div class="v2-qr">${qrMarkup(studio.id)}</div>
          <p>Kode QR yang sama tercetak di halaman studio pada buku direktori.</p>
        </div>
      </aside>
    </div>

    <footer class="sp-foot">
      <span>Direktori Studio Desain Surabaya · Arsip 2026–2027</span>
      <span>Data dikelola oleh [NAMA PENGELOLA DATA]</span>
    </footer>
  </main>
</body>
</html>
`;
}

function main() {
  const directory = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  let content = {};
  try {
    content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  } catch {
    // content.json opsional.
  }
  SITE_URL = (
    process.env.SITE_URL ||
    process.env.URL ||
    content.site?.url ||
    'https://miazakii.github.io/surabaya-design-directory-x2'
  ).replace(/\/$/, '');
  SITE_NAME = String(content.site?.name || 'Direktori Studio Desain Surabaya').trim();
  const studios = Array.isArray(directory.studios) ? directory.studios : [];
  const lastmod = String(directory.generatedAt || new Date().toISOString()).slice(0, 10);

  fs.rmSync(STUDIOS_DIR, { recursive: true, force: true });
  fs.mkdirSync(STUDIOS_DIR, { recursive: true });

  for (const studio of studios) {
    if (!studio.id || !studio.name) continue;
    const filePath = path.join(STUDIOS_DIR, `${safeFileId(studio.id)}.html`);
    fs.writeFileSync(filePath, studioPage(studio, directory, content), 'utf8');
  }

  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/jelajahi.html`,
    `${SITE_URL}/daftar.html`,
    `${SITE_URL}/privacy.html`,
    ...studios
      .filter((studio) => studio.id && studio.name)
      .map((studio) => studioUrl(studio.id)),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${esc(url)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /admin.html\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    'utf8',
  );

  console.log(`SEO: ${studios.length} halaman studio, sitemap, dan robots.txt -> ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
