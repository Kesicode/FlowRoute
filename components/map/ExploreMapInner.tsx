'use client';
/**
 * components/map/ExploreMapInner.tsx
 *
 * Phase 8 — Explore Page MapLibre GL JS Map
 *
 * Full-viewport WebGL map with:
 *  - OpenStreetMap raster tiles (no API key)
 *  - GPS position marker (pulsing cyan dot via Framer Motion HTML overlay)
 *  - POI markers for Food, Attractions, Essentials (fetched live from Overpass)
 *  - Discovery radius circle overlay (drawn as GeoJSON polygon)
 *  - "Add to Trip" popup action on each POI
 * 
 * Parent controls the fetch by passing poiData + center.
 * This component only handles rendering.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Map as MapLibreMap, Marker, Popup, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FoodStop, Essential, Attraction } from '@/types/journey';

export interface POIData {
  foodStops: FoodStop[];
  essentials: Essential[];
  attractions: Attraction[];
}

export interface ExploreMapInnerProps {
  /** [lat, lng] center — GPS or trip origin */
  center: [number, number] | null;
  /** Discovery radius in metres (0 = off) */
  radiusMeters: number;
  /** POIs to render */
  poiData: POIData;
  /** Called when user taps "Add to Trip" on a POI */
  onAddToTrip?: (name: string, lat: number, lng: number, category: string) => void;
  /** Called when map is ready and idle */
  onMapReady?: () => void;
}

// ── Radius circle as GeoJSON polygon (approx with 64 points) ─────────────────
function makeCircleGeoJSON(
  lat: number,
  lng: number,
  radiusMeters: number,
  steps = 64
): GeoJSON.FeatureCollection {
  const coords: [number, number][] = [];
  const earthRadius = 6371000;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
    const dLng = dLat / Math.cos((lat * Math.PI) / 180);
    coords.push([lng + dLng * Math.sin(angle), lat + dLat * Math.cos(angle)]);
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      },
    ],
  };
}

// ── Category → icon label ─────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍽️',
  restaurant: '🍽️',
  cafe: '☕',
  attraction: '🎯',
  museum: '🏛️',
  hospital: '🏥',
  pharmacy: '💊',
  police: '🚓',
  atm: '🏦',
  essential: '📍',
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? '📍';
}

// ── HTML marker element ───────────────────────────────────────────────────────
function makeMarkerEl(emoji: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:32px;height:32px;display:flex;align-items:center;justify-content:center;' +
    'font-size:18px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));' +
    'transition:transform 0.15s;';
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
  el.textContent = emoji;
  return el;
}

// ── Live position pulsing dot ─────────────────────────────────────────────────
function makeLiveDotEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:16px;height:16px;border-radius:50%;background:#00f2fe;' +
    'box-shadow:0 0 0 4px rgba(0,242,254,0.25);animation:livePulse 2s infinite;';
  // inject keyframes once
  if (!document.getElementById('explore-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'explore-pulse-style';
    style.textContent = '@keyframes livePulse{0%,100%{box-shadow:0 0 0 4px rgba(0,242,254,0.25)}50%{box-shadow:0 0 0 10px rgba(0,242,254,0)}}';
    document.head.appendChild(style);
  }
  return el;
}

export default function ExploreMapInner({
  center,
  radiusMeters,
  poiData,
  onAddToTrip,
  onMapReady,
}: ExploreMapInnerProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const liveMarkerRef = useRef<Marker | null>(null);
  const poiMarkersRef = useRef<Marker[]>([]);

  // ── Effect 1: Create map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = center
      ? [center[1], center[0]] // [lng, lat]
      : [76.27, 10.85]; // Kerala default

    const map = new MapLibreMap({
      container: divRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: defaultCenter,
      zoom: 13,
    });

    map.on('load', () => {
      // Add radius circle source/layer (empty initially)
      map.addSource('radius-circle', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: { 'fill-color': '#00f2fe', 'fill-opacity': 0.05 },
      });
      map.addLayer({
        id: 'radius-outline',
        type: 'line',
        source: 'radius-circle',
        paint: { 'line-color': '#00f2fe', 'line-width': 1.5, 'line-dasharray': [4, 3] },
      });

      onMapReady?.();
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 2: Fly to center + update live dot + radius ────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;

    const [lat, lng] = center;

    // Fly
    map.flyTo({ center: [lng, lat], zoom: 14, duration: 1200 });

    // Live position marker
    if (!liveMarkerRef.current) {
      liveMarkerRef.current = new Marker({ element: makeLiveDotEl(), anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      liveMarkerRef.current.setLngLat([lng, lat]);
    }

    // Radius circle
    const src = map.getSource('radius-circle') as GeoJSONSource | undefined;
    if (src) {
      src.setData(
        radiusMeters > 0
          ? makeCircleGeoJSON(lat, lng, radiusMeters)
          : { type: 'FeatureCollection', features: [] }
      );
    }
  }, [center, radiusMeters]);

  // ── Effect 3: POI markers ─────────────────────────────────────────────────
  const clearPOIMarkers = useCallback(() => {
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clearPOIMarkers();

    const allPOIs: Array<{ lat: number; lng: number; name: string; category: string }> = [
      ...poiData.foodStops.map((f) => ({
        lat: f.lat, lng: f.lng, name: f.name, category: 'food',
      })),
      ...poiData.attractions.map((a) => ({
        lat: a.lat, lng: a.lng, name: a.name, category: 'attraction',
      })),
      ...poiData.essentials.map((e) => ({
        lat: e.lat, lng: e.lng, name: e.name, category: e.type ?? 'essential',
      })),
    ];

    allPOIs.forEach(({ lat, lng, name, category }) => {
      const el = makeMarkerEl(getCategoryEmoji(category));

      const popupHTML = `
        <div style="font-family:sans-serif;min-width:140px;max-width:200px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#fff">${name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;text-transform:capitalize">${category}</div>
          ${onAddToTrip
            ? `<button
                onclick="window.dispatchEvent(new CustomEvent('flowroute:add-poi',{detail:{name:'${name.replace(/'/g, "\\'")}',lat:${lat},lng:${lng},category:'${category}'}}))"
                style="width:100%;padding:6px 0;border-radius:8px;background:rgba(0,242,254,0.15);color:#00f2fe;border:1px solid rgba(0,242,254,0.3);font-size:12px;font-weight:600;cursor:pointer"
              >+ Add to Trip</button>`
            : ''}
        </div>`;

      const popup = new Popup({ offset: 8, closeButton: false })
        .setHTML(popupHTML);

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      poiMarkersRef.current.push(marker);
    });
  }, [poiData, onAddToTrip, clearPOIMarkers]);

  return <div ref={divRef} className="w-full h-full" />;
}
