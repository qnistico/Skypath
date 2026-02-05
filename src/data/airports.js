/**
 * Airport data loader and utilities
 *
 * Uses data from OurAirports (public domain)
 * We'll load a curated set of major airports for performance
 */

// Major world airports - curated list for initial display
// Format: [IATA, name, lat, lng, city, country]
const MAJOR_AIRPORTS = [
  // North America
  ['JFK', 'John F. Kennedy', 40.6413, -73.7781, 'New York', 'United States'],
  ['LAX', 'Los Angeles Intl', 33.9425, -118.4081, 'Los Angeles', 'United States'],
  ['ORD', "O'Hare Intl", 41.9742, -87.9073, 'Chicago', 'United States'],
  ['DFW', 'Dallas/Fort Worth', 32.8998, -97.0403, 'Dallas', 'United States'],
  ['DEN', 'Denver Intl', 39.8561, -104.6737, 'Denver', 'United States'],
  ['ATL', 'Hartsfield-Jackson', 33.6407, -84.4277, 'Atlanta', 'United States'],
  ['SFO', 'San Francisco Intl', 37.6213, -122.379, 'San Francisco', 'United States'],
  ['SEA', 'Seattle-Tacoma', 47.4502, -122.3088, 'Seattle', 'United States'],
  ['MIA', 'Miami Intl', 25.7959, -80.2870, 'Miami', 'United States'],
  ['BOS', 'Logan Intl', 42.3656, -71.0096, 'Boston', 'United States'],
  ['YYZ', 'Toronto Pearson', 43.6777, -79.6248, 'Toronto', 'Canada'],
  ['YVR', 'Vancouver Intl', 49.1967, -123.1815, 'Vancouver', 'Canada'],
  ['MEX', 'Mexico City Intl', 19.4363, -99.0721, 'Mexico City', 'Mexico'],

  // Europe
  ['LHR', 'Heathrow', 51.4700, -0.4543, 'London', 'United Kingdom'],
  ['CDG', 'Charles de Gaulle', 49.0097, 2.5479, 'Paris', 'France'],
  ['FRA', 'Frankfurt', 50.0379, 8.5622, 'Frankfurt', 'Germany'],
  ['AMS', 'Schiphol', 52.3105, 4.7683, 'Amsterdam', 'Netherlands'],
  ['MAD', 'Barajas', 40.4983, -3.5676, 'Madrid', 'Spain'],
  ['FCO', 'Fiumicino', 41.8003, 12.2389, 'Rome', 'Italy'],
  ['MUC', 'Munich', 48.3537, 11.7750, 'Munich', 'Germany'],
  ['ZRH', 'Zurich', 47.4647, 8.5492, 'Zurich', 'Switzerland'],
  ['IST', 'Istanbul', 41.2753, 28.7519, 'Istanbul', 'Turkey'],
  ['DUB', 'Dublin', 53.4264, -6.2499, 'Dublin', 'Ireland'],

  // Asia Pacific
  ['HND', 'Haneda', 35.5494, 139.7798, 'Tokyo', 'Japan'],
  ['NRT', 'Narita', 35.7720, 140.3929, 'Tokyo', 'Japan'],
  ['PEK', 'Beijing Capital', 40.0799, 116.6031, 'Beijing', 'China'],
  ['PVG', 'Pudong', 31.1443, 121.8083, 'Shanghai', 'China'],
  ['HKG', 'Hong Kong Intl', 22.3080, 113.9185, 'Hong Kong', 'China'],
  ['SIN', 'Changi', 1.3644, 103.9915, 'Singapore', 'Singapore'],
  ['ICN', 'Incheon', 37.4602, 126.4407, 'Seoul', 'South Korea'],
  ['BKK', 'Suvarnabhumi', 13.6900, 100.7501, 'Bangkok', 'Thailand'],
  ['SYD', 'Sydney', -33.9399, 151.1753, 'Sydney', 'Australia'],
  ['MEL', 'Melbourne', -37.6690, 144.8410, 'Melbourne', 'Australia'],
  ['DEL', 'Indira Gandhi', 28.5562, 77.1000, 'Delhi', 'India'],
  ['BOM', 'Chhatrapati Shivaji', 19.0896, 72.8656, 'Mumbai', 'India'],

  // Middle East
  ['DXB', 'Dubai Intl', 25.2532, 55.3657, 'Dubai', 'UAE'],
  ['DOH', 'Hamad Intl', 25.2609, 51.6138, 'Doha', 'Qatar'],
  ['AUH', 'Abu Dhabi', 24.4330, 54.6511, 'Abu Dhabi', 'UAE'],
  ['TLV', 'Ben Gurion', 32.0055, 34.8854, 'Tel Aviv', 'Israel'],

  // South America
  ['GRU', 'Guarulhos', -23.4356, -46.4731, 'Sao Paulo', 'Brazil'],
  ['EZE', 'Ezeiza', -34.8222, -58.5358, 'Buenos Aires', 'Argentina'],
  ['BOG', 'El Dorado', 4.7016, -74.1469, 'Bogota', 'Colombia'],
  ['SCL', 'Santiago', -33.3930, -70.7858, 'Santiago', 'Chile'],
  ['LIM', 'Jorge Chavez', -12.0219, -77.1143, 'Lima', 'Peru'],

  // Africa
  ['JNB', 'O.R. Tambo', -26.1392, 28.2460, 'Johannesburg', 'South Africa'],
  ['CPT', 'Cape Town Intl', -33.9715, 18.6021, 'Cape Town', 'South Africa'],
  ['CAI', 'Cairo Intl', 30.1219, 31.4056, 'Cairo', 'Egypt'],
  ['ADD', 'Bole Intl', 8.9779, 38.7993, 'Addis Ababa', 'Ethiopia'],
  ['NBO', 'Jomo Kenyatta', -1.3192, 36.9278, 'Nairobi', 'Kenya'],
];

/**
 * Load airports into a Map for quick lookup
 */
export async function loadAirports() {
  const airports = new Map();

  MAJOR_AIRPORTS.forEach(([iata, name, lat, lng, city, country]) => {
    airports.set(iata, {
      iata,
      name,
      lat,
      lng,
      city,
      country,
      fullName: `${city} (${iata})`
    });
  });

  return airports;
}

/**
 * Get airports as array for rendering
 */
export function getAirportsArray(airports) {
  return Array.from(airports.values());
}

/**
 * Find nearest airport to a given coordinate
 */
export function findNearestAirport(lat, lng, airports) {
  let nearest = null;
  let minDistance = Infinity;

  airports.forEach(airport => {
    const distance = haversineDistance(lat, lng, airport.lat, airport.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = airport;
    }
  });

  return nearest;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Get airports within a bounding box
 */
export function getAirportsInBounds(airports, bounds) {
  const { north, south, east, west } = bounds;

  return Array.from(airports.values()).filter(airport => {
    return airport.lat >= south &&
           airport.lat <= north &&
           airport.lng >= west &&
           airport.lng <= east;
  });
}
