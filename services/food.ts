import { FoodPlace, Location } from "../types/planner";

interface NominatimFoodResult {
  place_id: number | string;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

export async function findFoodNearLocation(location: Location): Promise<FoodPlace[]> {
  try {
    // Search for restaurants, cafes, etc. near the location using Nominatim.
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=restaurant+near+${location.lat},${location.lng}&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FlowRoute-App/1.0" // Required by Nominatim
      }
    });

    if (!response.ok) {
      console.error("Failed to fetch food places");
      return [];
    }

    const data = await response.json();
    
    return data.map((item: NominatimFoodResult) => {
      // Very basic distance calculation using Pythagorean theorem for sorting, 
      // not geographically perfect but fine for a small area.
      const dLat = (parseFloat(item.lat) - location.lat) * 111000;
      const dLng = (parseFloat(item.lon) - location.lng) * 111000 * Math.cos(location.lat * Math.PI / 180);
      const distance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
      
      return {
        id: item.place_id.toString(),
        name: item.name || "Unknown Restaurant",
        category: "restaurant",
        rating: 4.0 + Math.random(), // Simulated rating
        distance: distance,
        description: item.display_name.split(",").slice(0, 2).join(", "),
        coordinate: [parseFloat(item.lat), parseFloat(item.lon)]
      } as FoodPlace;
    }).sort((a: FoodPlace, b: FoodPlace) => a.distance - b.distance);
    
  } catch (error) {
    console.error("Error fetching food places:", error);
    return [];
  }
}
