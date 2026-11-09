import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { DirectoryMap } from '@/components/v2/directory-map';
import { FilterBar } from '@/components/v2/filter-bar';
import { V2Footer, V2Header } from '@/components/v2/site-chrome';
import { StudioIndex } from '@/components/v2/studio-index';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { useSiteData } from '@/hooks/use-site-data';
import {
  categoryInfos,
  categoryMap,
  filterStudios,
  regionMap,
  studioCode,
  studioHref,
} from '@/lib/v2';

const params = new URLSearchParams(window.location.search);

export function DirectoryPage() {
  const { data, content, error, loading } = useSiteData();
  const copy = content.v2?.map || {};
  useDocumentMeta(content.v2?.seo?.map || content.seo.map, content.site.url);

  const studios = data?.studios ?? [];
  const categories = data?.categories ?? [];
  const regions = data?.regions ?? [];
  const categoryList = useMemo(() => categoryMap(categories), [categories]);
  const regionList = useMemo(() => regionMap(regions), [regions]);

  const [query, setQuery] = useState(params.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(params.get('category') || null);
  const [activeRegion, setActiveRegion] = useState(params.get('region') || null);
  const [selectedId, setSelectedId] = useState(params.get('studio') || null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (!data) return;
    if (activeCategory && !categoryList.has(activeCategory)) setActiveCategory(null);
    if (activeRegion && !regionList.has(activeRegion)) setActiveRegion(null);
  }, [data, activeCategory, activeRegion, categoryList, regionList]);

  const filtered = useMemo(
    () => filterStudios({ studios, query, category: activeCategory, region: activeRegion }),
    [studios, query, activeCategory, activeRegion],
  );

  const selectedStudio = selectedId ? studios.find((studio) => studio.id === selectedId) : null;

  useEffect(() => {
    if (data && selectedId && !studios.some((studio) => studio.id === selectedId)) {
      setSelectedId(null);
    }
  }, [data, selectedId, studios]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set('q', query.trim());
    if (activeCategory) next.set('category', activeCategory);
    if (activeRegion) next.set('region', activeRegion);
    if (selectedId) next.set('studio', selectedId);
    const search = next.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
  }, [query, activeCategory, activeRegion, selectedId]);

  const handleCategory = useCallback((value) => {
    setActiveCategory(value);
    setSelectedId(null);
  }, []);
  const handleRegion = useCallback((value) => {
    setActiveRegion(value);
    setSelectedId(null);
  }, []);
  const handleSelect = useCallback((id) => setSelectedId(id), []);
  const handleHover = useCallback((id) => setHoveredId(id), []);

  if (loading) {
    return (
      <div className="v2-page grid min-h-dvh place-items-center">
        <p className="v2-mono text-[10px] tracking-[0.12em] text-[var(--v2-muted)]">MEMUAT DIREKTORI…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="v2-page flex min-h-dvh flex-col">
        <V2Header active="map" />
        <main className="mx-auto grid w-full max-w-xl flex-1 place-items-center px-5 py-20 text-center">
          <div className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-6 v2-offset-sm">
            <p className="text-lg font-bold">Data direktori tidak dapat dimuat.</p>
            <p className="mt-2 text-sm text-[var(--v2-muted)]">Periksa koneksi lalu muat ulang halaman.</p>
            <button type="button" className="v2-btn mt-4" onClick={() => window.location.reload()}>
              MUAT ULANG
            </button>
          </div>
        </main>
        <V2Footer content={content} />
      </div>
    );
  }

  return (
    <div className="v2-page flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <V2Header
        active="map"
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder={copy.searchPlaceholder}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <FilterBar
            categories={categories}
            regions={regions}
            activeCategory={activeCategory}
            activeRegion={activeRegion}
            onCategoryChange={handleCategory}
            onRegionChange={handleRegion}
            count={filtered.length}
            labels={{ category: copy.filterCategoryLabel, region: copy.filterRegionLabel }}
          />

          <div className="relative h-[56vh] min-h-[360px] lg:h-auto lg:min-h-0 lg:flex-1">
            <DirectoryMap
              studios={filtered}
              categories={categories}
              regions={regions}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={handleHover}
              labels={copy}
            />

            <div className={`pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] sm:left-4 sm:top-4 ${selectedStudio ? '' : 'hidden sm:block'}`}>
              <div className="pointer-events-auto border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] px-3 py-2 v2-offset-sm">
                <p className="v2-mono text-[8px] tracking-[0.1em] text-[var(--v2-muted)]">{copy.selectedLabel || 'STUDIO TERPILIH'}</p>
                {selectedStudio ? (
                  <div className="mt-1 flex items-start gap-3">
                    <div className="min-w-0">
                      <p className="v2-mono text-[8px] tracking-[0.08em]">{studioCode(selectedStudio)}</p>
                      <p className="max-w-[220px] truncate text-[13px] font-bold leading-tight">{selectedStudio.name}</p>
                      <p className="text-[10px] text-[var(--v2-muted)]">
                        {categoryInfos(categoryList, selectedStudio).map((tag) => tag.label).join(' · ')}
                      </p>
                      <a href={studioHref(selectedStudio)} className="v2-mono mt-1 inline-flex items-center gap-1 border-b border-[var(--v2-line)] text-[8px] font-bold tracking-[0.06em]">
                        {copy.openProfile || 'BUKA PROFIL →'} <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                    <button type="button" className="ml-auto p-1 hover:bg-[#e8e5dc]" onClick={() => setSelectedId(null)} aria-label="Tutup pilihan">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 max-w-[230px] text-[11px] text-[var(--v2-muted)]">
                    Klik pin di peta atau arahkan kursor ke indeks.
                  </p>
                )}
              </div>
            </div>

            <div className="absolute bottom-3 left-3 z-10 hidden max-w-[290px] border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-3 v2-offset-sm sm:block">
              <p className="v2-mono text-[9px] font-bold tracking-[0.1em]">{copy.legendTitle || 'LEGENDA'}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {categories.map((category) => (
                  <div key={category.key} className="flex items-center gap-1.5">
                    <span className="grid h-4 w-5 place-items-center border border-[var(--v2-line)] v2-mono text-[7px] font-bold" style={{ background: category.color }}>
                      {category.key}
                    </span>
                    <span className="text-[10px] leading-tight">{category.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 border-t border-[var(--v2-line-soft)] pt-2 text-[9px] leading-snug text-[var(--v2-muted)]">
                {copy.legendNote}
              </p>
            </div>
          </div>
        </div>

        <aside className="h-[70vh] min-h-0 border-t border-[var(--v2-line)] lg:h-auto lg:border-l lg:border-t-0">
          <StudioIndex
            studios={filtered}
            categories={categories}
            regions={regions}
            selectedId={selectedId || hoveredId}
            onHover={handleHover}
            title={copy.eyebrow}
            countLabel={copy.countLabel}
            ctaLabel={copy.ctaLabel}
            ctaLink={copy.ctaLink}
          />
        </aside>
      </div>
    </div>
  );
}
