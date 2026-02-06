import { initGlobe, updateFlights, resetView, toggleArcs, updatePolygonStyles, highlightFlight } from './globe.js';
import { fetchFlights } from './api/opensky.js';
import { loadAirports } from './data/airports.js';
import { initFilters, filterFlights, getActiveFilters, hasActiveFilters, initSearch, setStateFilter, clearStateFilter } from './filters.js';
import { getAirlineName, formatSquawk } from './utils/airlines.js';

// DOM Elements
const loadingEl = document.getElementById('loading');
const flightCountEl = document.getElementById('flight-count');
const countryCountEl = document.getElementById('country-count');
const zoomLevelEl = document.getElementById('zoom-level');
const btnReset = document.getElementById('btn-reset');
const btnToggleArcs = document.getElementById('btn-toggle-arcs');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnFlightsList = document.getElementById('btn-flights-list');
const btnStats = document.getElementById('btn-stats');
const flightInfoEl = document.getElementById('flight-info');
const closeInfoBtn = document.getElementById('close-info');
const hoverTooltip = document.getElementById('flight-hover-tooltip');

// Zoom limits (matching globe.js controls)
const MIN_ALTITUDE = 0.3;   // Closest zoom (100%)
const MAX_ALTITUDE = 3.5;   // Furthest zoom (0%)

// App state
let globe = null;
let airports = new Map();
let allFlights = []; // Store all flights before filtering
let filteredFlightsCache = []; // Cache for flight list
let updateInterval = null;
let arcsEnabled = true;
let flightPinned = false;
let justClickedFlight = false; // Flag to prevent immediate unpin after clicking a flight
let mouseX = 0;
let mouseY = 0;
let mouseDownX = 0;
let mouseDownY = 0;
let isDragging = false;

// Handle zoom level changes - convert altitude to percentage
function handleZoomChange(altitude) {
  // Invert: low altitude = high zoom %, high altitude = low zoom %
  const zoomPercent = Math.round(
    Math.max(0, Math.min(100, ((MAX_ALTITUDE - altitude) / (MAX_ALTITUDE - MIN_ALTITUDE)) * 100))
  );
  zoomLevelEl.textContent = `${zoomPercent}%`;

  // Update URL state
  updateURLState();
}

// URL State Management
function updateURLState() {
  if (!globe) return;
  const pov = globe.pointOfView();
  const params = new URLSearchParams();
  params.set('lat', pov.lat.toFixed(2));
  params.set('lng', pov.lng.toFixed(2));
  params.set('alt', pov.altitude.toFixed(2));
  window.history.replaceState({}, '', `?${params.toString()}`);
}

function loadURLState() {
  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get('lat'));
  const lng = parseFloat(params.get('lng'));
  const alt = parseFloat(params.get('alt'));

  if (!isNaN(lat) && !isNaN(lng) && !isNaN(alt)) {
    return { lat, lng, altitude: alt };
  }
  return null;
}

// Initialize the application
async function init() {
  try {
    // Load static data
    airports = await loadAirports();
    console.log(`Loaded ${airports.size} airports`);

    // Check for URL state
    const urlState = loadURLState();

    // Initialize the globe
    globe = await initGlobe('globe-container', {
      onFlightClick: handleFlightClick,
      onFlightHover: handleFlightHover,
      onZoomChange: handleZoomChange,
      onStateClick: handleStateClick,
      airports
    });

    // Apply URL state if present
    if (urlState) {
      globe.pointOfView(urlState, 0);
    }

    // Set initial zoom display
    handleZoomChange(globe.pointOfView().altitude);

    // Initialize filters (pass globe for country focus feature)
    initFilters(airports, handleFilterChange, globe);

    // Initialize location search
    initSearch(globe);

    // Initial flight data fetch
    await refreshFlights();

    // Hide loading screen
    loadingEl.classList.add('hidden');

    // Set up auto-refresh (every 10 seconds)
    updateInterval = setInterval(refreshFlights, 10000);

    // Set up UI event listeners
    setupEventListeners();

    // Set up keyboard shortcuts
    setupKeyboardShortcuts();

  } catch (error) {
    console.error('Failed to initialize:', error);
    loadingEl.querySelector('p').textContent = 'Failed to load. Please refresh.';
  }
}

// Fetch and display flight data
async function refreshFlights() {
  try {
    allFlights = await fetchFlights();

    if (allFlights && allFlights.length > 0) {
      // Apply filters
      const filteredFlights = filterFlights(allFlights, airports);
      filteredFlightsCache = filteredFlights;

      updateFlights(globe, filteredFlights, airports);

      // Update stats
      if (hasActiveFilters()) {
        flightCountEl.textContent = `${filteredFlights.length} / ${allFlights.length}`;
      } else {
        flightCountEl.textContent = allFlights.length.toLocaleString();
      }

      // Count unique countries
      const countries = new Set(filteredFlights.map(f => f.originCountry).filter(Boolean));
      countryCountEl.textContent = countries.size;

      // Update flight list if open
      updateFlightsList();
      // Update stats if open
      updateStatsPanel();
    }
  } catch (error) {
    console.error('Failed to refresh flights:', error);
  }
}

// Handle filter changes
function handleFilterChange(filters) {
  console.log('Filters changed:', filters);

  // Update polygon styles for state highlighting
  if (typeof updatePolygonStyles === 'function') {
    updatePolygonStyles(globe, filters);
  }

  // Re-filter and display flights
  if (allFlights.length > 0) {
    const filteredFlights = filterFlights(allFlights, airports);
    filteredFlightsCache = filteredFlights;
    updateFlights(globe, filteredFlights, airports);

    // Update stats
    if (hasActiveFilters()) {
      flightCountEl.textContent = `${filteredFlights.length} / ${allFlights.length}`;
    } else {
      flightCountEl.textContent = allFlights.length.toLocaleString();
    }

    const countries = new Set(filteredFlights.map(f => f.originCountry).filter(Boolean));
    countryCountEl.textContent = countries.size;

    // Update panels
    updateFlightsList();
    updateStatsPanel();
  }
}

// Update flight info panel display (detailed view for clicks)
function showFlightInfo(flight) {
  document.getElementById('info-callsign').textContent = flight.callsign || 'Unknown';

  // Show airline name if available
  const airlineEl = document.getElementById('info-airline');
  const airlineName = getAirlineName(flight.callsign);
  if (airlineName) {
    airlineEl.textContent = airlineName;
    airlineEl.style.display = 'block';
  } else {
    airlineEl.style.display = 'none';
  }

  document.getElementById('info-origin').textContent = flight.originCountry || '--';
  document.getElementById('info-destination').textContent = flight.destination || 'Est.';
  document.getElementById('info-altitude').textContent = flight.altitude
    ? `${Math.round(flight.altitude * 3.281).toLocaleString()} ft`
    : '--';
  document.getElementById('info-speed').textContent = flight.velocity
    ? `${Math.round(flight.velocity * 2.237)} mph`
    : '--';
  document.getElementById('info-heading').textContent = flight.heading != null
    ? `${Math.round(flight.heading)}°`
    : '--';
  document.getElementById('info-vertical').textContent = flight.verticalRate != null
    ? `${flight.verticalRate > 0 ? '+' : ''}${Math.round(flight.verticalRate * 196.85)} ft/min`
    : '--';

  // Show squawk code with emergency highlighting
  const squawkEl = document.getElementById('info-squawk');
  const squawkData = formatSquawk(flight.squawk);
  if (squawkData) {
    squawkEl.textContent = squawkData.meaning
      ? `${squawkData.code} (${squawkData.meaning})`
      : squawkData.code;
    squawkEl.classList.toggle('emergency', squawkData.isEmergency);
  } else {
    squawkEl.textContent = '--';
    squawkEl.classList.remove('emergency');
  }

  document.getElementById('info-coords').textContent = flight.latitude && flight.longitude
    ? `${flight.latitude.toFixed(2)}°, ${flight.longitude.toFixed(2)}°`
    : '--';

  flightInfoEl.classList.remove('hidden');
}

// Handle flight click - pins the flight info and highlights arc
function handleFlightClick(flight) {
  if (!flight) {
    flightPinned = false;
    flightInfoEl.classList.add('hidden');
    highlightFlight(null);
    return;
  }

  // Set flag to prevent document click from immediately unpinning
  justClickedFlight = true;
  setTimeout(() => { justClickedFlight = false; }, 100);

  flightPinned = true;
  hideHoverTooltip(); // Hide hover tooltip when clicking
  showFlightInfo(flight);
  highlightFlight(flight.icao24);
}

// Update hover tooltip content and position
function showHoverTooltip(flight) {
  document.getElementById('tooltip-callsign').textContent = flight.callsign || 'Unknown';
  document.getElementById('tooltip-origin').textContent = flight.originCountry || '--';
  document.getElementById('tooltip-destination').textContent = flight.destination || 'Est.';
  document.getElementById('tooltip-altitude').textContent = flight.altitude
    ? `${Math.round(flight.altitude * 3.281).toLocaleString()} ft`
    : '--';
  document.getElementById('tooltip-speed').textContent = flight.velocity
    ? `${Math.round(flight.velocity * 2.237)} mph`
    : '--';

  // Position tooltip near cursor
  hoverTooltip.style.left = `${mouseX}px`;
  hoverTooltip.style.top = `${mouseY}px`;
  hoverTooltip.classList.remove('hidden');
}

// Hide hover tooltip
function hideHoverTooltip() {
  hoverTooltip.classList.add('hidden');
}

// Handle flight hover - shows tooltip near cursor
function handleFlightHover(flight) {
  if (flight) {
    showHoverTooltip(flight);
    // Only highlight on hover if nothing is pinned
    if (!flightPinned) {
      highlightFlight(flight.icao24);
    }
  } else {
    hideHoverTooltip();
    if (!flightPinned) {
      highlightFlight(null);
    }
  }
}

// Handle state click - set state filter
function handleStateClick(stateAbbr) {
  if (stateAbbr) {
    setStateFilter(stateAbbr);
  }
}

// Fullscreen toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    btnFullscreen?.classList.add('active');
  } else {
    document.exitFullscreen();
    btnFullscreen?.classList.remove('active');
  }
}

// Flight List Panel
function toggleFlightsList() {
  const panel = document.getElementById('flights-list-panel');
  panel.classList.toggle('hidden');
  btnFlightsList?.classList.toggle('active');
  if (!panel.classList.contains('hidden')) {
    updateFlightsList();
  }
}

function updateFlightsList() {
  const panel = document.getElementById('flights-list-panel');
  if (panel.classList.contains('hidden')) return;

  const content = document.getElementById('flights-list-content');
  const searchInput = document.getElementById('flights-search');
  const sortSelect = document.getElementById('flights-sort');

  let flights = [...filteredFlightsCache];

  // Apply search filter
  const searchTerm = searchInput?.value?.toLowerCase() || '';
  if (searchTerm) {
    flights = flights.filter(f =>
      f.callsign?.toLowerCase().includes(searchTerm) ||
      getAirlineName(f.callsign)?.toLowerCase().includes(searchTerm)
    );
  }

  // Sort
  const sortBy = sortSelect?.value || 'callsign';
  flights.sort((a, b) => {
    switch (sortBy) {
      case 'altitude':
        return (b.altitude || 0) - (a.altitude || 0);
      case 'speed':
        return (b.velocity || 0) - (a.velocity || 0);
      case 'airline':
        return (getAirlineName(a.callsign) || '').localeCompare(getAirlineName(b.callsign) || '');
      default:
        return (a.callsign || '').localeCompare(b.callsign || '');
    }
  });

  // Limit to 100 flights for performance
  flights = flights.slice(0, 100);

  content.innerHTML = flights.map(f => `
    <div class="flight-list-item" data-icao="${f.icao24}">
      <span class="flight-list-callsign">${f.callsign || 'N/A'}</span>
      <span class="flight-list-airline">${getAirlineName(f.callsign) || f.originCountry || '--'}</span>
      <span class="flight-list-altitude">${f.altitude ? Math.round(f.altitude * 3.281).toLocaleString() + ' ft' : '--'}</span>
    </div>
  `).join('');

  // Add click handlers
  content.querySelectorAll('.flight-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const icao = item.dataset.icao;
      const flight = filteredFlightsCache.find(f => f.icao24 === icao);
      if (flight) {
        handleFlightClick(flight);
        // Pan to flight
        globe.pointOfView({
          lat: flight.latitude,
          lng: flight.longitude,
          altitude: 0.5
        }, 1000);
      }
    });
  });
}

// Stats Panel
function toggleStatsPanel() {
  const panel = document.getElementById('stats-dashboard');
  panel.classList.toggle('hidden');
  btnStats?.classList.toggle('active');
  if (!panel.classList.contains('hidden')) {
    updateStatsPanel();
  }
}

function updateStatsPanel() {
  const panel = document.getElementById('stats-dashboard');
  if (panel.classList.contains('hidden')) return;

  const flights = filteredFlightsCache;

  // Top Airlines
  const airlineCounts = {};
  flights.forEach(f => {
    const airline = getAirlineName(f.callsign);
    if (airline) {
      airlineCounts[airline] = (airlineCounts[airline] || 0) + 1;
    }
  });
  const topAirlines = Object.entries(airlineCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxAirlineCount = topAirlines[0]?.[1] || 1;

  document.getElementById('top-airlines').innerHTML = topAirlines.map(([name, count]) => `
    <div class="stat-bar">
      <span class="stat-bar-label">${name}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" style="width: ${(count / maxAirlineCount) * 100}%"></div>
      </div>
      <span class="stat-bar-value">${count}</span>
    </div>
  `).join('') || '<p style="color: var(--text-secondary); font-size: 0.8rem;">No airline data</p>';

  // Altitude Distribution
  const altitudeRanges = {
    '0-10k ft': 0,
    '10-20k ft': 0,
    '20-30k ft': 0,
    '30-40k ft': 0,
    '40k+ ft': 0
  };
  flights.forEach(f => {
    const altFt = (f.altitude || 0) * 3.281;
    if (altFt < 10000) altitudeRanges['0-10k ft']++;
    else if (altFt < 20000) altitudeRanges['10-20k ft']++;
    else if (altFt < 30000) altitudeRanges['20-30k ft']++;
    else if (altFt < 40000) altitudeRanges['30-40k ft']++;
    else altitudeRanges['40k+ ft']++;
  });
  const maxAltCount = Math.max(...Object.values(altitudeRanges)) || 1;

  document.getElementById('altitude-chart').innerHTML = Object.entries(altitudeRanges).map(([range, count]) => `
    <div class="stat-bar">
      <span class="stat-bar-label">${range}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" style="width: ${(count / maxAltCount) * 100}%"></div>
      </div>
      <span class="stat-bar-value">${count}</span>
    </div>
  `).join('');

  // Flights by Country
  const countryCounts = {};
  flights.forEach(f => {
    if (f.originCountry) {
      countryCounts[f.originCountry] = (countryCounts[f.originCountry] || 0) + 1;
    }
  });
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCountryCount = topCountries[0]?.[1] || 1;

  document.getElementById('country-chart').innerHTML = topCountries.map(([name, count]) => `
    <div class="stat-bar">
      <span class="stat-bar-label">${name}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" style="width: ${(count / maxCountryCount) * 100}%"></div>
      </div>
      <span class="stat-bar-value">${count}</span>
    </div>
  `).join('');
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key.toLowerCase()) {
      case 'r':
        resetView(globe);
        break;
      case 'escape':
        // Close all panels
        flightInfoEl.classList.add('hidden');
        flightPinned = false;
        highlightFlight(null);
        document.getElementById('flights-list-panel')?.classList.add('hidden');
        document.getElementById('stats-dashboard')?.classList.add('hidden');
        document.getElementById('filters-sidebar')?.classList.add('hidden');
        btnFlightsList?.classList.remove('active');
        btnStats?.classList.remove('active');
        document.getElementById('btn-filters')?.classList.remove('active');
        break;
      case 'a':
        arcsEnabled = !arcsEnabled;
        toggleArcs(globe, arcsEnabled);
        btnToggleArcs?.classList.toggle('active', arcsEnabled);
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'l':
        toggleFlightsList();
        break;
      case 's':
        toggleStatsPanel();
        break;
      case 'arrowleft':
        globe.controls().autoRotate = false;
        const povL = globe.pointOfView();
        globe.pointOfView({ ...povL, lng: povL.lng - 10 }, 300);
        break;
      case 'arrowright':
        globe.controls().autoRotate = false;
        const povR = globe.pointOfView();
        globe.pointOfView({ ...povR, lng: povR.lng + 10 }, 300);
        break;
      case 'arrowup':
        globe.controls().autoRotate = false;
        const povU = globe.pointOfView();
        globe.pointOfView({ ...povU, lat: Math.min(85, povU.lat + 10) }, 300);
        break;
      case 'arrowdown':
        globe.controls().autoRotate = false;
        const povD = globe.pointOfView();
        globe.pointOfView({ ...povD, lat: Math.max(-85, povD.lat - 10) }, 300);
        break;
    }
  });
}

// Set up UI event listeners
function setupEventListeners() {
  // Track mouse position for hover tooltip and drag detection
  document.addEventListener('mousedown', (e) => {
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    isDragging = false;
  });

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Detect if user is dragging (moved more than 5px)
    const dx = Math.abs(mouseX - mouseDownX);
    const dy = Math.abs(mouseY - mouseDownY);
    if (dx > 5 || dy > 5) {
      isDragging = true;
    }

    // Update tooltip position if visible
    if (!hoverTooltip.classList.contains('hidden')) {
      hoverTooltip.style.left = `${mouseX}px`;
      hoverTooltip.style.top = `${mouseY}px`;
    }
  });

  btnReset.addEventListener('click', () => {
    resetView(globe);
  });

  btnToggleArcs.addEventListener('click', () => {
    arcsEnabled = !arcsEnabled;
    toggleArcs(globe, arcsEnabled);
    btnToggleArcs.classList.toggle('active', arcsEnabled);
  });

  btnFullscreen?.addEventListener('click', toggleFullscreen);
  btnFlightsList?.addEventListener('click', toggleFlightsList);
  btnStats?.addEventListener('click', toggleStatsPanel);

  // Close buttons for panels
  document.getElementById('close-flights-list')?.addEventListener('click', () => {
    document.getElementById('flights-list-panel')?.classList.add('hidden');
    btnFlightsList?.classList.remove('active');
  });

  document.getElementById('close-stats')?.addEventListener('click', () => {
    document.getElementById('stats-dashboard')?.classList.add('hidden');
    btnStats?.classList.remove('active');
  });

  // Flight list search and sort
  document.getElementById('flights-search')?.addEventListener('input', updateFlightsList);
  document.getElementById('flights-sort')?.addEventListener('change', updateFlightsList);

  closeInfoBtn.addEventListener('click', () => {
    flightPinned = false;
    flightInfoEl.classList.add('hidden');
    highlightFlight(null);
  });

  // Fullscreen change handler
  document.addEventListener('fullscreenchange', () => {
    btnFullscreen?.classList.toggle('active', !!document.fullscreenElement);
  });

  // Click elsewhere unpins flight and clears state filter
  const filtersSidebar = document.getElementById('filters-sidebar');
  document.addEventListener('click', (e) => {
    // Don't unpin if we just clicked a flight point or were dragging
    if (justClickedFlight || isDragging) return;

    // Don't unpin/clear if clicking inside flight info, filters sidebar, or panels
    if (flightInfoEl.contains(e.target) ||
        filtersSidebar.contains(e.target) ||
        e.target.closest('#flights-list-panel') ||
        e.target.closest('#stats-dashboard') ||
        e.target.id === 'btn-filters' ||
        e.target.closest('#btn-filters') ||
        e.target.closest('#search-container') ||
        e.target.closest('#header') ||
        e.target.closest('#controls')) {
      return;
    }

    // Unpin flight on any other click (including canvas/globe)
    if (flightPinned) {
      flightPinned = false;
      flightInfoEl.classList.add('hidden');
      highlightFlight(null);
    }

    // Clear state filter if clicking on globe (not on a state)
    // State clicks are handled by handleStateClick, so this catches empty clicks
    const activeFilters = getActiveFilters();
    if (activeFilters.state && e.target.closest('#globe-container')) {
      // Small delay to let polygon click handler fire first
      setTimeout(() => {
        // Only clear if no new state was selected
        const currentFilters = getActiveFilters();
        if (currentFilters.state === activeFilters.state) {
          clearStateFilter();
        }
      }, 50);
    }
  });
}

// Start the app
init();
