'use client';
// components/map/JourneyMap.tsx
// Dynamic import wrapper for JourneyMapInner (WebGL, no SSR).
// Falls back to existing MapWrapper if WebGL is unavailable.

import dynamic from 'next/dynamic';
import MapWrapper from '@/components/map-wrapper';
import { Location } from '@/types/planner';
import { FoodStop, Essential, Attraction, JourneyRoute } from '@/types/journey';

export interface JourneyMapProps {
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

// ssr: false is valid here because this file is a 'use client' component (see Next.js lazy-loading.md)
const JourneyMapInner = dynamic(() => import('./JourneyMapInner'), { ssr: false });

export function JourneyMap(props: JourneyMapProps) {
  // Detect WebGL support. The check is synchronous and safe on the client.
  const hasWebGL =
    typeof window !== 'undefined' && !!window.WebGLRenderingContext;

  if (!hasWebGL) {
    // Graceful degradation: fall back to the existing Leaflet-based MapWrapper.
    // liveCoords is not part of MapWrapperProps — drop it before spreading.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { liveCoords: _liveCoords, ...mapWrapperProps } = props;
    return <MapWrapper {...mapWrapperProps} />;
  }

  return (
    <div className="w-full h-full">
      <JourneyMapInner {...props} />
    </div>
  );
}
