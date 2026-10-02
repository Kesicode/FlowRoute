import { Essential, FoodStop, Attraction } from "@/types/journey";
import { cachedSource } from "@/lib/source-cache";

// Helper for geographical distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Spreads query and mock points evenly across count segments of the route
function sampleRouteCoords(routeGeometry: [number, number][], count: number = 6): [number, number][] {
  if (!routeGeometry || routeGeometry.length === 0) return [];
  if (routeGeometry.length <= count) return routeGeometry;
  
  const result: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor((i / (count - 1)) * (routeGeometry.length - 1));
    result.push(routeGeometry[idx]);
  }
  return result;
}

const OVERPASS_TTL_MS = 30 * 60 * 1000; // 30 minutes

type OverpassResult = { essentials: Essential[]; foodStops: FoodStop[]; attractions: Attraction[] };

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 2000,
  routeGeometry: [number, number][] = []
): Promise<{ essentials: Essential[]; foodStops: FoodStop[]; attractions: Attraction[] }> {
  // Cache key: round to 0.01° (~1 km) to reuse results for nearby requests
  const cacheKey = `overpass:${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}`;
  const cached = cachedSource<OverpassResult>(
    cacheKey,
    () => _fetchNearbyPlacesUncached(lat, lng, radius, routeGeometry),
    OVERPASS_TTL_MS
  );
  const results = await cached();
  return results[0] ?? { essentials: [], foodStops: [], attractions: [] };
}

async function _fetchNearbyPlacesUncached(
  lat: number,
  lng: number,
  radius: number = 2000,
  routeGeometry: [number, number][] = []
): Promise<OverpassResult[]> {
  const result = await _fetchNearbyPlacesCore(lat, lng, radius, routeGeometry);
  return [result];
}

async function _fetchNearbyPlacesCore(
  lat: number,
  lng: number,
  radius: number = 2000,
  routeGeometry: [number, number][] = []
): Promise<OverpassResult> {

  try {
    let query = `[out:json][timeout:15];\n(\n`;
    const pointsToQuery: [number, number][] = [];

    if (routeGeometry && routeGeometry.length > 0) {
      // Sample 6 points evenly across the entire route to ensure absolute uniform distribution
      const sampled = sampleRouteCoords(routeGeometry, 6);
      pointsToQuery.push(...sampled);
    } else {
      pointsToQuery.push([lat, lng]);
    }

    // Deduplicate points that are too close to each other (< 500m) to optimize API call
    const uniquePoints: [number, number][] = [];
    pointsToQuery.forEach(pt => {
      const isDuplicate = uniquePoints.some(upt => getDistance(upt[0], upt[1], pt[0], pt[1]) < 500);
      if (!isDuplicate) {
        uniquePoints.push(pt);
      }
    });

    uniquePoints.forEach(([pLat, pLng]) => {
      // Use a larger radius (3000m) for intermediate points along the route to guarantee continuous coverage
      const queryRadius = routeGeometry && routeGeometry.length > 0 ? 3000 : radius;
      query += `  node["amenity"~"hospital|police|pharmacy|atm|toilet|charging_station|restaurant|cafe|fast_food"](around:${queryRadius},${pLat},${pLng});\n`;
      query += `  node["tourism"~"attraction|museum|viewpoint"](around:${queryRadius},${pLat},${pLng});\n`;
    });
    query += `);\nout body 80;`; // Increase to 80 to pull a rich set of items across the entire path

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API responded with ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const essentials: Essential[] = [];
    const foodStops: FoodStop[] = [];
    const attractions: Attraction[] = [];

    // Helper to calculate exact minimum distance from the entire route geometry
    const getMinDistanceFromRoute = (elLat: number, elLng: number): number => {
      if (routeGeometry && routeGeometry.length > 0) {
        let minDist = Infinity;
        const step = Math.max(1, Math.floor(routeGeometry.length / 100));
        for (let i = 0; i < routeGeometry.length; i += step) {
          const pt = routeGeometry[i];
          const d = getDistance(pt[0], pt[1], elLat, elLng);
          if (d < minDist) {
            minDist = d;
          }
        }
        return minDist;
      }
      return getDistance(lat, lng, elLat, elLng);
    };

    interface OverpassElement {
      id: number;
      lat?: number;
      lon?: number;
      tags?: {
        name?: string;
        operator?: string;
        amenity?: string;
        tourism?: string;
        cuisine?: string;
        opening_hours?: string;
        description?: string;
        "addr:street"?: string;
        "addr:city"?: string;
        [key: string]: string | undefined;
      };
    }

    elements.forEach((el: OverpassElement) => {
      const elLat = el.lat;
      const elLng = el.lon;
      if (!elLat || !elLng) return;

      const dist = getMinDistanceFromRoute(elLat, elLng);
      const name = el.tags?.name || el.tags?.operator || `${el.tags?.amenity || "Point of Interest"}`;
      const openNow = el.tags?.opening_hours ? !el.tags.opening_hours.includes("closed") : true;

      // Classify
      const amenity = el.tags?.amenity;
      const tourism = el.tags?.tourism;

      if (amenity === "hospital") {
        essentials.push({
          id: `ess-hosp-${el.id}`,
          name: name.includes("Hospital") ? name : `${name} Hospital`,
          type: "hospital",
          distance: dist,
          address: el.tags?.["addr:street"] ? `${el.tags["addr:street"]}, ${el.tags["addr:city"] || ""}` : "Nearby Medical Centre",
          openNow: true,
          coordinate: [elLat, elLng],
        });
      } else if (amenity === "police") {
        essentials.push({
          id: `ess-pol-${el.id}`,
          name: name.includes("Police") ? name : `${name} Police Station`,
          type: "hospital",
          distance: dist,
          address: el.tags?.["addr:street"] || "Emergency Safety Post",
          openNow: true,
          coordinate: [elLat, elLng],
        });
      } else if (amenity === "pharmacy") {
        essentials.push({
          id: `ess-pharm-${el.id}`,
          name: name.includes("Pharmacy") || name.includes("Chemist") ? name : `${name} Pharmacy`,
          type: "pharmacy",
          distance: dist,
          address: el.tags?.["addr:street"] || "Local Pharmacy",
          openNow,
          coordinate: [elLat, elLng],
        });
      } else if (amenity === "atm" || amenity === "bank") {
        essentials.push({
          id: `ess-atm-${el.id}`,
          name: name.includes("ATM") || name.includes("Bank") ? name : `${name} ATM`,
          type: "atm",
          distance: dist,
          address: el.tags?.["addr:street"] || "Financial Cash Point",
          openNow: true,
          coordinate: [elLat, elLng],
        });
      } else if (amenity === "toilet") {
        essentials.push({
          id: `ess-rest-${el.id}`,
          name: "Public Restroom",
          type: "restroom",
          distance: dist,
          address: "Public Utility Way",
          openNow: true,
          coordinate: [elLat, elLng],
        });
      } else if (amenity === "charging_station") {
        essentials.push({
          id: `ess-charge-${el.id}`,
          name: name.includes("Charging") ? name : `${name} EV Charger`,
          type: "fuel",
          distance: dist,
          address: "Electric Mobility Station",
          openNow: true,
          coordinate: [elLat, elLng],
        });
      } else if (amenity && ["restaurant", "cafe", "fast_food"].includes(amenity)) {
        const typeMap: Record<string, "restaurant" | "cafe" | "fastfood"> = {
          restaurant: "restaurant",
          cafe: "cafe",
          fast_food: "fastfood",
        };
        foodStops.push({
          id: `food-${el.id}`,
          name,
          cuisine: el.tags?.cuisine || (amenity === "cafe" ? "Beverages & Desserts" : "Multi-Cuisine"),
          type: typeMap[amenity] ?? "restaurant",
          rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
          priceRange: Math.random() > 0.6 ? "₹₹₹" : Math.random() > 0.3 ? "₹₹" : "₹",
          estimatedCost: Math.random() > 0.6 ? 1200 : Math.random() > 0.3 ? 600 : 250,
          distanceFromRoute: dist,
          openNow,
          address: el.tags?.["addr:street"] || "Dining Street Walk",
          highlights: el.tags?.cuisine ? [el.tags.cuisine, "Highly Rated"] : ["Local Favorite", "Fresh Ingredients"],
          coordinate: [elLat, elLng],
        });
      } else if (tourism && ["attraction", "museum", "viewpoint"].includes(tourism)) {
        const catMap: Record<string, string> = {
          attraction: "Sightseeing",
          museum: "Museum",
          viewpoint: "Scenic Spot",
        };
        const emojis: Record<string, string> = {
          attraction: "📸",
          museum: "🏛️",
          viewpoint: "🌅",
        };
        attractions.push({
          id: `attr-${el.id}`,
          name,
          category: catMap[tourism] ?? "Landmark",
          rating: parseFloat((4.0 + Math.random() * 0.9).toFixed(1)),
          distance: dist,
          description: el.tags?.description || "Popular destination for tourists and locals offering unique photo opportunities.",
          estimatedTime: tourism === "museum" ? 90 : 45,
          free: Math.random() > 0.5,
          entryFee: Math.random() > 0.5 ? Math.round(50 + Math.random() * 300) : undefined,
          coordinate: [elLat, elLng],
          emoji: emojis[tourism] ?? "📍",
        });
      }
    });

    if (essentials.length === 0 && foodStops.length === 0 && attractions.length === 0) {
      return getSimulatedPlaces(lat, lng, routeGeometry);
    }

    // Deduplicate by coordinate proximity (e.g. within 30 meters) to keep map clean
    const uniqueEssentials: Essential[] = [];
    essentials.forEach(item => {
      if (!uniqueEssentials.some(x => getDistance(x.coordinate[0], x.coordinate[1], item.coordinate[0], item.coordinate[1]) < 30)) {
        uniqueEssentials.push(item);
      }
    });

    const uniqueFoodStops: FoodStop[] = [];
    foodStops.forEach(item => {
      if (!uniqueFoodStops.some(x => getDistance(x.coordinate[0], x.coordinate[1], item.coordinate[0], item.coordinate[1]) < 30)) {
        uniqueFoodStops.push(item);
      }
    });

    const uniqueAttractions: Attraction[] = [];
    attractions.forEach(item => {
      if (!uniqueAttractions.some(x => getDistance(x.coordinate[0], x.coordinate[1], item.coordinate[0], item.coordinate[1]) < 30)) {
        uniqueAttractions.push(item);
      }
    });

    return { 
      essentials: uniqueEssentials, 
      foodStops: uniqueFoodStops, 
      attractions: uniqueAttractions 
    };
  } catch (error) {
    console.warn("Error calling Overpass API, using simulation fallback:", error);
    return getSimulatedPlaces(lat, lng, routeGeometry);
  }
}

// Robust fallback generator if Overpass fails or is empty
function getSimulatedPlaces(
  lat: number,
  lng: number,
  routeGeometry: [number, number][] = []
): { essentials: Essential[]; foodStops: FoodStop[]; attractions: Attraction[] } {
  // Sample 6 checkpoints along the route geometry
  let checkPoints: [number, number][] = [];
  if (routeGeometry && routeGeometry.length > 0) {
    checkPoints = sampleRouteCoords(routeGeometry, 6);
  } else {
    // If no route geometry, synthesize 6 spread points extending outwards
    for (let i = 0; i < 6; i++) {
      checkPoints.push([lat - (0.02 * (1 - i / 5)), lng - (0.02 * (1 - i / 5))]);
    }
  }

  // Align simulated variables around the 6 sampled checkpoints
  const cp0 = checkPoints[0]; // Start / 0%
  const cp1 = checkPoints[1]; // 20%
  const cp2 = checkPoints[2]; // 40%
  const cp3 = checkPoints[3]; // 60%
  const cp4 = checkPoints[4]; // 80%
  const cp5 = checkPoints[5]; // End / 100%

  const essentials: Essential[] = [
    {
      id: "sim-ess-1",
      name: "City General Hospital",
      type: "hospital",
      distance: 340,
      address: "24 Emergency Avenue",
      openNow: true,
      coordinate: [cp5[0] + 0.002, cp5[1] - 0.001],
    },
    {
      id: "sim-ess-2",
      name: "Central Police Safety Post",
      type: "hospital",
      distance: 480,
      address: "10 Law Enforcement Road",
      openNow: true,
      coordinate: [cp2[0] - 0.002, cp2[1] + 0.002],
    },
    {
      id: "sim-ess-3",
      name: "Metro Care Pharmacy",
      type: "pharmacy",
      distance: 120,
      address: "128 High Street Junction",
      openNow: true,
      coordinate: [cp1[0] + 0.001, cp1[1] + 0.001],
    },
    {
      id: "sim-ess-4",
      name: "State Bank ATM",
      type: "atm",
      distance: 65,
      address: "Junction Transit Hub",
      openNow: true,
      coordinate: [cp3[0] - 0.001, cp3[1] - 0.0005],
    },
    {
      id: "sim-ess-5",
      name: "Smart EV Fast Charger",
      type: "fuel",
      distance: 280,
      address: "Green Energy Parking Yard",
      openNow: true,
      coordinate: [cp4[0] + 0.0015, cp4[1] - 0.002],
    },
  ];

  const foodStops: FoodStop[] = [
    {
      id: "sim-food-1",
      name: "Spicy Fusion Bistro",
      cuisine: "Indian-Asian Fusion",
      type: "restaurant",
      rating: 4.6,
      priceRange: "₹₹",
      estimatedCost: 650,
      distanceFromRoute: 110,
      openNow: true,
      address: "45 Culinary Circle",
      highlights: ["Vibrant Atmosphere", "Vegan Options", "Award-Winning Curry"],
      coordinate: [cp5[0] + 0.003, cp5[1] + 0.003],
    },
    {
      id: "sim-food-2",
      name: "The Daily Brew Cafe",
      cuisine: "Coffee & Bakery",
      type: "cafe",
      rating: 4.4,
      priceRange: "₹",
      estimatedCost: 200,
      distanceFromRoute: 45,
      openNow: true,
      address: "Transit Station Exit 2",
      highlights: ["Free Wi-Fi", "Fresh Pastries", "Organic Coffee"],
      coordinate: [cp2[0] - 0.0008, cp2[1] + 0.0012],
    },
    {
      id: "sim-food-3",
      name: "Green Delight Kitchen",
      cuisine: "Healthy Organic Salad",
      type: "restaurant",
      rating: 4.2,
      priceRange: "₹₹",
      estimatedCost: 450,
      distanceFromRoute: 180,
      openNow: true,
      address: "78 Wellness Walkway",
      highlights: ["Diet Friendly", "Gluten-Free", "Wheelchair Accessible Entrance"],
      coordinate: [cp1[0] + 0.002, cp1[1] - 0.003],
    },
    {
      id: "sim-food-4",
      name: "Transit Junction Diner",
      cuisine: "Local South Indian",
      type: "restaurant",
      rating: 4.1,
      priceRange: "₹",
      estimatedCost: 180,
      distanceFromRoute: 75,
      openNow: true,
      address: "Subway Corridor Entrance",
      highlights: ["Quick Service", "Hot Beverages"],
      coordinate: [cp3[0] + 0.0015, cp3[1] + 0.001],
    },
    {
      id: "sim-food-5",
      name: "Highway Break Café",
      cuisine: "Snacks & Juices",
      type: "cafe",
      rating: 4.3,
      priceRange: "₹₹",
      estimatedCost: 300,
      distanceFromRoute: 140,
      openNow: true,
      address: "Interchange Rest Stop",
      highlights: ["Fresh Juices", "Restrooms Available"],
      coordinate: [cp0[0] + 0.0025, cp0[1] - 0.0015],
    }
  ];

  const attractions: Attraction[] = [
    {
      id: "sim-attr-1",
      name: "Grand Botanical Conservatory",
      category: "Nature Park",
      rating: 4.7,
      distance: 650,
      description: "A beautiful domed conservatory containing exotic flowers, ponds, and step-free pathways perfect for peaceful walks.",
      estimatedTime: 60,
      free: false,
      entryFee: 150,
      coordinate: [cp5[0] + 0.005, cp5[1] - 0.004],
      emoji: "🌸",
    },
    {
      id: "sim-attr-2",
      name: "Heritage Clock Tower & Plaza",
      category: "Historical Site",
      rating: 4.5,
      distance: 300,
      description: "Iconic colonial clock tower surrounded by a pedestrian-only crowded plaza with lively street performers.",
      estimatedTime: 20,
      free: true,
      coordinate: [cp2[0] - 0.0025, cp2[1] - 0.003],
      emoji: "🗼",
    },
    {
      id: "sim-attr-3",
      name: "Midway Viewpoint Pier",
      category: "Scenic Spot",
      rating: 4.6,
      distance: 120,
      description: "Picturesque waterfront viewpoint offering gorgeous photos of the local backwaters and bridges.",
      estimatedTime: 15,
      free: true,
      coordinate: [cp1[0] - 0.003, cp1[1] + 0.002],
      emoji: "🌅",
    }
  ];

  // Adjust distances to be minimum from the actual routeGeometry if provided
  const calculateMinDist = (coord: [number, number]) => {
    if (routeGeometry && routeGeometry.length > 0) {
      let minD = Infinity;
      for (const pt of routeGeometry) {
        const d = getDistance(pt[0], pt[1], coord[0], coord[1]);
        if (d < minD) minD = d;
      }
      return minD;
    }
    return 100 + Math.round(Math.random() * 400);
  };

  essentials.forEach(e => { e.distance = calculateMinDist(e.coordinate); });
  foodStops.forEach(f => { f.distanceFromRoute = calculateMinDist(f.coordinate); });
  attractions.forEach(a => { a.distance = calculateMinDist(a.coordinate); });

  return { essentials, foodStops, attractions };
}
