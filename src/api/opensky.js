/**
 * OpenSky Network API client
 * https://openskynetwork.github.io/opensky-api/
 *
 * Free tier: 100 requests/day (anonymous), 1000/day (registered)
 * Note: CORS can be an issue - falls back to demo data
 */

const OPENSKY_BASE_URL = 'https://opensky-network.org/api';

// Cache to avoid excessive API calls
let flightCache = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 10000; // 10 seconds

// Demo flights for fallback (simulated real positions globally)
// Note: Initialized after REGIONS and LONG_HAUL_ROUTES are defined
let DEMO_FLIGHTS = null;

// Regional flight data for realistic global distribution
const REGIONS = [
  // North America (US focus)
  { name: 'US', minLat: 25, maxLat: 49, minLng: -125, maxLng: -70, density: 120,
    airlines: ['UAL', 'DAL', 'AAL', 'SWA', 'JBU', 'ASA'], country: 'United States' },
  { name: 'Canada', minLat: 45, maxLat: 60, minLng: -130, maxLng: -60, density: 25,
    airlines: ['ACA', 'WJA'], country: 'Canada' },
  { name: 'Mexico', minLat: 16, maxLat: 30, minLng: -115, maxLng: -87, density: 20,
    airlines: ['AMX', 'VOI'], country: 'Mexico' },

  // Europe
  { name: 'Western Europe', minLat: 43, maxLat: 58, minLng: -10, maxLng: 15, density: 80,
    airlines: ['BAW', 'AFR', 'DLH', 'KLM', 'EZY', 'RYR'], country: 'United Kingdom' },
  { name: 'Central Europe', minLat: 46, maxLat: 55, minLng: 10, maxLng: 25, density: 50,
    airlines: ['DLH', 'AUA', 'SWR', 'LOT'], country: 'Germany' },
  { name: 'Southern Europe', minLat: 36, maxLat: 46, minLng: -10, maxLng: 20, density: 40,
    airlines: ['IBE', 'TAP', 'AZA', 'VLG'], country: 'Spain' },
  { name: 'Nordic', minLat: 55, maxLat: 70, minLng: 5, maxLng: 30, density: 25,
    airlines: ['SAS', 'FIN', 'NAX'], country: 'Norway' },
  { name: 'Russia', minLat: 50, maxLat: 65, minLng: 30, maxLng: 140, density: 35,
    airlines: ['AFL', 'SBI', 'SVR'], country: 'Russia' },

  // Asia
  { name: 'East Asia', minLat: 25, maxLat: 45, minLng: 100, maxLng: 145, density: 70,
    airlines: ['CCA', 'CES', 'JAL', 'ANA', 'KAL', 'AAR'], country: 'China' },
  { name: 'Southeast Asia', minLat: -5, maxLat: 25, minLng: 95, maxLng: 125, density: 45,
    airlines: ['SIA', 'THA', 'MAS', 'CPA'], country: 'Singapore' },
  { name: 'South Asia', minLat: 8, maxLat: 35, minLng: 68, maxLng: 92, density: 35,
    airlines: ['AIC', 'IGO', 'SEJ'], country: 'India' },
  { name: 'Middle East', minLat: 20, maxLat: 40, minLng: 35, maxLng: 60, density: 40,
    airlines: ['UAE', 'QTR', 'ETD', 'THY', 'ELY'], country: 'United Arab Emirates' },

  // Other regions
  { name: 'Australia', minLat: -40, maxLat: -12, minLng: 113, maxLng: 154, density: 30,
    airlines: ['QFA', 'JST', 'VOZ'], country: 'Australia' },
  { name: 'South America', minLat: -35, maxLat: 5, minLng: -80, maxLng: -35, density: 35,
    airlines: ['LAN', 'GLO', 'AVA', 'AZU'], country: 'Brazil' },
  { name: 'Africa', minLat: -35, maxLat: 35, minLng: -18, maxLng: 50, density: 25,
    airlines: ['SAA', 'ETH', 'RAM', 'MSR'], country: 'South Africa' },
];

// Transatlantic/Transpacific routes
const LONG_HAUL_ROUTES = [
  // Transatlantic
  { lat: 52, lng: -30, heading: 270, country: 'United States', airline: 'UAL' },
  { lat: 50, lng: -25, heading: 90, country: 'United Kingdom', airline: 'BAW' },
  { lat: 48, lng: -40, heading: 270, country: 'Germany', airline: 'DLH' },
  { lat: 54, lng: -20, heading: 270, country: 'United States', airline: 'DAL' },
  { lat: 46, lng: -35, heading: 90, country: 'France', airline: 'AFR' },
  // Transpacific
  { lat: 45, lng: -160, heading: 270, country: 'Japan', airline: 'JAL' },
  { lat: 40, lng: -150, heading: 90, country: 'United States', airline: 'UAL' },
  { lat: 35, lng: 170, heading: 90, country: 'Australia', airline: 'QFA' },
  { lat: 50, lng: -170, heading: 230, country: 'South Korea', airline: 'KAL' },
  // Middle East - Europe
  { lat: 42, lng: 30, heading: 270, country: 'United Arab Emirates', airline: 'UAE' },
  { lat: 38, lng: 45, heading: 300, country: 'Qatar', airline: 'QTR' },
  // Asia - Australia
  { lat: 5, lng: 115, heading: 180, country: 'Singapore', airline: 'SIA' },
  { lat: -15, lng: 130, heading: 220, country: 'Australia', airline: 'QFA' },
];

function generateDemoFlights() {
  const flights = [];
  let flightIndex = 0;

  // Generate regional flights
  REGIONS.forEach(region => {
    for (let i = 0; i < region.density; i++) {
      const lat = region.minLat + Math.random() * (region.maxLat - region.minLat);
      const lng = region.minLng + Math.random() * (region.maxLng - region.minLng);
      const heading = Math.random() * 360;
      const altitude = 8000 + Math.random() * 4000;
      const velocity = 200 + Math.random() * 50;
      const airline = region.airlines[Math.floor(Math.random() * region.airlines.length)];

      flights.push({
        icao24: `demo${flightIndex.toString().padStart(4, '0')}`,
        callsign: `${airline}${100 + Math.floor(Math.random() * 900)}`,
        originCountry: region.country,
        longitude: lng,
        latitude: lat,
        altitude: altitude,
        onGround: false,
        velocity: velocity,
        heading: heading,
        verticalRate: (Math.random() - 0.5) * 10,
        squawk: null
      });
      flightIndex++;
    }
  });

  // Add long-haul international routes
  LONG_HAUL_ROUTES.forEach((route, i) => {
    flights.push({
      icao24: `intl${i.toString().padStart(3, '0')}`,
      callsign: `${route.airline}${100 + i}`,
      originCountry: route.country,
      longitude: route.lng,
      latitude: route.lat,
      altitude: 11000 + Math.random() * 1000,
      onGround: false,
      velocity: 240 + Math.random() * 20,
      heading: route.heading,
      verticalRate: 0,
      squawk: null
    });
  });

  return flights;
}

// Initialize demo flights now that REGIONS and LONG_HAUL_ROUTES are defined
DEMO_FLIGHTS = generateDemoFlights();

/**
 * Fetch all current flights from OpenSky
 * Returns array of flight objects with position data
 */
export async function fetchFlights(bounds = null) {
  // Check cache
  const now = Date.now();
  if (flightCache.data && (now - flightCache.timestamp) < CACHE_DURATION) {
    return flightCache.data;
  }

  try {
    let url = `${OPENSKY_BASE_URL}/states/all`;

    // Optional: filter by geographic bounds
    if (bounds) {
      const { lamin, lomin, lamax, lomax } = bounds;
      url += `?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    }
    // No bounds = global flights (may be slower but more complete)

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`OpenSky API returned ${response.status}, using demo data`);
      throw new Error(`OpenSky API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.states || data.states.length === 0) {
      console.warn('OpenSky returned no data, using demo data');
      return DEMO_FLIGHTS;
    }

    // Transform OpenSky response to our format
    const flights = data.states
      .filter(state => {
        // Filter out grounded aircraft and those without position
        return !state[8] && state[5] !== null && state[6] !== null;
      })
      .map(state => ({
        icao24: state[0],
        callsign: state[1]?.trim() || null,
        originCountry: state[2],
        longitude: state[5],
        latitude: state[6],
        altitude: state[7] || state[13],
        onGround: state[8],
        velocity: state[9],
        heading: state[10],
        verticalRate: state[11],
        squawk: state[14]
      }));

    console.log(`Loaded ${flights.length} live flights from OpenSky`);

    // Update cache
    flightCache = {
      data: flights,
      timestamp: now
    };

    return flights;

  } catch (error) {
    console.warn('OpenSky API unavailable, using demo data:', error.message);

    // Return demo data as fallback
    return DEMO_FLIGHTS;
  }
}

/**
 * Fetch flights for a specific region (bounding box)
 */
export async function fetchFlightsByRegion(lamin, lomin, lamax, lomax) {
  return fetchFlights({ lamin, lomin, lamax, lomax });
}

/**
 * Get flight route information (origin/destination airports)
 */
export function parseCallsign(callsign) {
  if (!callsign) return { airline: null, flightNumber: null };

  const match = callsign.match(/^([A-Z]{2,3})(\d+)$/);

  if (match) {
    return {
      airline: match[1],
      flightNumber: match[2]
    };
  }

  return { airline: null, flightNumber: callsign };
}
