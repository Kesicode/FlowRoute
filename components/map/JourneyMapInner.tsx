'use client';
// components/map/JourneyMapInner.tsx
// Full MapLibre GL JS map for the journey page.
// Replaces Leaflet InteractiveMap on /journey.

import { useEffect, useRef } from 'react';
import { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Location } from '@/types/planner';
import { FoodStop, Essential, Attraction, JourneyRoute } from '@/types/journey';

interface JourneyMapInnerProps {
  origin: Location | null;
  destination: Location | null;
  /** [lat, lng] pairs from OSRM */
  routeGeometry?: [number, number][];
  foodPlaces?: FoodStop[];
  essentials?: Essential[];
  attractions?: Attraction[];
  safetyMode?: boolean;
  activeSegmentCoords?: [number, number][];
  selectedRoute?: JourneyRoute | null;
  allRoutes?: JourneyRoute[];
  /** [lat, lng] from GPS */
  liveCoords?: [number, number] | null;
}

export default function JourneyMapInner({
  origin,
  destination,
  routeGeometry = [],
  foodPlaces = [],
  essentials = [],
  attractions = [],
  liveCoords,
}: JourneyMapInnerProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const liveMarkerRef = useRef<Marker | null>(null);

  // ── Effect 1: create and destroy the map ─────────────────────────────────
  useEffect(() => {
    if (!divRef.current) return;

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
      center: [76.27, 10.85], // Kerala default [lng, lat]
      zoom: 10,
    });

    mapRef.current = map;

    map.on('load', () => {
      // ── Route line ────────────────────────────────────────────────────────
      if (routeGeometry && routeGeometry.length > 0) {
        // OSRM gives [lat, lng]; GeoJSON needs [lng, lat]
        const coordinates = routeGeometry.map(([lat, lng]) => [lng, lat]);

        map.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates,
            },
            properties: {},
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          paint: {
            'line-color': '#00f2fe',
            'line-width': 4,
          },
        });
      }

      // ── Origin marker ─────────────────────────────────────────────────────
      if (origin) {
        new Marker({ color: '#00f2fe' })
          .setLngLat([origin.lng, origin.lat])
          .setPopup(new Popup().setText(origin.displayName || origin.name))
          .addTo(map);
      }

      // ── Destination marker ────────────────────────────────────────────────
      if (destination) {
        new Marker({ color: '#ef4444' })
          .setLngLat([destination.lng, destination.lat])
          .setPopup(new Popup().setText(destination.displayName || destination.name))
          .addTo(map);
      }

      // ── FitBounds ─────────────────────────────────────────────────────────
      if (origin && destination) {
        map.fitBounds(
          [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
          { padding: 60 }
        );
      }

      // ── Food markers ──────────────────────────────────────────────────────
      foodPlaces.forEach((place) => {
        const [lat, lng] = place.coordinate;
        new Marker({ color: '#f59e0b' })
          .setLngLat([lng, lat])
          .setPopup(
            new Popup().setHTML(
              `<strong>${place.name}</strong><br/>${place.cuisine} · ${place.priceRange}`
            )
          )
          .addTo(map);
      });

      // ── Essential markers ─────────────────────────────────────────────────
      essentials.forEach((item) => {
        const [lat, lng] = item.coordinate;
        new Marker({ color: '#10b981' })
          .setLngLat([lng, lat])
          .setPopup(
            new Popup().setHTML(
              `<strong>${item.name}</strong><br/>${item.type}`
            )
          )
          .addTo(map);
      });

      // ── Attraction markers ────────────────────────────────────────────────
      attractions.forEach((attr) => {
        const [lat, lng] = attr.coordinate;
        new Marker({ color: '#8b5cf6' })
          .setLngLat([lng, lat])
          .setPopup(
            new Popup().setHTML(
              `<strong>${attr.emoji} ${attr.name}</strong><br/>${attr.category}`
            )
          )
          .addTo(map);
      });
    });

    return () => {
      liveMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // Intentionally only re-mount the map when origin/destination/routeGeometry change;
    // POI arrays are stable after load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, routeGeometry]);

  // ── Effect 2: update live position marker without re-creating the map ────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!liveCoords) {
      if (liveMarkerRef.current) {
        liveMarkerRef.current.remove();
        liveMarkerRef.current = null;
      }
      return;
    }

    const [lat, lng] = liveCoords;

    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLngLat([lng, lat]);
    } else {
      liveMarkerRef.current = new Marker({ color: '#00f2fe' })
        .setLngLat([lng, lat])
        .addTo(map);
    }
  }, [liveCoords]);

  return <div ref={divRef} className="w-full h-full" />;
}
