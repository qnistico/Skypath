/**
 * Arc layer for flight paths
 *
 * Creates animated arcs between airports based on flight data
 */

import { findNearestAirport } from '../data/airports.js';

// Maximum arcs to render (for performance)
const MAX_ARCS = 200;

// Minimum distance for arc display (in degrees, ~4.5 degrees ≈ 500km)
const MIN_ARC_DISTANCE_DEG = 4;

/**
 * Create arc data from flights
 * Since OpenSky doesn't provide origin/destination, we:
 * 1. Find the nearest airport to each flight's current position
 * 2. Use heading to estimate a destination direction
 * 3. Create arcs from nearby hub airports
 */
export function createArcData(flights, airports) {
  if (!airports || airports.size === 0) {
    return [];
  }

  const arcs = [];
  const airportsList = Array.from(airports.values());

  // Sample flights for performance
  const sampledFlights = sampleFlights(flights, MAX_ARCS);

  for (const flight of sampledFlights) {
    // Find nearest airport (likely origin or waypoint)
    const nearestAirport = findNearestAirport(
      flight.latitude,
      flight.longitude,
      airports
    );

    if (!nearestAirport) continue;

    // Estimate destination based on heading
    const estimatedDest = estimateDestination(
      flight.latitude,
      flight.longitude,
      flight.heading,
      airportsList
    );

    if (estimatedDest && estimatedDest.iata !== nearestAirport.iata) {
      arcs.push({
        startLat: nearestAirport.lat,
        startLng: nearestAirport.lng,
        endLat: estimatedDest.lat,
        endLng: estimatedDest.lng,
        flight: flight,
        origin: nearestAirport,
        destination: estimatedDest
      });
    }
  }

  return arcs;
}

/**
 * Sample flights evenly for arc display
 */
function sampleFlights(flights, maxCount) {
  if (flights.length <= maxCount) {
    return flights;
  }

  // Prioritize flights with valid heading
  const withHeading = flights.filter(f => f.heading !== null);
  const step = Math.ceil(withHeading.length / maxCount);

  return withHeading.filter((_, i) => i % step === 0);
}

/**
 * Estimate destination airport based on current position and heading
 */
function estimateDestination(lat, lng, heading, airports) {
  if (heading === null || heading === undefined) {
    return null;
  }

  // Project a point ~2000km in the heading direction
  const projectedPoint = projectPoint(lat, lng, heading, 2000);

  // Find airport closest to projected point
  let closest = null;
  let minDistance = Infinity;

  for (const airport of airports) {
    const distance = simpleDistance(
      projectedPoint.lat,
      projectedPoint.lng,
      airport.lat,
      airport.lng
    );

    // Must be at least MIN_ARC_DISTANCE_DEG from origin
    const originDistance = simpleDistance(lat, lng, airport.lat, airport.lng);

    if (distance < minDistance && originDistance > MIN_ARC_DISTANCE_DEG) {
      minDistance = distance;
      closest = airport;
    }
  }

  return closest;
}

/**
 * Project a point given start, heading (degrees), and distance (km)
 */
function projectPoint(lat, lng, heading, distanceKm) {
  const R = 6371; // Earth's radius in km
  const d = distanceKm / R;
  const headingRad = heading * (Math.PI / 180);
  const lat1 = lat * (Math.PI / 180);
  const lng1 = lng * (Math.PI / 180);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(headingRad)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(headingRad) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: lat2 * (180 / Math.PI),
    lng: lng2 * (180 / Math.PI)
  };
}

/**
 * Simple Euclidean distance (approximate, fine for comparison)
 */
function simpleDistance(lat1, lng1, lat2, lng2) {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Create a position-to-destination arc for a highlighted flight
 * Shows where the flight is heading from its current position
 */
export function createFlightPositionArc(flight, airports) {
  if (!flight || !airports || airports.size === 0) {
    return null;
  }

  const airportsList = Array.from(airports.values());

  // Estimate destination based on heading
  const estimatedDest = estimateDestination(
    flight.latitude,
    flight.longitude,
    flight.heading,
    airportsList
  );

  if (!estimatedDest) {
    return null;
  }

  return {
    startLat: flight.latitude,
    startLng: flight.longitude,
    endLat: estimatedDest.lat,
    endLng: estimatedDest.lng,
    flight: flight,
    destination: estimatedDest,
    isPositionArc: true // Flag to identify this arc type
  };
}

/**
 * Create arcs for a specific airport showing all connections
 */
export function createAirportArcs(airportCode, airports) {
  const origin = airports.get(airportCode);
  if (!origin) return [];

  // Create arcs to other major airports
  const arcs = [];
  airports.forEach((dest, code) => {
    if (code !== airportCode) {
      arcs.push({
        startLat: origin.lat,
        startLng: origin.lng,
        endLat: dest.lat,
        endLng: dest.lng,
        origin,
        destination: dest
      });
    }
  });

  return arcs;
}
