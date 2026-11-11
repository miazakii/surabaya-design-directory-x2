import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import {
  REGION_LABELS,
  REGION_META,
  SURABAYA_CITY_GEOJSON,
  SURABAYA_KECAMATAN_GEOJSON,
  SURABAYA_REGION_GEOJSON,
} from '@/lib/surabaya-boundaries';
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

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const PAPER_STYLE = {
  version: 8,
  name: 'Direktori Paper + OSM',
  sources: {
    osm: {
      type: 'raster',
      tiles: [OSM_TILES],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#e9e6de' } },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-opacity': 0.92,
        'raster-saturation': -1,
        'raster-contrast': -0.06,
        'raster-brightness-min': 0.04,
        'raster-brightness-max': 0.96,
      },
    },
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

function geometryBounds(geometry) {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  const visit = (coordinates) => {
    if (typeof coordinates[0] === 'number') {
      const [lng, lat] = coordinates;
      west = Math.min(west, lng);
      east = Math.max(east, lng);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      return;
    }
    coordinates.forEach(visit);
  };
  visit(geometry.coordinates);
  return { west, east, south, north };
}

function makeProject(bounds, width = 1000, height = 700, padding = 34) {
  const lngSpan = bounds.east - bounds.west;
  const latSpan = bounds.north - bounds.south;
  const scale = Math.min((width - padding * 2) / lngSpan, (height - padding * 2) / latSpan);
  const offsetX = (width - lngSpan * scale) / 2;
  const offsetY = (height - latSpan * scale) / 2;
  return ([lng, lat]) => [
    offsetX + (lng - bounds.west) * scale,
    offsetY + (bounds.north - lat) * scale,
  ];
}

function ringToPath(ring, project) {
  return `${ring
    .map((coordinate, index) => {
      const [x, y] = project(coordinate);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ')} Z`;
}

function geometryToPath(geometry, project) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((polygon) => polygon.map((ring) => ringToPath(ring, project)).join(' ')).join(' ');
}

const FALLBACK_BOUNDS = geometryBounds(SURABAYA_CITY_GEOJSON);
const fallbackProject = makeProject(FALLBACK_BOUNDS);
const FALLBACK_CITY_PATH = geometryToPath(SURABAYA_CITY_GEOJSON, fallbackProject);
const FALLBACK_REGION_PATHS = SURABAYA_REGION_GEOJSON.features.map((feature) => ({
  code: feature.properties.code,
  color: feature.properties.color,
  path: geometryToPath(feature.geometry, fallbackProject),
}));
const FALLBACK_KECAMATAN_PATHS = SURABAYA_KECAMATAN_GEOJSON.features.map((feature) =>
  geometryToPath(feature.geometry, fallbackProject),
);

function StaticFallback({ studios, categories, hoveredId, selectedId, onSelect, onHover, message }) {
  const categoryList = categoryMap(categories);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9e6de]">
      <div className="absolute inset-0 v2-dots opacity-70" />
      <svg viewBox="0 0 1000 700" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d={FALLBACK_CITY_PATH} fill="#e9e6de" stroke="#151515" strokeWidth="2" strokeLinejoin="round" />
        {FALLBACK_REGION_PATHS.map((region) => (
          <path key={region.code} d={region.path} fill={region.color} fillOpacity="0.18" stroke="none" />
        ))}
        {FALLBACK_KECAMATAN_PATHS.map((path, index) => (
          <path
            key={index}
            d={path}
            fill="none"
            stroke="#151515"
            strokeOpacity="0.32"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
        ))}
        {REGION_META.map((region) => {
          const [x, y] = fallbackProject(REGION_LABELS[region.code]);
          return (
            <text
              key={region.code}
              x={x}
              y={y}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize="10"
              fontWeight="700"
              letterSpacing="2"
              fill="#3f3b35"
              stroke="#f1efe9"
              strokeWidth="4"
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {region.code}
            </text>
          );
        })}
        <text x="500" y="42" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" letterSpacing="4" fill="#5f5a51" stroke="#f1efe9" strokeWidth="4" paintOrder="stroke">
          SELAT MADURA
        </text>
      </svg>
      {groupStudios(studios, 11.6).map((group) => {
        const [x, y] = fallbackProject([group.lng, group.lat]);
        const info = categoryInfo(categoryList, group.studio);
        const isCluster = group.count > 1;
        return (
          <div
            key={group.key}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 700) * 100}%` }}
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
  const regionMarkersRef = useRef([]);
  const popupRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [basemap, setBasemap] = useState('osm');

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
          customAttribution:
            '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors · Peta diagram Direktori',
        }),
        'bottom-right',
      );

      map.on('error', () => {
        if (loadedRef.current) return;
        setFailed(true);
      });

      map.on('style.load', () => {
        if (cancelled) return;
        loadedRef.current = true;
        setFailed(false);
        setReady(true);

        regionMarkersRef.current = REGION_META.map((region) => {
          const labelAt = REGION_LABELS[region.code];
          if (!labelAt) return null;
          const element = document.createElement('div');
          element.className = 'v2-region-label';
          element.innerHTML = `<span class="v2-region-label__swatch" style="background:${region.color}"></span><strong>${region.code}</strong><span>${region.label.replace('Surabaya ', '')}</span>`;
          return new maplibregl.Marker({ element, anchor: 'center' })
            .setLngLat(labelAt)
            .addTo(map);
        }).filter(Boolean);

        map.addSource('region-shapes', { type: 'geojson', data: SURABAYA_REGION_GEOJSON });
        map.addLayer({
          id: 'region-fill',
          type: 'fill',
          source: 'region-shapes',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.07,
          },
        });
        map.addLayer({
          id: 'region-line',
          type: 'line',
          source: 'region-shapes',
          paint: {
            'line-color': '#151515',
            'line-width': 1.5,
            'line-opacity': 0.72,
          },
        });
        map.addSource('kecamatan-shapes', { type: 'geojson', data: SURABAYA_KECAMATAN_GEOJSON });
        map.addLayer({
          id: 'kecamatan-line',
          type: 'line',
          source: 'kecamatan-shapes',
          paint: {
            'line-color': '#151515',
            'line-width': 0.7,
            'line-dasharray': [2, 3],
            'line-opacity': 0.38,
          },
        });
        map.addSource('city-shape', { type: 'geojson', data: SURABAYA_CITY_GEOJSON });
        map.addLayer({
          id: 'city-line',
          type: 'line',
          source: 'city-shape',
          paint: {
            'line-color': '#151515',
            'line-width': 1.8,
          },
        });

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
      regionMarkersRef.current.forEach((marker) => marker.remove());
      regionMarkersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
    // Map dibuat sekali; data, marker, dan seleksi diperbarui lewat effect lain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (map.getLayer('osm')) {
      map.setLayoutProperty('osm', 'visibility', basemap === 'osm' ? 'visible' : 'none');
    }
    if (map.getLayer('region-fill')) {
      map.setPaintProperty('region-fill', 'fill-opacity', basemap === 'osm' ? 0.07 : 0.16);
    }
  }, [basemap, ready]);

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

      <div className="absolute right-3 top-3 z-10 flex border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] v2-offset-sm sm:right-4 sm:top-4">
        <button
          type="button"
          className={`v2-mono px-2.5 py-2 text-[8px] font-bold tracking-[0.08em] ${
            basemap === 'osm' ? 'bg-[var(--v2-ink)] text-[var(--v2-paper)]' : 'hover:bg-[#e8e5dc]'
          }`}
          onClick={() => setBasemap('osm')}
          title="Peta dasar OpenStreetMap"
        >
          PETA
        </button>
        <button
          type="button"
          className={`v2-mono border-l border-[var(--v2-line)] px-2.5 py-2 text-[8px] font-bold tracking-[0.08em] ${
            basemap === 'paper' ? 'bg-[var(--v2-ink)] text-[var(--v2-paper)]' : 'hover:bg-[#e8e5dc]'
          }`}
          onClick={() => setBasemap('paper')}
          title="Diagram wilayah tanpa peta dasar"
        >
          DIAGRAM
        </button>
      </div>

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
