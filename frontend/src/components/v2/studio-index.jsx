import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, ArrowRight } from 'lucide-react';
import { categoryInfos, categoryMap, regionMap, sortStudios, studioCode, studioHref } from '@/lib/v2';

function IndexRow({ studio, categories, regions, active, onHover, rowRef }) {
  const categoryList = categoryMap(categories);
  const regionList = regionMap(regions);
  const tags = categoryInfos(categoryList, studio);
  const region = regionList.get(studio.regionCode);
  const primary = tags[0];

  return (
    <a
      ref={rowRef}
      href={studioHref(studio)}
      className="v2-index-item grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
      data-active={active}
      onMouseEnter={() => onHover?.(studio.id)}
      onFocus={() => onHover?.(studio.id)}
    >
      <span className="h-full min-h-[38px] w-[7px] border border-[var(--v2-line)]" style={{ background: primary?.color }} />
      <span className="min-w-0">
        <span className="v2-mono block text-[8.5px] leading-tight tracking-[0.08em] text-[var(--v2-muted)]">
          {studioCode(studio)} · {region?.label?.replace('Surabaya ', '') || 'Surabaya'}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-bold leading-tight tracking-[-0.03em]">{studio.name}</span>
        <span className="mt-0.5 block truncate text-[11px] leading-tight text-[var(--v2-muted)]">
          {tags.map((tag) => tag.label).join(' · ')}
        </span>
      </span>
      <span
        className="v2-mono grid h-7 min-w-8 place-items-center border border-[var(--v2-line)] px-1.5 text-[9px] font-bold"
        style={{ background: primary?.color }}
        title={primary?.label}
      >
        {primary?.key}
      </span>
    </a>
  );
}

export function StudioIndex({
  studios = [],
  categories = [],
  regions = [],
  selectedId,
  onHover,
  title = 'INDEKS · A-Z',
  countLabel = 'studio ditampilkan',
  ctaLabel = 'Studio Anda belum ada?',
  ctaLink = 'DAFTARKAN →',
  ctaHref = 'daftar.html',
}) {
  const [ascending, setAscending] = useState(true);
  const selectedRef = useRef(null);
  const list = useMemo(() => {
    const sorted = sortStudios(studios);
    return ascending ? sorted : sorted.reverse();
  }, [studios, ascending]);

  useEffect(() => {
    if (!selectedId) return;
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--v2-paper)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--v2-line)] px-4 py-4">
        <div>
          <p className="v2-kicker">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="v2-mono text-[34px] font-bold leading-none tracking-[-0.08em]">
              {String(studios.length).padStart(2, '0')}
            </span>
            <span className="text-[12px] leading-tight text-[var(--v2-muted)]">{countLabel}</span>
          </div>
        </div>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center border border-[var(--v2-line)] hover:bg-[#e8e5dc]"
          onClick={() => setAscending((value) => !value)}
          aria-label={ascending ? 'Urutkan Z–A' : 'Urutkan A–Z'}
          title={ascending ? 'Urutkan Z–A' : 'Urutkan A–Z'}
        >
          <ArrowDownUp className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>

      <div className="v2-scroll min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-bold">Tidak ada studio.</p>
            <p className="mt-1 text-xs text-[var(--v2-muted)]">Ubah filter atau kata kunci.</p>
          </div>
        ) : (
          list.map((studio) => (
            <IndexRow
              key={studio.id}
              studio={studio}
              categories={categories}
              regions={regions}
              active={selectedId === studio.id}
              onHover={onHover}
              rowRef={selectedId === studio.id ? selectedRef : null}
            />
          ))
        )}
      </div>

      <div className="border-t border-[var(--v2-line)] px-4 py-4">
        <a href={ctaHref} className="flex items-center justify-between gap-3 text-[12px] hover:underline">
          <span>{ctaLabel}</span>
          <span className="v2-mono text-[9px] font-bold tracking-[0.08em]">{ctaLink}</span>
          <ArrowRight className="hidden h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
