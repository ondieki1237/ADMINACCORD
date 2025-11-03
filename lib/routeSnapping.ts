/**
 * Route Snapping Utilities using OSRM (FREE)
 * Uses public OSRM server - no API key required
 * Rate limit: Fair use policy
 */

import simplify from '@turf/simplify';
import { lineString } from '@turf/helpers';

interface Coordinate {
  lat: number;
  lng: number;
}

interface SnappedRoute {
  coordinates: [number, number][]; // [lng, lat] format
  distance: number; // meters
  duration: number; // seconds
  provider: string;
}

/**
 * Snap a trail to actual roads using OSRM (Open Source Routing Machine)
 * FREE - Public server, no API key required
 * Uses demo server: router.project-osrm.org
 */
export async function snapTrailToRoads(
  coordinates: Coordinate[],
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<SnappedRoute | null> {
  if (coordinates.length < 2) {
    console.warn('Need at least 2 coordinates to snap route');
    return null;
  }

  try {
    // Simplify trail to reduce API calls (max 100 waypoints for OSRM)
    const simplifiedCoords = simplifyTrailCoordinates(coordinates, 100);

    console.log(`Snapping ${simplifiedCoords.length} points to roads...`);

    // OSRM uses different profiles
    const profileMap = {
      driving: 'car',
      walking: 'foot',
      cycling: 'bike'
    };
    const profile = profileMap[mode] || 'car';

    // Format coordinates as lng,lat;lng,lat;lng,lat
    const coordinatesString = simplifiedCoords
      .map(c => `${c.lng},${c.lat}`)
      .join(';');

    // OSRM API endpoint (free public server)
    const apiUrl = `https://router.project-osrm.org/route/v1/${profile}/${coordinatesString}`;

    const response = await fetch(apiUrl + '?overview=full&geometries=geojson&steps=false', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OSRM API error:', response.statusText, errorText);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok') {
      console.error('OSRM returned error code:', data.code, data.message);
      return null;
    }

    if (!data.routes || data.routes.length === 0) {
      console.error('No routes found from OSRM');
      return null;
    }

    const route = data.routes[0];

    if (!route.geometry || !route.geometry.coordinates) {
      console.error('No geometry in OSRM response');
      return null;
    }

    console.log(`✓ Route snapped: ${route.geometry.coordinates.length} points, ${(route.distance / 1000).toFixed(2)} km`);

    return {
      coordinates: route.geometry.coordinates, // [lng, lat] format
      distance: route.distance, // meters
      duration: route.duration, // seconds
      provider: 'osrm'
    };

  } catch (error) {
    console.error('Error snapping route to roads:', error);
    return null;
  }
}

/**
 * Simplify trail coordinates to reduce number of points
 * Useful for staying within API limits (ORS: 50 waypoints max)
 */
export function simplifyTrailCoordinates(
  coordinates: Coordinate[],
  maxPoints: number = 50
): Coordinate[] {
  if (coordinates.length <= maxPoints) {
    return coordinates;
  }

  try {
    // Convert to GeoJSON LineString
    const coords = coordinates.map(c => [c.lng, c.lat]);
    const line = lineString(coords);

    // Calculate tolerance dynamically based on number of points
    const reductionRatio = coordinates.length / maxPoints;
    const tolerance = 0.0001 * Math.log(reductionRatio);

    // Simplify using Douglas-Peucker algorithm
    const simplified = simplify(line, { tolerance, highQuality: true });

    // Convert back to Coordinate format
    return simplified.geometry.coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1]
    }));

  } catch (error) {
    console.error('Error simplifying coordinates:', error);
    
    // Fallback: simple uniform sampling
    const step = Math.ceil(coordinates.length / maxPoints);
    const sampled: Coordinate[] = [];
    
    // Always include first point
    sampled.push(coordinates[0]);
    
    // Sample uniformly
    for (let i = step; i < coordinates.length - 1; i += step) {
      sampled.push(coordinates[i]);
    }
    
    // Always include last point
    sampled.push(coordinates[coordinates.length - 1]);
    
    return sampled;
  }
}

/**
 * Batch process multiple trails with rate limiting
 * Respects ORS rate limit: 40 requests/minute
 */
export async function batchSnapTrails(
  trails: Array<{ id: string; coordinates: Coordinate[] }>,
  mode: 'driving' | 'walking' | 'cycling' = 'driving',
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, SnappedRoute | null>> {
  const results = new Map<string, SnappedRoute | null>();
  const delayBetweenRequests = 1500; // 1.5 seconds = 40 requests/minute

  for (let i = 0; i < trails.length; i++) {
    const trail = trails[i];
    
    console.log(`Processing trail ${i + 1}/${trails.length}: ${trail.id}`);
    
    const snappedRoute = await snapTrailToRoads(trail.coordinates, mode);
    results.set(trail.id, snappedRoute);

    if (onProgress) {
      onProgress(i + 1, trails.length);
    }

    // Rate limiting delay (except for last request)
    if (i < trails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
    }
  }

  return results;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate total trail distance
 */
export function calculateTrailDistance(coordinates: Coordinate[]): number {
  let totalDistance = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    totalDistance += calculateDistance(coordinates[i - 1], coordinates[i]);
  }
  
  return totalDistance;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinate(coord: Coordinate): boolean {
  return (
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180 &&
    !isNaN(coord.lat) &&
    !isNaN(coord.lng)
  );
}

/**
 * Filter out invalid coordinates
 */
export function cleanCoordinates(coordinates: Coordinate[]): Coordinate[] {
  return coordinates.filter(isValidCoordinate);
}
