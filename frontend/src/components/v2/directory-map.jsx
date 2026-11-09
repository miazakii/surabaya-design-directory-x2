import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { REGION_SHAPES } from '@/lib/surabaya-regions';
import {
  categoryInfo,
  categoryInfos,
  categoryMap,
  regionMap,
  relativePinPosition,
  studioCode,
  studioHref,
} from '@/lib/v2';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const DEFAULT_CENTER = [112.745, -7.275];
const DEFAULT_ZOOM = 11.6;
const DETAIL_ZOOM = 12.4;

const LAND_POLYGON = [
  [112.54, -7.44],
  [112.95, -7.44],
  [112.99, -7.04],
  [112.54, -7.04],
];

const CITY_OUTLINE = [
  [112.618, -7.352],
  [112.652, -7.36],
  [112.69, -7.35],
  [112.724, -7.356],
  [112.758, -7.346],
  [112.79, -7.334],
  [112.818, -7.305],
  [112.826, -7.272],
  [112.812, -7.24],
  [112.79, -7.214],
  [112.752, -7.204],
  [112.712, -7.212],
  [112.674, -7.232],
  [112.644, -7.262],
  [112.62, -7.3],
];

const PAPER_STYLE = {
  version: 8,
  name: 'Direktori Paper',
  sources: {},
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#dfe7e5' } },
  ],
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function popupHtml(studio, categoryList, regionList) {
  const tags = categoryInfos(categoryList, studio);
  const region = regionList.get(studio.regionCode);
  return `
    <div style="min-width:220px;font-family:'Host Grotesk',system-ui,sans-serif;color:#151515;">
      <div style="border-bottom:1px solid #151515;padding:7px 10px;font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.06em;display:flex;justify-content:space-between;gap:12px;">
        <span>${escapeHtml(studioCode(studio))}</span>
        <span>${escapeHtml(region?.label?.replace('Surabaya ', '') || 'Surabaya')}</span>
      </div>
      <div style="padding:10px;">
        <div style="font-size:15px;font-weight:700;line-height:1.05;letter-spacing:-.03em;">${escapeHtml(studio.name)}</div>
        <div style="margin-top:4px;font-size:10px;color:#6f6a61;">${escapeHtml(tags.map((tag) => tag.label).join(' · '))}</div>
        <a href="${studioHref(studio)}" style="display:inline-block;margin-top:9px;border:1px solid #151515;background:#151515;color:#f1efe9;padding:5px 8px;font-family:ui-monospace,monospace;font-size:9px;font-weight:700;letter-spacing:.06em;text-decoration:none;">BUKA PROFIL →</a>
      </div>
    </div>`;
}

function StaticFallback({ studios, categories, regions, hoveredId, selectedId, onSelect, onHover, message }) {
  const categoryList = categoryMap(categories);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9e6de]">
      <div className="absolute inset-0 v2-dots opacity-70" />
      <svg viewBox="0 0 1000 700" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g fill="none" stroke="#151515" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="6 6">
          <path d="M60 520 L60 190 L250 120 L520 100 L760 150 L900 330 L880 560 L650 620 L330 640 Z" />
          <path d="M250 120 L250 430 L520 470 L520 100" />
          <path d="M520 100 L520 470 L880 560" />
          <path d="M520 470 L650 620" />
          <path d="M60 520 L250 430" />
        </g>
        <text x="500" y="80" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="5" fill="#6f6a61">
          SELAT MADURA
        </text>
        <g fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="2" fill="#6f6a61">
          <text x="150" y="300">B-SUB</text>
          <text x="500" y="180">U-SUB</text>
          <text x="505" y="365">P-SUB</text>
          <text x="780" y="300">T-SUB</text>
          <text x="500" y="580">S-SUB</text>
        </g>
      </svg>
      {groupStudios(studios, 11.6).map((group) => {
        const { x, y } = relativePinPosition({ longitude: group.lng, latitude: group.lat });
        const info = categoryInfo(categoryList, group.studio);
        const isCluster = group.count > 1;
        return (
          <div
            key={group.key}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <button
              type="button"
              className={isCluster ? 'v2-pin v2-pin--cluster' : 'v2-pin'}
              style={{ '--pin-color': isCluster ? '#f6f4ee' : info.color }}
              data-active={!isCluster && (selectedId === group.studio.id || hoveredId === group.studio.id)}
              title={isCluster ? `${group.count} studio di area ini` : `${group.studio.name} · ${studioCode(group.studio)}`}
              onClick={() => !isCluster && onSelect?.(group.studio.id)}
              onMouseEnter={() => !isCluster && onHover?.(group.studio.id)}
              onMouseLeave={() => !isCluster && onHover?.(null)}
            >
              {isCluster ? group.count : info.key}
            </button>
          </div>
        );
      })}
      <div className="absolute bottom-3 left-3 z-10 w-[min(78%,300px)] border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] px-3 py-2 text-center v2-offset-sm sm:bottom-auto sm:left-1/2 sm:top-3 sm:-translate-x-1/2">
        <p className="v2-mono text-[9px] font-bold tracking-[0.08em]">PETA OFFLINE</p>
        <p className="mt-0.5 text-[9px] leading-snug text-[var(--v2-muted)]">{message}</p>
      </div>
    </div>
  );
}

function groupStudios(studios, zoom) {
  const valid = studios.filter(
    (studio) => Number.isFinite(Number(studio.latitude)) && Number.isFinite(Number(studio.longitude)),
  );
  if (zoom >= DETAIL_ZOOM) {
    return valid.map((studio) => ({
      key: studio.id,
      count: 1,
      lng: Number(studio.longitude),
      lat: Number(studio.latitude),
      studio,
      studios: [studio],
    }));
  }

  const cell = zoom < 11 ? 0.032 : zoom < 11.8 ? 0.021 : 0.012;
  const buckets = new Map();
  for (const studio of valid) {
    const lng = Number(studio.longitude);
    const lat = Number(studio.latitude);
    const key = `${Math.round(lng / cell)}:${Math.round(lat / cell)}`;
    const bucket = buckets.get(key) || { key, count: 0, lng: 0, lat: 0, studios: [] };
    bucket.count += 1;
    bucket.lng += lng;
    bucket.lat += lat;
    bucket.studios.push(studio);
    buckets.set(key, bucket);
  }

  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    lng: bucket.lng / bucket.count,
    lat: bucket.lat / bucket.count,
    studio: bucket.studios[0],
  }));
}

export function DirectoryMap({
  studios = [],
  categories = [],
  regions = [],
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  labels = {},
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const loadedRef = useRef(false);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const landRef = useRef(null);
  const cityRef = useRef(null);
  const regionRefs = useRef([]);
  const regionLabelRefs = useRef([]);
  const waterLabelRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapZoom, setMapZoom] = useState(zoom);

  const categoryList = useMemo(() => categoryMap(categories), [categories]);
  const regionList = useMemo(() => regionMap(regions), [regions]);
  const studiosRef = useRef(studios);
  const categoryRef = useRef(categoryList);
  const regionRef = useRef(regionList);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const selectedRef = useRef(selectedId);
  const hoveredRef = useRef(hoveredId);

  studiosRef.current = studios;
  categoryRef.current = categoryList;
  regionRef.current = regionList;
  onSelectRef.current = onSelect;
  onHoverRef.current = onHover;
  selectedRef.current = selectedId;
  hoveredRef.current = hoveredId;

  const updateOverlay = () => {
    const map = mapRef.current;
    if (!map) return;
    const point = ([lng, lat]) => {
      const projected = map.project([lng, lat]);
      return `${projected.x},${projected.y}`;
    };
    landRef.current?.setAttribute('points', LAND_POLYGON.map(point).join(' '));
    cityRef.current?.setAttribute('points', CITY_OUTLINE.map(point).join(' '));
    REGION_SHAPES.forEach((shape, index) => {
      regionRefs.current[index]?.setAttribute('points', shape.polygon.map(point).join(' '));
      const label = map.project(shape.labelAt);
      const text = regionLabelRefs.current[index];
      if (text) {
        text.setAttribute('x', label.x);
        text.setAttribute('y', label.y);
      }
    });
    const water = map.project([112.74, -7.205]);
    if (waterLabelRef.current) {
      waterLabelRef.current.setAttribute('x', water.x);
      waterLabelRef.current.setAttribute('y', water.y);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let cancelled = false;
    let map;

    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: PAPER_STYLE,
        center,
        zoom,
        maxZoom: 18,
        minZoom: 10,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: false,
      });
      mapRef.current = map;
      if (import.meta.env.DEV) window.__directoryMap = map;

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: 'Peta diagram Direktori · glyph OpenFreeMap',
        }),
        'bottom-right',
      );

      map.on('error', () => {
        if (loadedRef.current) return;
        setFailed(true);
      });

      map.on('load', () => {
        if (cancelled) return;
        loadedRef.current = true;
        setFailed(false);
        setReady(true);

        const points = studiosRef.current
          .filter((studio) => Number.isFinite(Number(studio.latitude)) && Number.isFinite(Number(studio.longitude)))
          .map((studio) => [Number(studio.longitude), Number(studio.latitude)]);
        if (points.length > 1) {
          const bounds = points.reduce(
            (acc, point) => acc.extend(point),
            new maplibregl.LngLatBounds(points[0], points[0]),
          );
          map.fitBounds(bounds, { padding: { top: 70, bottom: 70, left: 70, right: 70 }, duration: 0 });
        }

        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 22,
          className: 'v2-map-popup',
          maxWidth: '280px',
        });

        updateOverlay();
        map.on('move', updateOverlay);
        map.on('zoom', updateOverlay);
        map.on('resize', updateOverlay);

        setMapZoom(map.getZoom());
        map.on('zoomend', () => setMapZoom(map.getZoom()));
      });
    } catch (error) {
      console.error(error);
      setFailed(true);
    }

    return () => {
      cancelled = true;
      loadedRef.current = false;
      popupRef.current?.remove();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
    // Map dibuat sekali; data, marker, dan seleksi diperbarui lewat effect lain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return undefined;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const groups = groupStudios(studios, mapZoom);
    const markers = groups.map((group) => {
      const isCluster = group.count > 1;
      const info = categoryInfo(categoryRef.current, group.studio);
      const element = document.createElement('button');
      element.type = 'button';
      element.className = isCluster ? 'v2-pin v2-pin--cluster' : 'v2-pin';
      element.textContent = isCluster ? String(group.count) : info.key;
      element.style.setProperty('--pin-color', isCluster ? '#f6f4ee' : info.color);
      element.dataset.active = String(
        !isCluster && (selectedRef.current === group.studio.id || hoveredRef.current === group.studio.id),
      );
      if (!isCluster) {
        element.dataset.id = group.studio.id;
        element.title = `${group.studio.name} · ${studioCode(group.studio)}`;
      } else {
        element.title = `${group.count} studio di area ini`;
      }

      element.addEventListener('click', (event) => {
        event.stopPropagation();
        if (isCluster) {
          map.easeTo({ center: [group.lng, group.lat], zoom: Math.min(mapZoom + 2, 15) });
          return;
        }
        onSelectRef.current?.(group.studio.id);
        popupRef.current
          ?.setLngLat([group.lng, group.lat])
          .setHTML(popupHtml(group.studio, categoryRef.current, regionRef.current))
          .addTo(map);
      });
      element.addEventListener('mouseenter', () => {
        if (!isCluster) onHoverRef.current?.(group.studio.id);
        element.style.zIndex = '6';
      });
      element.addEventListener('mouseleave', () => {
        if (!isCluster) onHoverRef.current?.(null);
        element.style.zIndex = '';
      });

      return new maplibregl.Marker({ element, anchor: 'bottom' })
        .setLngLat([group.lng, group.lat])
        .addTo(map);
    });

    markersRef.current = markers;
    return () => {
      markers.forEach((marker) => marker.remove());
      markersRef.current = markersRef.current.filter((marker) => !markers.includes(marker));
    };
  }, [studios, ready, mapZoom]);

  useEffect(() => {
    for (const marker of markersRef.current) {
      const element = marker.getElement();
      const id = element.dataset.id;
      if (!id) continue;
      element.dataset.active = String(id === selectedId || id === hoveredId);
    }
  }, [selectedId, hoveredId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || !selectedId) return;
    const studio = studios.find((item) => item.id === selectedId);
    if (!studio || !Number.isFinite(Number(studio.latitude))) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const target = [Number(studio.longitude), Number(studio.latitude)];
    if (reduced) map.jumpTo({ center: target, zoom: 14.5 });
    else map.flyTo({ center: target, zoom: 14.5, duration: 700 });
  }, [selectedId, studios, ready]);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    const points = studios
      .filter((studio) => Number.isFinite(Number(studio.latitude)) && Number.isFinite(Number(studio.longitude)))
      .map((studio) => [Number(studio.longitude), Number(studio.latitude)]);
    if (points.length > 1) {
      const bounds = points.reduce(
        (acc, point) => acc.extend(point),
        new maplibregl.LngLatBounds(points[0], points[0]),
      );
      map.fitBounds(bounds, { padding: { top: 70, bottom: 70, left: 70, right: 70 }, duration: 500 });
    } else {
      map.easeTo({ center, zoom, duration: 500 });
    }
  };

  if (failed) {
    return (
      <StaticFallback
        studios={studios}
        categories={categories}
        regions={regions}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        message={labels.mapErrorBody || 'Koneksi tile peta gagal atau WebGL tidak tersedia.'}
      />
    );
  }

  return (
    <div className="v2-map relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" role="region" aria-label="Peta studio desain Surabaya" />

      <svg className="v2-map-overlay pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <polygon ref={landRef} fill="#e9e6de" stroke="#151515" strokeWidth="1.2" />
        <polygon ref={cityRef} fill="none" stroke="#151515" strokeWidth="2" strokeLinejoin="round" />
        {REGION_SHAPES.map((shape, index) => (
          <polygon
            key={shape.code}
            ref={(element) => {
              regionRefs.current[index] = element;
            }}
            fill="rgba(241,239,233,0.05)"
            stroke="#151515"
            strokeWidth="1.15"
            strokeDasharray="5 5"
            strokeOpacity="0.55"
          />
        ))}
        {REGION_SHAPES.map((shape, index) => (
          <text
            key={`${shape.code}-label`}
            ref={(element) => {
              regionLabelRefs.current[index] = element;
            }}
            className="v2-mono"
            fontSize="10"
            letterSpacing="2"
            fill="#5f5a51"
            textAnchor="middle"
          >
            {shape.label}
          </text>
        ))}
        <text ref={waterLabelRef} className="v2-mono v2-map-water-label" fontSize="11" letterSpacing="4" fill="#6f6a61" textAnchor="middle">
          SELAT MADURA
        </text>
      </svg>

      <div className="absolute bottom-4 right-4 z-10 flex flex-col border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] v2-offset-sm">
        <button type="button" className="grid h-10 w-10 place-items-center border-b border-[var(--v2-line)] hover:bg-[#e8e5dc]" onClick={zoomIn} aria-label={labels.zoomIn || 'Perbesar peta'}>
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-10 w-10 place-items-center border-b border-[var(--v2-line)] hover:bg-[#e8e5dc]" onClick={zoomOut} aria-label={labels.zoomOut || 'Perkecil peta'}>
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-10 w-10 place-items-center hover:bg-[#e8e5dc]" onClick={resetView} aria-label={labels.resetView || 'Kembalikan tampilan'}>
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
