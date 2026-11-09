import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Copy, MapPin } from 'lucide-react';
import { V2Footer, V2Header } from '@/components/v2/site-chrome';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { useSiteData } from '@/hooks/use-site-data';
import { safeUrl } from '@/lib/directory';
import {
  categoryInfos,
  categoryMap,
  formatVerified,
  regionMap,
  relativePinPosition,
  studioCode,
  studioLinks,
} from '@/lib/v2';

const HATCH_LABELS = ['KONT', 'KONT', 'PROCESS', 'ENVIRONMENT', 'ACTIVITY', 'PEOPLE'];

function SectionHeading({ number, title, id }) {
  return (
    <div id={id} className="mb-4 flex scroll-mt-24 items-baseline gap-3 border-b border-[var(--v2-line)] pb-2">
      <span className="v2-mono text-[16px] font-bold tracking-[-0.05em]">{number}</span>
      <h2 className="v2-section-title">{title}</h2>
    </div>
  );
}

function MiniMap({ studio, categories, regions, label }) {
  const categoryList = categoryMap(categories);
  const regionList = regionMap(regions);
  const info = categoryInfos(categoryList, studio)[0];
  const region = regionList.get(studio.regionCode);
  const pin = relativePinPosition(studio);
  return (
    <div className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
      <div className="v2-hatch relative aspect-[4/3] overflow-hidden">
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path
            d="M42 218 L35 100 L140 54 L270 42 L350 120 L360 220 L280 268 L160 276 L70 258 Z"
            fill="#ece9e1"
            stroke="#151515"
            strokeWidth="1.4"
          />
          <path d="M35 100 L140 54 L140 190 L70 258" fill="none" stroke="#151515" strokeWidth="0.9" strokeDasharray="4 4" />
          <path d="M140 190 L360 220" fill="none" stroke="#151515" strokeWidth="0.9" strokeDasharray="4 4" />
          <path d="M140 190 L160 276" fill="none" stroke="#151515" strokeWidth="0.9" strokeDasharray="4 4" />
          <text x="200" y="24" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing="3" fill="#6f6a61">
            SURABAYA
          </text>
        </svg>
        <span
          className="v2-pin absolute -translate-x-1/2 -translate-y-full"
          style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, '--pin-color': info?.color || '#D9E36B' }}
        >
          {info?.key}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[var(--v2-line)] px-3 py-2">
        <span className="v2-mono text-[8px] tracking-[0.06em]">{region?.label || 'Surabaya'}</span>
        <a
          href={safeUrl(studio.mapsUrl) || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="v2-mono flex items-center gap-1 text-[8px] font-bold tracking-[0.04em] hover:underline"
        >
          {label} <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function qrCells(seed) {
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
      const finder =
        (x < 4 && y < 4) || (x > size - 5 && y < 4) || (x < 4 && y > size - 5);
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
  return cells;
}

function QrPlaceholder({ studio, label }) {
  const cells = useMemo(() => qrCells(studio.id), [studio.id]);
  return (
    <div className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-3">
      <div className="v2-qr">
        {cells.map((on, index) => (
          <span key={index} data-on={on} />
        ))}
      </div>
      <p className="mt-2 text-[9px] leading-snug text-[var(--v2-muted)]">{label}</p>
    </div>
  );
}

function Tags({ studio, categories }) {
  const categoryList = categoryMap(categories);
  const tags = categoryInfos(categoryList, studio);
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, index) => (
        <span
          key={tag.key}
          className="v2-tag"
          style={{ background: index === 0 ? tag.color : 'transparent' }}
        >
          <span className="v2-mono text-[8px] font-bold">{tag.key}</span> {tag.label}
        </span>
      ))}
    </div>
  );
}

function PortfolioGrid({ studio, copy }) {
  const tabs = copy.portfolioTabs || ['Semua'];
  const [tab, setTab] = useState('Semua');
  const items = Array.isArray(studio.portfolio) ? studio.portfolio.filter((item) => item?.src) : [];
  const placeholders = HATCH_LABELS.map((label, index) => ({ label, index }));
  const visible = tab === 'Semua' ? placeholders : placeholders.filter((item) => item.label === tab.toUpperCase());

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            className="v2-chip"
            data-active={tab === item}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <figure key={item.src} className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
            <img src={item.src} alt={item.alt || item.title || ''} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            <figcaption className="border-t border-[var(--v2-line)] px-2 py-1.5 text-[11px]">
              {item.title || item.label || 'Dokumentasi'}
            </figcaption>
          </figure>
        ))}
        {visible.map((item) => (
          <div key={item.index} className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
            <div className="v2-hatch relative aspect-[4/3]">
              <span className="v2-mono absolute bottom-2 left-2 border border-[var(--v2-line)] bg-[var(--v2-paper)] px-1.5 py-0.5 text-[8px]">
                {item.label}
              </span>
            </div>
            <p className="border-t border-[var(--v2-line)] px-2 py-1.5 text-[11px] text-[var(--v2-muted)]">
              {copy.portfolioEmpty}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudioPage() {
  const { data, content, loading, error } = useSiteData();
  const copy = content.v2?.studio || {};
  const id = new URLSearchParams(window.location.search).get('id');
  const studio = data?.studios?.find((item) => item.id === id);
  const categories = data?.categories ?? [];
  const regions = data?.regions ?? [];
  const categoryList = useMemo(() => categoryMap(categories), [categories]);
  const regionList = useMemo(() => regionMap(regions), [regions]);
  const [copied, setCopied] = useState(false);

  useDocumentMeta(
    studio
      ? {
          title: `${studio.name} · Direktori Studio Desain Surabaya`,
          description: studio.description || `Profil ${studio.name} di Direktori Studio Desain Surabaya.`,
          ogImage: content.seo?.home?.ogImage,
          canonical: `${content.site.url}/studios/${encodeURIComponent(studio.id)}.html`,
        }
      : content.v2?.seo?.studio || content.seo.home,
    content.site.url,
  );

  if (loading) {
    return (
      <div className="v2-page grid min-h-dvh place-items-center">
        <p className="v2-mono text-[10px] tracking-[0.12em] text-[var(--v2-muted)]">MEMUAT PROFIL…</p>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="v2-page flex min-h-dvh flex-col">
        <V2Header active="map" />
        <main className="mx-auto grid w-full max-w-xl flex-1 place-items-center px-5 py-20 text-center">
          <div className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-6 v2-offset-sm">
            <p className="text-xl font-bold">{copy.notFoundTitle || 'Studio tidak ditemukan.'}</p>
            <p className="mt-2 text-sm text-[var(--v2-muted)]">{copy.notFoundBody}</p>
            <a href="jelajahi.html" className="v2-btn mt-5">
              {copy.backLabel || '← KEMBALI KE PETA'}
            </a>
          </div>
        </main>
        <V2Footer content={content} />
      </div>
    );
  }

  const info = categoryInfos(categoryList, studio)[0];
  const region = regionList.get(studio.regionCode);
  const links = studioLinks(studio);
  const email = Array.isArray(studio.emails) ? studio.emails[0] : '';
  const team = Array.isArray(studio.team) ? studio.team : [];
  const process = Array.isArray(studio.process) ? studio.process : [];
  const specializations = Array.isArray(studio.specializations) ? studio.specializations : [];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="v2-page flex min-h-dvh flex-col">
      <V2Header active="map" />

      <main id="main" className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <a href="jelajahi.html" className="v2-mono text-[9px] font-bold tracking-[0.08em] hover:underline">
          {copy.backLabel || '← KEMBALI KE PETA'}
        </a>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
          <div>
            <div className="flex items-stretch gap-3">
              <div className="flex w-[92px] shrink-0 flex-col justify-between border border-[var(--v2-line)] p-2" style={{ background: info?.color }}>
                <span className="v2-mono text-[9px] font-bold">{studio.regionCode || region?.code}</span>
                <span className="v2-mono text-[30px] font-bold leading-none tracking-[-0.08em]">
                  {String(studio.regionNumber || studio.no || 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] px-3">
                <span className="v2-mono text-[9px] tracking-[0.06em]">{copy.archiveLabel || 'Arsip 2026–2027'}</span>
              </div>
            </div>
            <div className="v2-hatch relative mt-3 aspect-[16/10] border border-[var(--v2-line)]">
              <span className="v2-mono absolute bottom-2 left-2 border border-[var(--v2-line)] bg-[var(--v2-paper)] px-2 py-1 text-[8px]">
                FOTO SAMPUL · ENVIRONMENT · [GALERI STUDIO]
              </span>
            </div>
          </div>

          <div>
            <p className="v2-kicker">
              STUDIO DESAIN · {region?.label || 'SURABAYA'}
            </p>
            <h1 className="v2-display mt-3 text-[clamp(2.4rem,5.2vw,4.6rem)]">{studio.name}</h1>
            <div className="mt-4">
              <Tags studio={studio} categories={categories} />
            </div>
            <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-[var(--v2-muted)]">{studio.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="v2-btn v2-btn--paper text-[9px]"
                >
                  {link.label} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ))}
              <button type="button" className="v2-btn v2-btn--paper text-[9px]" onClick={copyLink}>
                {copied ? copy.copied || 'TAUTAN TERSALIN' : copy.copyLink || 'SALIN TAUTAN'}
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">
            <section>
              <SectionHeading id="tentang" number="01" title="Tentang" />
              <div className="v2-prose max-w-[760px] text-[14px] text-[var(--v2-muted)]">
                <p>{studio.description}</p>
                {studio.ageSummary ? <p className="text-[12px]">{studio.ageSummary}</p> : null}
              </div>
              <div className="v2-fact-table mt-5 text-[12px]">
                <div>
                  <p className="v2-kicker">{copy.factFounded || 'BERDIRI'}</p>
                  <p className="mt-1 font-bold">{studio.foundedYear || '—'}</p>
                </div>
                <div>
                  <p className="v2-kicker">{copy.factType || 'JENIS'}</p>
                  <p className="mt-1 font-bold">{studio.category || 'Studio desain'}</p>
                </div>
                <div>
                  <p className="v2-kicker">{copy.factRegion || 'WILAYAH'}</p>
                  <p className="mt-1 font-bold">{region?.label || 'Surabaya'}</p>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <SectionHeading id="tim" number="02" title="Tim" />
              {team.length ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {team.map((person, index) => (
                    <div key={`${person.name}-${index}`} className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
                      <div className="v2-hatch relative aspect-[4/3]">
                        <span className="v2-mono absolute bottom-2 left-2 border border-[var(--v2-line)] bg-[var(--v2-paper)] px-1.5 py-0.5 text-[8px]">PERSONEL</span>
                      </div>
                      <div className="border-t border-[var(--v2-line)] p-2">
                        <p className="text-[12px] font-bold">{person.name}</p>
                        <p className="text-[10px] text-[var(--v2-muted)]">{person.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
                      <div className="v2-hatch relative aspect-[4/3]">
                        <span className="v2-mono absolute bottom-2 left-2 border border-[var(--v2-line)] bg-[var(--v2-paper)] px-1.5 py-0.5 text-[8px]">PERSONEL</span>
                      </div>
                      <div className="border-t border-[var(--v2-line)] p-2">
                        <p className="text-[12px] font-bold text-[var(--v2-muted)]">[Nama]</p>
                        <p className="text-[10px] text-[var(--v2-muted)]">[Peran]</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!team.length ? <p className="mt-2 text-[10px] text-[var(--v2-muted)]">{copy.teamEmpty}</p> : null}
            </section>

            <section className="mt-10">
              <SectionHeading id="spesialisasi" number="03" title="Spesialisasi" />
              <div className="flex flex-wrap gap-1.5">
                {categoryInfos(categoryList, studio).map((tag) => (
                  <span key={tag.key} className="v2-tag" style={{ background: tag.color }}>
                    <span className="v2-mono text-[8px] font-bold">{tag.key}</span> {tag.label}
                  </span>
                ))}
                {specializations.map((item) => (
                  <span key={item} className="v2-tag v2-tag--dashed">{item}</span>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--v2-muted)]">{copy.tagsNote}</p>
            </section>

            <section className="mt-10">
              <SectionHeading id="proses" number="04" title="Pendekatan & proses" />
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {(process.length ? process : [1, 2, 3, 4]).map((item, index) => (
                  <div key={index} className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-3">
                    <p className="v2-kicker">LANGKAH {String(index + 1).padStart(2, '0')}</p>
                    <p className="mt-2 text-[12px] font-bold">{item?.title || copy.processEmpty}</p>
                    {item?.body ? <p className="mt-1 text-[11px] leading-relaxed text-[var(--v2-muted)]">{item.body}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <SectionHeading id="portofolio" number="05" title="Portofolio & dokumentasi" />
              <PortfolioGrid studio={studio} copy={copy} />
            </section>

            <section className="mt-10">
              <SectionHeading id="kontak" number="06" title="Kontak" />
              <div className="grid gap-4 border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-4 sm:grid-cols-2">
                <div>
                  <p className="v2-kicker">{copy.website || 'WEBSITE'}</p>
                  {safeUrl(studio.website) ? (
                    <a href={safeUrl(studio.website)} target="_blank" rel="noopener noreferrer" className="v2-link-underline mt-1 inline-block text-[13px]">
                      {studio.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    <p className="mt-1 text-[12px] text-[var(--v2-muted)]">—</p>
                  )}
                </div>
                <div>
                  <p className="v2-kicker">{copy.instagram || 'INSTAGRAM'}</p>
                  {safeUrl(studio.instagram) ? (
                    <a href={safeUrl(studio.instagram)} target="_blank" rel="noopener noreferrer" className="v2-link-underline mt-1 inline-block text-[13px]">
                      {studio.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}
                    </a>
                  ) : (
                    <p className="mt-1 text-[12px] text-[var(--v2-muted)]">—</p>
                  )}
                </div>
                <div>
                  <p className="v2-kicker">{copy.email || 'EMAIL'}</p>
                  {email ? (
                    <a href={`mailto:${email}`} className="v2-link-underline mt-1 inline-block text-[13px]">{email}</a>
                  ) : (
                    <p className="mt-1 text-[12px] text-[var(--v2-muted)]">—</p>
                  )}
                </div>
                <div>
                  <p className="v2-kicker">{copy.phone || 'TELEPON'}</p>
                  {studio.phone ? (
                    <a href={`tel:${studio.phone.replace(/\s+/g, '')}`} className="v2-link-underline mt-1 inline-block text-[13px]">{studio.phone}</a>
                  ) : (
                    <p className="mt-1 text-[12px] text-[var(--v2-muted)]">—</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="v2-kicker">{copy.address || 'ALAMAT'}</p>
                  <p className="mt-1 text-[13px] leading-relaxed">{studio.address || '—'}</p>
                  {safeUrl(studio.mapsUrl) ? (
                    <a href={safeUrl(studio.mapsUrl)} target="_blank" rel="noopener noreferrer" className="v2-mono mt-1 inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.04em] hover:underline">
                      <MapPin className="h-3 w-3" /> {copy.mapLabel || 'BUKA DI GOOGLE MAPS'}
                    </a>
                  ) : null}
                </div>
                {Array.isArray(studio.openingHours) && studio.openingHours.length ? (
                  <div className="sm:col-span-2">
                    <p className="v2-kicker">{copy.hours || 'JAM BUKA'}</p>
                    <div className="mt-1 grid gap-0.5 text-[11px] text-[var(--v2-muted)] sm:grid-cols-2">
                      {studio.openingHours.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-[var(--v2-muted)]">
                {copy.sourceNote}{' '}
                <a href={content.site.issueUrl} target="_blank" rel="noopener noreferrer" className="v2-link-underline">
                  {copy.correction}
                </a>
              </p>
            </section>
          </div>

          <aside className="min-w-0 self-start lg:sticky lg:top-24">
            <nav className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
              <p className="v2-kicker border-b border-[var(--v2-line)] px-3 py-2">{copy.indexTitle || 'INDEKS'}</p>
              {(copy.sections || []).map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 border-b border-[var(--v2-line-soft)] px-3 py-2 text-[11px] last:border-b-0 hover:bg-[#e8e5dc]"
                >
                  <span className="v2-mono w-5 text-[9px] text-[var(--v2-muted)]">{section.number}</span>
                  {section.label}
                </a>
              ))}
            </nav>

            <div className="mt-4">
              <MiniMap studio={studio} categories={categories} regions={regions} label={copy.mapLabel} />
            </div>

            <div className="mt-4 border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
              <div className="flex items-center justify-between border-b border-[var(--v2-line)] px-3 py-2">
                <span className="v2-kicker">{copy.codeLabel || 'Kode studio'}</span>
                <span className="v2-mono text-[10px] font-bold">{studioCode(studio)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--v2-line)] px-3 py-2">
                <span className="v2-kicker">{copy.pageLabel || 'Halaman buku'}</span>
                <span className="v2-mono text-[10px]">{studio.bookPage || '—'}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="v2-kicker">{copy.verifiedLabel || 'Terakhir diverifikasi'}</span>
                <span className="v2-mono text-[10px]">{formatVerified(studio.verifiedAt)}</span>
              </div>
            </div>

            <div className="mt-4">
              <QrPlaceholder studio={studio} label={copy.qrLabel} />
            </div>
          </aside>
        </div>
      </main>

      <V2Footer content={content} />
    </div>
  );
}
