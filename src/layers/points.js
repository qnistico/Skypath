/**
 * Points layer for aircraft and airport markers
 */

// Maximum points to render
const MAX_POINTS = 1000;

/**
 * Create point data from flights
 */
export function createPointData(flights) {
  // Limit points for performance
  const limitedFlights = flights.slice(0, MAX_POINTS);

  return limitedFlights.map(flight => ({
    lat: flight.latitude,
    lng: flight.longitude,
    altitude: (flight.altitude || 10000) / 1000000, // Normalize altitude for rendering
    size: getPointSize(flight),
    color: getPointColor(flight),
    flight: flight, // Attach flight data for click handler
    label: flight.callsign || flight.icao24
  }));
}

/**
 * Get point size based on altitude
 * Higher altitude = larger point
 */
function getPointSize(flight) {
  const altitude = flight.altitude || 10000;
  const normalized = Math.min(altitude / 12000, 1); // Max around 40,000 ft
  return 0.1 + (normalized * 0.15);
}

/**
 * Get point color based on altitude
 * Low altitude = yellow/orange, High altitude = cyan
 */
function getPointColor(flight) {
  const altitude = flight.altitude || 0;

  if (altitude < 3000) {
    return '#ffaa00'; // Yellow - low altitude (climbing/descending)
  } else if (altitude < 8000) {
    return '#ff6600'; // Orange - medium altitude
  } else {
    return '#7aa2f7'; // Blue - cruising altitude
  }
}

/**
 * Create point data for airports
 */
export function createAirportPointData(airports, options = {}) {
  const {
    showAll = false,
    visibleCodes = null,
    zoom = 1
  } = options;

  const airportArray = Array.from(airports.values());

  // Filter based on zoom level or explicit list
  let filtered = airportArray;

  if (visibleCodes) {
    filtered = airportArray.filter(a => visibleCodes.includes(a.iata));
  } else if (!showAll && zoom > 1.5) {
    // At lower zoom, show only major hubs
    const majorHubs = ['JFK', 'LAX', 'LHR', 'CDG', 'DXB', 'HND', 'SIN', 'SYD'];
    filtered = airportArray.filter(a => majorHubs.includes(a.iata));
  }

  return filtered.map(airport => ({
    lat: airport.lat,
    lng: airport.lng,
    altitude: 0.001,
    size: 0.3,
    color: '#ffffff',
    airport: airport,
    label: airport.iata
  }));
}

/**
 * Create ring/pulse effect data for airports
 */
export function createAirportRingsData(airports, activeCode = null) {
  if (!activeCode) return [];

  const airport = airports.get(activeCode);
  if (!airport) return [];

  return [{
    lat: airport.lat,
    lng: airport.lng,
    maxRadius: 2,
    propagationSpeed: 1,
    repeatPeriod: 2000
  }];
}
