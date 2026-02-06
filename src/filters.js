/**
 * Filters module for SkyPath
 * Handles state, airport, and country filtering logic
 */

// Countries with flight activity (sorted by region, includes centroid for globe focus)
const COUNTRIES = [
  // North America
  { code: 'US', name: 'United States', lat: 38, lng: -97, zoom: 1 },
  { code: 'CA', name: 'Canada', lat: 56, lng: -106, zoom: 1 },
  { code: 'MX', name: 'Mexico', lat: 23, lng: -102, zoom: 1 },

  // Europe
  { code: 'GB', name: 'United Kingdom', lat: 54, lng: -2, zoom: 1 },
  { code: 'DE', name: 'Germany', lat: 51, lng: 10, zoom: 1 },
  { code: 'FR', name: 'France', lat: 46, lng: 2, zoom: 1 },
  { code: 'ES', name: 'Spain', lat: 40, lng: -4, zoom: 1 },
  { code: 'IT', name: 'Italy', lat: 42, lng: 12, zoom: 1 },
  { code: 'NL', name: 'Netherlands', lat: 52, lng: 5, zoom: 1 },
  { code: 'CH', name: 'Switzerland', lat: 47, lng: 8, zoom: 1 },
  { code: 'AT', name: 'Austria', lat: 47, lng: 14, zoom: 1 },
  { code: 'BE', name: 'Belgium', lat: 50, lng: 4, zoom: 1 },
  { code: 'PL', name: 'Poland', lat: 52, lng: 20, zoom: 1 },
  { code: 'SE', name: 'Sweden', lat: 62, lng: 15, zoom: 1 },
  { code: 'NO', name: 'Norway', lat: 62, lng: 10, zoom: 1 },
  { code: 'FI', name: 'Finland', lat: 64, lng: 26, zoom: 1 },
  { code: 'DK', name: 'Denmark', lat: 56, lng: 10, zoom: 1 },
  { code: 'IE', name: 'Ireland', lat: 53, lng: -8, zoom: 1 },
  { code: 'PT', name: 'Portugal', lat: 39, lng: -8, zoom: 1 },
  { code: 'GR', name: 'Greece', lat: 39, lng: 22, zoom: 1 },
  { code: 'CZ', name: 'Czech Republic', lat: 50, lng: 15, zoom: 1 },
  { code: 'RO', name: 'Romania', lat: 46, lng: 25, zoom: 1 },
  { code: 'HU', name: 'Hungary', lat: 47, lng: 20, zoom: 1 },
  { code: 'RU', name: 'Russia', lat: 60, lng: 100, zoom: 1 },
  { code: 'TR', name: 'Turkey', lat: 39, lng: 35, zoom: 1 },

  // Middle East
  { code: 'AE', name: 'United Arab Emirates', lat: 24, lng: 54, zoom: 1 },
  { code: 'QA', name: 'Qatar', lat: 25, lng: 51, zoom: 1 },
  { code: 'SA', name: 'Saudi Arabia', lat: 24, lng: 45, zoom: 1 },
  { code: 'IL', name: 'Israel', lat: 31, lng: 35, zoom: 1 },

  // Asia
  { code: 'CN', name: 'China', lat: 35, lng: 105, zoom: 1 },
  { code: 'JP', name: 'Japan', lat: 36, lng: 138, zoom: 1 },
  { code: 'KR', name: 'South Korea', lat: 36, lng: 128, zoom: 1 },
  { code: 'IN', name: 'India', lat: 21, lng: 78, zoom: 1 },
  { code: 'SG', name: 'Singapore', lat: 1, lng: 104, zoom: 1 },
  { code: 'TH', name: 'Thailand', lat: 15, lng: 101, zoom: 1 },
  { code: 'MY', name: 'Malaysia', lat: 4, lng: 109, zoom: 1 },
  { code: 'ID', name: 'Indonesia', lat: -2, lng: 118, zoom: 1 },
  { code: 'PH', name: 'Philippines', lat: 13, lng: 122, zoom: 1 },
  { code: 'VN', name: 'Vietnam', lat: 16, lng: 108, zoom: 1 },
  { code: 'HK', name: 'Hong Kong', lat: 22, lng: 114, zoom: 1 },
  { code: 'TW', name: 'Taiwan', lat: 24, lng: 121, zoom: 1 },

  // Oceania
  { code: 'AU', name: 'Australia', lat: -25, lng: 135, zoom: 1 },
  { code: 'NZ', name: 'New Zealand', lat: -41, lng: 174, zoom: 1 },

  // South America
  { code: 'BR', name: 'Brazil', lat: -14, lng: -51, zoom: 1 },
  { code: 'AR', name: 'Argentina', lat: -34, lng: -64, zoom: 1 },
  { code: 'CL', name: 'Chile', lat: -35, lng: -71, zoom: 1 },
  { code: 'CO', name: 'Colombia', lat: 4, lng: -72, zoom: 1 },
  { code: 'PE', name: 'Peru', lat: -10, lng: -76, zoom: 1 },

  // Africa
  { code: 'ZA', name: 'South Africa', lat: -29, lng: 25, zoom: 1 },
  { code: 'EG', name: 'Egypt', lat: 27, lng: 30, zoom: 1 },
  { code: 'MA', name: 'Morocco', lat: 32, lng: -6, zoom: 1 },
  { code: 'KE', name: 'Kenya', lat: 0, lng: 38, zoom: 1 },
  { code: 'ET', name: 'Ethiopia', lat: 9, lng: 39, zoom: 1 },
  { code: 'NG', name: 'Nigeria', lat: 10, lng: 8, zoom: 1 },
];

// Map country names (from API) to country codes
const COUNTRY_NAME_MAP = {
  'United States': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'France': 'FR',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Belgium': 'BE',
  'Poland': 'PL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Denmark': 'DK',
  'Ireland': 'IE',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Czech Republic': 'CZ',
  'Romania': 'RO',
  'Hungary': 'HU',
  'Russia': 'RU',
  'Turkey': 'TR',
  'United Arab Emirates': 'AE',
  'Qatar': 'QA',
  'Saudi Arabia': 'SA',
  'Israel': 'IL',
  'China': 'CN',
  'Japan': 'JP',
  'South Korea': 'KR',
  'India': 'IN',
  'Singapore': 'SG',
  'Thailand': 'TH',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Vietnam': 'VN',
  'Hong Kong': 'HK',
  'Taiwan': 'TW',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'Morocco': 'MA',
  'Kenya': 'KE',
  'Ethiopia': 'ET',
  'Nigeria': 'NG',
};

// Regions/Continents for search
const REGIONS = [
  { name: 'North America', lat: 40, lng: -100, zoom: 1, type: 'region' },
  { name: 'South America', lat: -15, lng: -60, zoom: 1, type: 'region' },
  { name: 'Europe', lat: 50, lng: 10, zoom: 1, type: 'region' },
  { name: 'Africa', lat: 5, lng: 20, zoom: 1, type: 'region' },
  { name: 'Asia', lat: 35, lng: 100, zoom: 1, type: 'region' },
  { name: 'Australia', lat: -25, lng: 135, zoom: 1, type: 'region' },
  { name: 'Oceania', lat: -20, lng: 150, zoom: 1, type: 'region' },
  { name: 'Middle East', lat: 28, lng: 45, zoom: 1, type: 'region' },
  { name: 'Southeast Asia', lat: 10, lng: 110, zoom: 1, type: 'region' },
  { name: 'Central America', lat: 15, lng: -85, zoom: 1, type: 'region' },
  { name: 'Caribbean', lat: 18, lng: -75, zoom: 1, type: 'region' },
  { name: 'Scandinavia', lat: 62, lng: 15, zoom: 1, type: 'region' },
];

// Airlines for filter dropdown (sorted by name)
const AIRLINES_LIST = [
  { code: 'AAL', name: 'American Airlines' },
  { code: 'ACA', name: 'Air Canada' },
  { code: 'AFR', name: 'Air France' },
  { code: 'ANA', name: 'All Nippon Airways' },
  { code: 'ASA', name: 'Alaska Airlines' },
  { code: 'BAW', name: 'British Airways' },
  { code: 'CCA', name: 'Air China' },
  { code: 'CPA', name: 'Cathay Pacific' },
  { code: 'DAL', name: 'Delta Air Lines' },
  { code: 'DLH', name: 'Lufthansa' },
  { code: 'UAE', name: 'Emirates' },
  { code: 'ETD', name: 'Etihad Airways' },
  { code: 'EVA', name: 'EVA Air' },
  { code: 'EZY', name: 'easyJet' },
  { code: 'JAL', name: 'Japan Airlines' },
  { code: 'JBU', name: 'JetBlue Airways' },
  { code: 'KAL', name: 'Korean Air' },
  { code: 'KLM', name: 'KLM Royal Dutch' },
  { code: 'QFA', name: 'Qantas' },
  { code: 'QTR', name: 'Qatar Airways' },
  { code: 'RYR', name: 'Ryanair' },
  { code: 'SIA', name: 'Singapore Airlines' },
  { code: 'SWA', name: 'Southwest Airlines' },
  { code: 'THY', name: 'Turkish Airlines' },
  { code: 'UAL', name: 'United Airlines' },
  { code: 'VIR', name: 'Virgin Atlantic' },
  { code: 'WJA', name: 'WestJet' },
].sort((a, b) => a.name.localeCompare(b.name));

// US States data for the dropdown
const US_STATES = [
  { abbr: 'AL', name: 'Alabama' },
  { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },
  { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },
  { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },
  { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },
  { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },
  { abbr: 'WY', name: 'Wyoming' },
];

// State bounding boxes (approximate) for filtering flights
const STATE_BOUNDS = {
  'AL': { minLat: 30.2, maxLat: 35.0, minLng: -88.5, maxLng: -84.9 },
  'AK': { minLat: 51.2, maxLat: 71.4, minLng: -179.1, maxLng: -129.9 },
  'AZ': { minLat: 31.3, maxLat: 37.0, minLng: -114.8, maxLng: -109.0 },
  'AR': { minLat: 33.0, maxLat: 36.5, minLng: -94.6, maxLng: -89.6 },
  'CA': { minLat: 32.5, maxLat: 42.0, minLng: -124.4, maxLng: -114.1 },
  'CO': { minLat: 37.0, maxLat: 41.0, minLng: -109.0, maxLng: -102.0 },
  'CT': { minLat: 40.9, maxLat: 42.0, minLng: -73.7, maxLng: -71.8 },
  'DE': { minLat: 38.4, maxLat: 39.8, minLng: -75.8, maxLng: -75.0 },
  'FL': { minLat: 24.5, maxLat: 31.0, minLng: -87.6, maxLng: -80.0 },
  'GA': { minLat: 30.4, maxLat: 35.0, minLng: -85.6, maxLng: -80.8 },
  'HI': { minLat: 18.9, maxLat: 22.2, minLng: -160.2, maxLng: -154.8 },
  'ID': { minLat: 42.0, maxLat: 49.0, minLng: -117.2, maxLng: -111.0 },
  'IL': { minLat: 37.0, maxLat: 42.5, minLng: -91.5, maxLng: -87.5 },
  'IN': { minLat: 37.8, maxLat: 41.8, minLng: -88.1, maxLng: -84.8 },
  'IA': { minLat: 40.4, maxLat: 43.5, minLng: -96.6, maxLng: -90.1 },
  'KS': { minLat: 37.0, maxLat: 40.0, minLng: -102.0, maxLng: -94.6 },
  'KY': { minLat: 36.5, maxLat: 39.1, minLng: -89.6, maxLng: -82.0 },
  'LA': { minLat: 29.0, maxLat: 33.0, minLng: -94.0, maxLng: -89.0 },
  'ME': { minLat: 43.0, maxLat: 47.5, minLng: -71.1, maxLng: -66.9 },
  'MD': { minLat: 38.0, maxLat: 39.7, minLng: -79.5, maxLng: -75.0 },
  'MA': { minLat: 41.2, maxLat: 42.9, minLng: -73.5, maxLng: -69.9 },
  'MI': { minLat: 41.7, maxLat: 48.2, minLng: -90.4, maxLng: -82.4 },
  'MN': { minLat: 43.5, maxLat: 49.4, minLng: -97.2, maxLng: -89.5 },
  'MS': { minLat: 30.2, maxLat: 35.0, minLng: -91.7, maxLng: -88.1 },
  'MO': { minLat: 36.0, maxLat: 40.6, minLng: -95.8, maxLng: -89.1 },
  'MT': { minLat: 45.0, maxLat: 49.0, minLng: -116.0, maxLng: -104.0 },
  'NE': { minLat: 40.0, maxLat: 43.0, minLng: -104.0, maxLng: -95.3 },
  'NV': { minLat: 35.0, maxLat: 42.0, minLng: -120.0, maxLng: -114.0 },
  'NH': { minLat: 42.7, maxLat: 45.3, minLng: -72.6, maxLng: -70.7 },
  'NJ': { minLat: 38.9, maxLat: 41.4, minLng: -75.6, maxLng: -73.9 },
  'NM': { minLat: 31.3, maxLat: 37.0, minLng: -109.0, maxLng: -103.0 },
  'NY': { minLat: 40.5, maxLat: 45.0, minLng: -79.8, maxLng: -71.8 },
  'NC': { minLat: 33.8, maxLat: 36.6, minLng: -84.3, maxLng: -75.5 },
  'ND': { minLat: 45.9, maxLat: 49.0, minLng: -104.0, maxLng: -96.6 },
  'OH': { minLat: 38.4, maxLat: 42.0, minLng: -84.8, maxLng: -80.5 },
  'OK': { minLat: 33.6, maxLat: 37.0, minLng: -103.0, maxLng: -94.4 },
  'OR': { minLat: 42.0, maxLat: 46.3, minLng: -124.6, maxLng: -116.5 },
  'PA': { minLat: 39.7, maxLat: 42.3, minLng: -80.5, maxLng: -74.7 },
  'RI': { minLat: 41.1, maxLat: 42.0, minLng: -71.9, maxLng: -71.1 },
  'SC': { minLat: 32.0, maxLat: 35.2, minLng: -83.4, maxLng: -78.5 },
  'SD': { minLat: 42.5, maxLat: 46.0, minLng: -104.1, maxLng: -96.4 },
  'TN': { minLat: 35.0, maxLat: 36.7, minLng: -90.3, maxLng: -81.6 },
  'TX': { minLat: 25.8, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
  'UT': { minLat: 37.0, maxLat: 42.0, minLng: -114.0, maxLng: -109.0 },
  'VT': { minLat: 42.7, maxLat: 45.0, minLng: -73.4, maxLng: -71.5 },
  'VA': { minLat: 36.5, maxLat: 39.5, minLng: -83.7, maxLng: -75.2 },
  'WA': { minLat: 45.5, maxLat: 49.0, minLng: -124.8, maxLng: -116.9 },
  'WV': { minLat: 37.2, maxLat: 40.6, minLng: -82.6, maxLng: -77.7 },
  'WI': { minLat: 42.5, maxLat: 47.1, minLng: -92.9, maxLng: -86.8 },
  'WY': { minLat: 41.0, maxLat: 45.0, minLng: -111.0, maxLng: -104.0 },
};

// Current filter state
let activeFilters = {
  country: null,
  state: null,
  airport: null,
  minAltitude: null,
  airline: null
};

let onFilterChangeCallback = null;
let globeInstance = null;

/**
 * Initialize filters UI
 */
export function initFilters(airports, onFilterChange, globe) {
  onFilterChangeCallback = onFilterChange;
  globeInstance = globe;

  // Populate country dropdown
  const countrySelect = document.getElementById('filter-country-select');
  if (countrySelect) {
    COUNTRIES.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });
  }

  // Populate state dropdown
  const stateSelect = document.getElementById('filter-state-select');
  US_STATES.forEach(state => {
    const option = document.createElement('option');
    option.value = state.abbr;
    option.textContent = `${state.name} (${state.abbr})`;
    stateSelect.appendChild(option);
  });

  // Populate airport dropdown
  const airportSelect = document.getElementById('filter-airport-select');
  const airportArray = Array.from(airports.values()).sort((a, b) => a.city.localeCompare(b.city));
  airportArray.forEach(airport => {
    const option = document.createElement('option');
    option.value = airport.iata;
    option.textContent = `${airport.city} (${airport.iata})`;
    airportSelect.appendChild(option);
  });

  // Populate airline dropdown
  const airlineSelect = document.getElementById('filter-airline-select');
  if (airlineSelect) {
    AIRLINES_LIST.forEach(airline => {
      const option = document.createElement('option');
      option.value = airline.code;
      option.textContent = airline.name;
      airlineSelect.appendChild(option);
    });
  }

  // Set up event listeners
  setupFilterListeners();
}

/**
 * Get country info by code
 */
export function getCountryInfo(code) {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Set up filter event listeners
 */
function setupFilterListeners() {
  const sidebar = document.getElementById('filters-sidebar');
  const btnFilters = document.getElementById('btn-filters');
  const closeFilters = document.getElementById('close-filters');
  const clearFilters = document.getElementById('clear-filters');

  const countryToggle = document.getElementById('filter-country-toggle');
  const countrySelect = document.getElementById('filter-country-select');
  const countryContent = document.getElementById('country-filter-content');

  const stateToggle = document.getElementById('filter-state-toggle');
  const stateSelect = document.getElementById('filter-state-select');
  const stateContent = document.getElementById('state-filter-content');

  const airportToggle = document.getElementById('filter-airport-toggle');
  const airportSelect = document.getElementById('filter-airport-select');
  const airportContent = document.getElementById('airport-filter-content');

  // Open/close sidebar
  btnFilters.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    btnFilters.classList.toggle('active');
  });

  closeFilters.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    btnFilters.classList.remove('active');
  });

  // Country filter toggle
  if (countryToggle) {
    countryToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      countrySelect.disabled = !enabled;
      countryContent.classList.toggle('enabled', enabled);

      if (!enabled) {
        countrySelect.value = '';
        activeFilters.country = null;
        notifyFilterChange();
      } else if (countrySelect.value) {
        activeFilters.country = countrySelect.value;
        focusOnCountry(countrySelect.value);
        notifyFilterChange();
      }
    });

    // Country select change
    countrySelect.addEventListener('change', (e) => {
      activeFilters.country = e.target.value || null;
      if (e.target.value) {
        focusOnCountry(e.target.value);
      }
      notifyFilterChange();
    });
  }

  // State filter toggle
  stateToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    stateSelect.disabled = !enabled;
    stateContent.classList.toggle('enabled', enabled);

    if (!enabled) {
      stateSelect.value = '';
      activeFilters.state = null;
      notifyFilterChange();
    } else if (stateSelect.value) {
      activeFilters.state = stateSelect.value;
      notifyFilterChange();
    }
  });

  // State select change
  stateSelect.addEventListener('change', (e) => {
    activeFilters.state = e.target.value || null;
    notifyFilterChange();
  });

  // Airport filter toggle
  airportToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    airportSelect.disabled = !enabled;
    airportContent.classList.toggle('enabled', enabled);

    if (!enabled) {
      airportSelect.value = '';
      activeFilters.airport = null;
      notifyFilterChange();
    } else if (airportSelect.value) {
      activeFilters.airport = airportSelect.value;
      notifyFilterChange();
    }
  });

  // Airport select change
  airportSelect.addEventListener('change', (e) => {
    activeFilters.airport = e.target.value || null;
    notifyFilterChange();
  });

  // Altitude filter
  const altitudeToggle = document.getElementById('filter-altitude-toggle');
  const altitudeSlider = document.getElementById('filter-altitude-min');
  const altitudeContent = document.getElementById('altitude-filter-content');
  const altitudeMinLabel = document.getElementById('altitude-min-label');

  if (altitudeToggle && altitudeSlider) {
    altitudeToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      altitudeSlider.disabled = !enabled;
      altitudeContent.classList.toggle('enabled', enabled);

      if (!enabled) {
        altitudeSlider.value = 0;
        altitudeMinLabel.textContent = '0 ft';
        activeFilters.minAltitude = null;
        notifyFilterChange();
      } else {
        activeFilters.minAltitude = parseInt(altitudeSlider.value) * 0.3048; // Convert ft to meters
        notifyFilterChange();
      }
    });

    altitudeSlider.addEventListener('input', (e) => {
      const ft = parseInt(e.target.value);
      altitudeMinLabel.textContent = `${ft.toLocaleString()} ft`;
      activeFilters.minAltitude = ft * 0.3048; // Convert ft to meters
      notifyFilterChange();
    });
  }

  // Airline filter
  const airlineToggle = document.getElementById('filter-airline-toggle');
  const airlineSelect = document.getElementById('filter-airline-select');
  const airlineContent = document.getElementById('airline-filter-content');

  if (airlineToggle && airlineSelect) {
    airlineToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      airlineSelect.disabled = !enabled;
      airlineContent.classList.toggle('enabled', enabled);

      if (!enabled) {
        airlineSelect.value = '';
        activeFilters.airline = null;
        notifyFilterChange();
      } else if (airlineSelect.value) {
        activeFilters.airline = airlineSelect.value;
        notifyFilterChange();
      }
    });

    airlineSelect.addEventListener('change', (e) => {
      activeFilters.airline = e.target.value || null;
      notifyFilterChange();
    });
  }

  // Clear all filters
  clearFilters.addEventListener('click', () => {
    if (countryToggle) {
      countryToggle.checked = false;
      countrySelect.disabled = true;
      countrySelect.value = '';
      countryContent.classList.remove('enabled');
    }

    stateToggle.checked = false;
    stateSelect.disabled = true;
    stateSelect.value = '';
    stateContent.classList.remove('enabled');

    airportToggle.checked = false;
    airportSelect.disabled = true;
    airportSelect.value = '';
    airportContent.classList.remove('enabled');

    // Clear altitude filter
    const altitudeToggle = document.getElementById('filter-altitude-toggle');
    const altitudeSlider = document.getElementById('filter-altitude-min');
    const altitudeContent = document.getElementById('altitude-filter-content');
    const altitudeMinLabel = document.getElementById('altitude-min-label');
    if (altitudeToggle) {
      altitudeToggle.checked = false;
      altitudeSlider.disabled = true;
      altitudeSlider.value = 0;
      altitudeMinLabel.textContent = '0 ft';
      altitudeContent.classList.remove('enabled');
    }

    // Clear airline filter
    const airlineToggle = document.getElementById('filter-airline-toggle');
    const airlineSelect = document.getElementById('filter-airline-select');
    const airlineContent = document.getElementById('airline-filter-content');
    if (airlineToggle) {
      airlineToggle.checked = false;
      airlineSelect.disabled = true;
      airlineSelect.value = '';
      airlineContent.classList.remove('enabled');
    }

    activeFilters.country = null;
    activeFilters.state = null;
    activeFilters.airport = null;
    activeFilters.minAltitude = null;
    activeFilters.airline = null;
    notifyFilterChange();
  });
}

/**
 * Focus globe on selected country
 */
function focusOnCountry(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (country && globeInstance) {
    globeInstance.pointOfView({
      lat: country.lat,
      lng: country.lng,
      altitude: country.zoom
    }, 1000);
  }
}

/**
 * Notify about filter changes
 */
function notifyFilterChange() {
  // Update filter button badge visibility
  const btnFilters = document.getElementById('btn-filters');
  if (btnFilters) {
    const hasFilters = activeFilters.country || activeFilters.state || activeFilters.airport || activeFilters.minAltitude || activeFilters.airline;
    btnFilters.classList.toggle('has-filters', hasFilters);
  }

  if (onFilterChangeCallback) {
    onFilterChangeCallback(activeFilters);
  }
}

/**
 * Filter flights based on active filters
 */
export function filterFlights(flights, airports) {
  if (!activeFilters.country && !activeFilters.state && !activeFilters.airport && !activeFilters.minAltitude && !activeFilters.airline) {
    return flights;
  }

  return flights.filter(flight => {
    // Country filter - check originCountry
    if (activeFilters.country) {
      const flightCountryCode = COUNTRY_NAME_MAP[flight.originCountry];
      if (flightCountryCode !== activeFilters.country) {
        return false;
      }
    }

    // State filter (only applies if US is selected or no country filter)
    if (activeFilters.state) {
      const bounds = STATE_BOUNDS[activeFilters.state];
      if (bounds) {
        const inState = flight.latitude >= bounds.minLat &&
                       flight.latitude <= bounds.maxLat &&
                       flight.longitude >= bounds.minLng &&
                       flight.longitude <= bounds.maxLng;
        if (!inState) return false;
      }
    }

    // Airport filter - check if flight is near the selected airport
    if (activeFilters.airport) {
      const airport = airports.get(activeFilters.airport);
      if (airport) {
        const distance = Math.sqrt(
          Math.pow(flight.latitude - airport.lat, 2) +
          Math.pow(flight.longitude - airport.lng, 2)
        );
        // Within ~300km of airport
        if (distance > 3) return false;
      }
    }

    // Altitude filter - check if flight is above minimum altitude
    if (activeFilters.minAltitude !== null) {
      if (!flight.altitude || flight.altitude < activeFilters.minAltitude) {
        return false;
      }
    }

    // Airline filter - check callsign prefix
    if (activeFilters.airline) {
      const callsignPrefix = flight.callsign?.substring(0, 3).toUpperCase();
      if (callsignPrefix !== activeFilters.airline) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get polygon styling based on active filters
 */
export function getPolygonStyle(feature) {
  const stateAbbr = feature.properties?.postal || feature.properties?.iso_3166_2?.split('-')[1];

  if (activeFilters.state && stateAbbr === activeFilters.state) {
    return {
      fill: 'rgba(122, 162, 247, 0.15)',
      stroke: 'rgba(122, 162, 247, 0.8)'
    };
  }

  if (activeFilters.state && stateAbbr) {
    return {
      fill: 'rgba(20, 25, 40, 0.5)',
      stroke: 'rgba(122, 162, 247, 0.15)'
    };
  }

  return null; // Use default
}

/**
 * Get current active filters
 */
export function getActiveFilters() {
  return { ...activeFilters };
}

/**
 * Check if any filter is active
 */
export function hasActiveFilters() {
  return activeFilters.country !== null || activeFilters.state !== null || activeFilters.airport !== null || activeFilters.minAltitude !== null || activeFilters.airline !== null;
}

/**
 * Set state filter programmatically (from polygon click)
 */
export function setStateFilter(stateAbbr) {
  const stateToggle = document.getElementById('filter-state-toggle');
  const stateSelect = document.getElementById('filter-state-select');
  const stateContent = document.getElementById('state-filter-content');

  if (stateAbbr) {
    // Enable and set the state filter
    stateToggle.checked = true;
    stateSelect.disabled = false;
    stateSelect.value = stateAbbr;
    stateContent.classList.add('enabled');
    activeFilters.state = stateAbbr;
  } else {
    // Clear the state filter
    stateToggle.checked = false;
    stateSelect.disabled = true;
    stateSelect.value = '';
    stateContent.classList.remove('enabled');
    activeFilters.state = null;
  }

  notifyFilterChange();
}

/**
 * Clear state filter (from clicking elsewhere)
 */
export function clearStateFilter() {
  if (activeFilters.state) {
    setStateFilter(null);
  }
}

/**
 * Initialize location search functionality
 */
export function initSearch(globe) {
  globeInstance = globe;

  const searchInput = document.getElementById('location-search');
  const searchResults = document.getElementById('search-results');

  if (!searchInput || !searchResults) return;

  let selectedIndex = -1;
  let currentResults = [];

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    selectedIndex = -1;

    if (query.length < 1) {
      searchResults.classList.add('hidden');
      currentResults = [];
      return;
    }

    currentResults = searchLocations(query);

    if (currentResults.length > 0) {
      renderSearchResults(currentResults, searchResults, selectedIndex);
      searchResults.classList.remove('hidden');
    } else {
      searchResults.classList.add('hidden');
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    if (currentResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
      renderSearchResults(currentResults, searchResults, selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      renderSearchResults(currentResults, searchResults, selectedIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        selectSearchResult(currentResults[selectedIndex], searchInput, searchResults);
      } else if (currentResults.length > 0) {
        selectSearchResult(currentResults[0], searchInput, searchResults);
      }
    } else if (e.key === 'Escape') {
      searchResults.classList.add('hidden');
      searchInput.blur();
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add('hidden');
    }
  });

  // Focus shows results if there are any
  searchInput.addEventListener('focus', () => {
    if (currentResults.length > 0) {
      searchResults.classList.remove('hidden');
    }
  });
}

/**
 * Search locations (countries and regions)
 */
function searchLocations(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];

  // Search regions first
  REGIONS.forEach(region => {
    if (region.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        name: region.name,
        type: 'Region',
        lat: region.lat,
        lng: region.lng,
        zoom: region.zoom
      });
    }
  });

  // Search countries
  COUNTRIES.forEach(country => {
    if (country.name.toLowerCase().includes(lowerQuery) ||
        country.code.toLowerCase() === lowerQuery) {
      results.push({
        name: country.name,
        type: 'Country',
        lat: country.lat,
        lng: country.lng,
        zoom: country.zoom
      });
    }
  });

  // Limit results
  return results.slice(0, 8);
}

/**
 * Render search results dropdown
 */
function renderSearchResults(results, container, selectedIndex) {
  container.innerHTML = results.map((result, index) => `
    <div class="search-result-item${index === selectedIndex ? ' selected' : ''}" data-index="${index}">
      <span class="search-result-name">${result.name}</span>
      <span class="search-result-type">${result.type}</span>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      const searchInput = document.getElementById('location-search');
      selectSearchResult(results[index], searchInput, container);
    });
  });
}

/**
 * Handle search result selection
 */
function selectSearchResult(result, searchInput, searchResults) {
  if (!result || !globeInstance) return;

  // Navigate globe to location
  globeInstance.pointOfView({
    lat: result.lat,
    lng: result.lng,
    altitude: result.zoom
  }, 1000);

  // Update input and close dropdown
  searchInput.value = result.name;
  searchResults.classList.add('hidden');
  searchInput.blur();
}
