/**
 * Labels layer for cities, airports, and other geographic markers
 *
 * Dynamically shows/hides labels based on zoom level
 */

// Zoom thresholds for label visibility
const ZOOM_THRESHOLDS = {
  AIRPORTS_MAJOR: 2.5,    // Show major hub airports
  STATES: 2.5,            // Show US state names (same as major airports - always visible)
  AIRPORTS_ALL: 1.5,      // Show all airports
  CITIES: 1.2,            // Show city names
  STATES_FULL: 0.6,       // Show full state names when very close
  FLIGHT_LABELS: 0.8      // Show flight callsigns
};

// Major hub airports to always show when zoomed out
const MAJOR_HUBS = [
  'JFK', 'LAX', 'LHR', 'CDG', 'DXB', 'HND', 'SIN', 'SYD',
  'ATL', 'ORD', 'FRA', 'AMS', 'HKG', 'PEK', 'DFW', 'ICN'
];

// US States with centroid coordinates
const US_STATES = [
  { name: 'Alabama', abbr: 'AL', lat: 32.7794, lng: -86.8287 },
  { name: 'Alaska', abbr: 'AK', lat: 64.0685, lng: -152.2782 },
  { name: 'Arizona', abbr: 'AZ', lat: 34.2744, lng: -111.6602 },
  { name: 'Arkansas', abbr: 'AR', lat: 34.8938, lng: -92.4426 },
  { name: 'California', abbr: 'CA', lat: 37.1841, lng: -119.4696 },
  { name: 'Colorado', abbr: 'CO', lat: 38.9972, lng: -105.5478 },
  { name: 'Connecticut', abbr: 'CT', lat: 41.6219, lng: -72.7273 },
  { name: 'Delaware', abbr: 'DE', lat: 38.9896, lng: -75.5050 },
  { name: 'Florida', abbr: 'FL', lat: 28.6305, lng: -82.4497 },
  { name: 'Georgia', abbr: 'GA', lat: 32.6415, lng: -83.4426 },
  { name: 'Hawaii', abbr: 'HI', lat: 20.2927, lng: -156.3737 },
  { name: 'Idaho', abbr: 'ID', lat: 44.3509, lng: -114.6130 },
  { name: 'Illinois', abbr: 'IL', lat: 40.0417, lng: -89.1965 },
  { name: 'Indiana', abbr: 'IN', lat: 39.8942, lng: -86.2816 },
  { name: 'Iowa', abbr: 'IA', lat: 42.0751, lng: -93.4960 },
  { name: 'Kansas', abbr: 'KS', lat: 38.4937, lng: -98.3804 },
  { name: 'Kentucky', abbr: 'KY', lat: 37.5347, lng: -85.3021 },
  { name: 'Louisiana', abbr: 'LA', lat: 31.0689, lng: -91.9968 },
  { name: 'Maine', abbr: 'ME', lat: 45.3695, lng: -69.2428 },
  { name: 'Maryland', abbr: 'MD', lat: 39.0550, lng: -76.7909 },
  { name: 'Massachusetts', abbr: 'MA', lat: 42.2596, lng: -71.8083 },
  { name: 'Michigan', abbr: 'MI', lat: 44.3467, lng: -85.4102 },
  { name: 'Minnesota', abbr: 'MN', lat: 46.2807, lng: -94.3053 },
  { name: 'Mississippi', abbr: 'MS', lat: 32.7364, lng: -89.6678 },
  { name: 'Missouri', abbr: 'MO', lat: 38.3566, lng: -92.4580 },
  { name: 'Montana', abbr: 'MT', lat: 47.0527, lng: -109.6333 },
  { name: 'Nebraska', abbr: 'NE', lat: 41.5378, lng: -99.7951 },
  { name: 'Nevada', abbr: 'NV', lat: 39.3289, lng: -116.6312 },
  { name: 'New Hampshire', abbr: 'NH', lat: 43.6805, lng: -71.5811 },
  { name: 'New Jersey', abbr: 'NJ', lat: 40.1907, lng: -74.6728 },
  { name: 'New Mexico', abbr: 'NM', lat: 34.4071, lng: -106.1126 },
  { name: 'New York', abbr: 'NY', lat: 42.9538, lng: -75.5268 },
  { name: 'North Carolina', abbr: 'NC', lat: 35.5557, lng: -79.3877 },
  { name: 'North Dakota', abbr: 'ND', lat: 47.4501, lng: -100.4659 },
  { name: 'Ohio', abbr: 'OH', lat: 40.2862, lng: -82.7937 },
  { name: 'Oklahoma', abbr: 'OK', lat: 35.5889, lng: -97.4943 },
  { name: 'Oregon', abbr: 'OR', lat: 43.9336, lng: -120.5583 },
  { name: 'Pennsylvania', abbr: 'PA', lat: 40.8781, lng: -77.7996 },
  { name: 'Rhode Island', abbr: 'RI', lat: 41.6762, lng: -71.5562 },
  { name: 'South Carolina', abbr: 'SC', lat: 33.9169, lng: -80.8964 },
  { name: 'South Dakota', abbr: 'SD', lat: 44.4443, lng: -100.2263 },
  { name: 'Tennessee', abbr: 'TN', lat: 35.8580, lng: -86.3505 },
  { name: 'Texas', abbr: 'TX', lat: 31.4757, lng: -99.3312 },
  { name: 'Utah', abbr: 'UT', lat: 39.3055, lng: -111.6703 },
  { name: 'Vermont', abbr: 'VT', lat: 44.0687, lng: -72.6658 },
  { name: 'Virginia', abbr: 'VA', lat: 37.5215, lng: -78.8537 },
  { name: 'Washington', abbr: 'WA', lat: 47.3826, lng: -120.4472 },
  { name: 'West Virginia', abbr: 'WV', lat: 38.6409, lng: -80.6227 },
  { name: 'Wisconsin', abbr: 'WI', lat: 44.6243, lng: -89.9941 },
  { name: 'Wyoming', abbr: 'WY', lat: 42.9957, lng: -107.5512 },
];

let currentLabels = [];

/**
 * Create label data based on current zoom level
 */
export function createLabelData(airports, zoom) {
  const labels = [];

  if (!airports) return labels;

  const airportArray = Array.from(airports.values());

  // Always show state abbreviations (subtle, small, no dot)
  US_STATES.forEach(state => {
    labels.push({
      lat: state.lat,
      lng: state.lng,
      label: state.abbr,
      size: 0.3,
      type: 'state',
      dotRadius: 0
    });
  });

  // At very zoomed out view, show only major hubs
  if (zoom >= ZOOM_THRESHOLDS.AIRPORTS_MAJOR) {
    airportArray
      .filter(a => MAJOR_HUBS.includes(a.iata))
      .forEach(airport => {
        labels.push({
          lat: airport.lat,
          lng: airport.lng,
          label: airport.iata,
          size: 0.45,
          type: 'airport-major'
        });
      });
  }
  // At medium zoom, show all airports
  else if (zoom >= ZOOM_THRESHOLDS.AIRPORTS_ALL) {
    airportArray.forEach(airport => {
      labels.push({
        lat: airport.lat,
        lng: airport.lng,
        label: airport.iata,
        size: MAJOR_HUBS.includes(airport.iata) ? 0.45 : 0.35,
        type: 'airport'
      });
    });
  }
  // At close zoom, show full airport names
  else if (zoom >= ZOOM_THRESHOLDS.CITIES) {
    airportArray.forEach(airport => {
      labels.push({
        lat: airport.lat,
        lng: airport.lng,
        label: `${airport.city} (${airport.iata})`,
        size: 0.4,
        type: 'city'
      });
    });
  }
  // At closest zoom, show detailed info
  else {
    airportArray.forEach(airport => {
      labels.push({
        lat: airport.lat,
        lng: airport.lng,
        label: airport.name,
        size: 0.35,
        type: 'airport-detail'
      });
    });
  }

  return labels;
}

/**
 * Update globe labels based on current zoom level
 */
export function updateLabelsForZoom(globe, altitude, airports) {
  if (!airports) return;

  const newLabels = createLabelData(airports, altitude);

  // Only update if labels changed significantly
  if (labelsChanged(currentLabels, newLabels)) {
    currentLabels = newLabels;
    globe.labelsData(newLabels);
  }
}

/**
 * Check if labels have changed (simple comparison)
 */
function labelsChanged(oldLabels, newLabels) {
  if (oldLabels.length !== newLabels.length) return true;

  // Check first few labels for type change
  for (let i = 0; i < Math.min(5, oldLabels.length); i++) {
    if (oldLabels[i]?.type !== newLabels[i]?.type) return true;
  }

  return false;
}

/**
 * Create flight labels (callsigns) for close zoom
 */
export function createFlightLabels(flights, maxLabels = 50) {
  return flights
    .filter(f => f.callsign)
    .slice(0, maxLabels)
    .map(flight => ({
      lat: flight.latitude,
      lng: flight.longitude,
      label: flight.callsign,
      size: 0.4,
      type: 'flight'
    }));
}

/**
 * Get label color based on type
 */
export function getLabelColor(type) {
  switch (type) {
    case 'airport-major':
      return 'rgba(122, 162, 247, 0.95)';
    case 'airport':
      return 'rgba(122, 162, 247, 0.85)';
    case 'state':
      return 'rgba(120, 130, 150, 0.4)';
    case 'state-full':
      return 'rgba(150, 160, 180, 0.6)';
    case 'city':
      return 'rgba(200, 220, 255, 0.9)';
    case 'airport-detail':
      return 'rgba(150, 180, 220, 0.8)';
    case 'flight':
      return 'rgba(122, 162, 247, 0.9)';
    default:
      return 'rgba(255, 255, 255, 0.7)';
  }
}

/**
 * Create region labels (continents/countries)
 */
export function createRegionLabels() {
  return [
    { lat: 40, lng: -100, label: 'North America', size: 1.2 },
    { lat: -15, lng: -60, label: 'South America', size: 1.2 },
    { lat: 50, lng: 10, label: 'Europe', size: 1.2 },
    { lat: 5, lng: 20, label: 'Africa', size: 1.2 },
    { lat: 35, lng: 100, label: 'Asia', size: 1.2 },
    { lat: -25, lng: 135, label: 'Australia', size: 1.2 },
  ];
}
