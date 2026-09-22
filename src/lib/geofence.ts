/**
 * Geofencing & Distance Calculation using Haversine Formula
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface in meters
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Checks if a given coordinate is within the allowed store radius (in meters)
 */
export function isWithinGeofence(
  userCoord: Coordinates,
  storeCoord: Coordinates,
  radiusMeters: number
): { isInside: boolean; distance: number } {
  const distance = calculateHaversineDistance(userCoord, storeCoord);
  return {
    isInside: distance <= radiusMeters,
    distance,
  };
}
