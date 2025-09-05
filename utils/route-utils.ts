interface Coordinates {
  lat: number;
  lon: number;
}

interface AddressWithCoords {
  address: string;
  lat: number;
  lon: number;
  isStartPoint?: boolean;
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    console.log(`Geocoding address: ${address}`);
    
    // Using Nominatim (OpenStreetMap) for free geocoding
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const coords = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
      };
      console.log(`Geocoded "${address}" to:`, coords);
      return coords;
    }
    
    console.warn(`No results found for address: ${address}`);
    return null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
    return null;
  }
}

export function optimizeRoute(addresses: AddressWithCoords[]): AddressWithCoords[] {
  if (addresses.length <= 2) {
    return addresses;
  }

  console.log('Optimizing route for', addresses.length, 'addresses');
  
  // Find start point or use first address
  const startPoint = addresses.find(addr => addr.isStartPoint) || addresses[0];
  const remainingAddresses = addresses.filter(addr => addr !== startPoint);
  
  // Simple nearest neighbor algorithm (TSP approximation)
  const optimized: AddressWithCoords[] = [startPoint];
  const unvisited = [...remainingAddresses];
  
  let current = startPoint;
  
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      current.lat,
      current.lon,
      unvisited[0].lat,
      unvisited[0].lon
    );
    
    // Find nearest unvisited address
    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        current.lat,
        current.lon,
        unvisited[i].lat,
        unvisited[i].lon
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    
    // Add nearest address to route
    const nearest = unvisited[nearestIndex];
    optimized.push(nearest);
    unvisited.splice(nearestIndex, 1);
    current = nearest;
  }
  
  console.log('Route optimization completed');
  return optimized;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}