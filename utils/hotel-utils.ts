import { calculateDistance } from './route-utils';

interface AddressWithCoords {
  address: string;
  lat: number;
  lon: number;
  isStartPoint?: boolean;
}

interface Hotel {
  name: string;
  address: string;
  lat: number;
  lon: number;
  distance: number;
  type: string;
  distanceFromLastPoint?: number;
}

export function calculateCentroid(addresses: AddressWithCoords[]): { lat: number; lon: number } {
  if (addresses.length === 0) {
    throw new Error('No addresses provided');
  }
  
  const totalLat = addresses.reduce((sum, addr) => sum + addr.lat, 0);
  const totalLon = addresses.reduce((sum, addr) => sum + addr.lon, 0);
  
  return {
    lat: totalLat / addresses.length,
    lon: totalLon / addresses.length,
  };
}

export async function searchNearbyHotels(lat: number, lon: number, radiusKm: number = 10, lastPointLat?: number, lastPointLon?: number): Promise<Hotel[]> {
  try {
    console.log(`Searching for hotels near ${lat}, ${lon} within ${radiusKm}km`);
    
    // Using Overpass API to search for accommodation
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"~"^(hotel|guest_house|hostel|motel)$"](around:${radiusKm * 1000},${lat},${lon});
        way["tourism"~"^(hotel|guest_house|hostel|motel)$"](around:${radiusKm * 1000},${lat},${lon});
        relation["tourism"~"^(hotel|guest_house|hostel|motel)$"](around:${radiusKm * 1000},${lat},${lon});
      );
      out center meta;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const hotels: Hotel[] = [];
    
    for (const element of data.elements) {
      const tags = element.tags || {};
      const name = tags.name || tags['name:en'] || 'Unnamed Hotel';
      const tourism = tags.tourism || 'hotel';
      
      // Get coordinates
      let elementLat: number, elementLon: number;
      if (element.type === 'node') {
        elementLat = element.lat;
        elementLon = element.lon;
      } else if (element.center) {
        elementLat = element.center.lat;
        elementLon = element.center.lon;
      } else {
        continue; // Skip if no coordinates
      }
      
      // Build address
      const addressParts = [];
      if (tags['addr:street']) {
        addressParts.push(tags['addr:street']);
        if (tags['addr:housenumber']) {
          addressParts[0] = `${tags['addr:housenumber']} ${addressParts[0]}`;
        }
      }
      if (tags['addr:city']) {
        addressParts.push(tags['addr:city']);
      }
      if (tags['addr:postcode']) {
        addressParts.push(tags['addr:postcode']);
      }
      
      const address = addressParts.length > 0 
        ? addressParts.join(', ')
        : `${elementLat.toFixed(4)}, ${elementLon.toFixed(4)}`;
      
      // Calculate distance from centroid
      const distance = calculateDistance(lat, lon, elementLat, elementLon);
      
      hotels.push({
        name,
        address,
        lat: elementLat,
        lon: elementLon,
        distance,
        type: tourism,
      });
    }
    
    // Sort by distance from last point if provided, otherwise from centroid
    if (lastPointLat !== undefined && lastPointLon !== undefined) {
      // Calculate distance from last point for each hotel
      hotels.forEach(hotel => {
        hotel.distanceFromLastPoint = calculateDistance(lastPointLat, lastPointLon, hotel.lat, hotel.lon);
      });
      // Sort by distance from last point
      hotels.sort((a, b) => (a.distanceFromLastPoint || 0) - (b.distanceFromLastPoint || 0));
    } else {
      // Sort by distance from centroid
      hotels.sort((a, b) => a.distance - b.distance);
    }
    const limitedHotels = hotels.slice(0, 20); // Limit to 20 results
    
    console.log(`Found ${limitedHotels.length} hotels`);
    return limitedHotels;
    
  } catch (error) {
    console.error('Hotel search error:', error);
    throw error;
  }
}