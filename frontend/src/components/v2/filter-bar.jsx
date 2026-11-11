import { X } from 'lucide-react';

function Chip({ active, onClick, code, label, color }) {
  return (
    <button type="button" className="v2-chip" data-active={active} onClick={onClick}>
      <span className="v2-chip__code" style={color && !active ? { background: color } : undefined}>
        {code}
      </span>
      {label}
    </button>
  );
}

export function FilterBar({
  categories = [],
  regions = [],
  activeCategory,
  activeRegion,
  onCategoryChange,
  onRegionChange,
  count,
  labels = {},
}) {
  return (
    <div className="border-b border-[var(--v2-line)] bg-[var(--v2-paper)] px-4 py-3 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="v2-kicker mt-2 hidden w-[72px] shrink-0 sm:block">{labels.category || 'KATEGORI'}</span>
        <div className="v2-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            className="v2-chip"
            data-active={!activeCategory}
            onClick={() => onCategoryChange(null)}
          >
            SEMUA
          </button>
          {categories.map((category) => (
            <Chip
              key={category.key}
              code={category.key}
              label={category.label}
              color={category.color}
              active={activeCategory === category.key}
              onClick={() => onCategoryChange(activeCategory === category.key ? null : category.key)}
            />
          ))}
        </div>
        <span className="v2-mono mt-2 hidden shrink-0 text-[9px] text-[var(--v2-muted)] xl:block">
          {count} TAMPIL
        </span>
      </div>

      <div className="mt-2 flex items-start gap-3">
        <span className="v2-kicker mt-2 hidden w-[72px] shrink-0 sm:block">{labels.region || 'WILAYAH'}</span>
        <div className="v2-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            className="v2-chip"
            data-active={!activeRegion}
            onClick={() => onRegionChange(null)}
          >
            SEMUA
          </button>
          {regions.map((region) => (
            <button
              key={region.code}
              type="button"
              className="v2-chip"
              data-active={activeRegion === region.code}
              onClick={() => onRegionChange(activeRegion === region.code ? null : region.code)}
              title={region.label}
            >
              <span className="v2-chip__code">{region.code}</span>
              {region.label.replace('Surabaya ', '')}
            </button>
          ))}
        </div>
        {activeCategory || activeRegion ? (
          <button
            type="button"
            className="v2-mono mt-1.5 flex shrink-0 items-center gap-1 border border-[var(--v2-line)] px-2 py-1 text-[9px] hover:bg-[#e8e5dc]"
            onClick={() => {
              onCategoryChange(null);
              onRegionChange(null);
            }}
          >
            <X className="h-3 w-3" /> RESET
          </button>
        ) : null}
      </div>
    </div>
  );
}
