import { initGlobe, updateFlights, resetView, toggleArcs, updatePolygonStyles, highlightFlight } from './globe.js';
import { fetchFlights } from './api/opensky.js';
import { loadAirports } from './data/airports.js';
import { initFilters, filterFlights, getActiveFilters, hasActiveFilters, initSearch, setStateFilter, clearStateFilter } from './filters.js';

// DOM Elements
const loadingEl = document.getElementById('loading');
const flightCountEl = document.getElementById('flight-count');
const countryCountEl = document.getElementById('country-count');
const zoomLevelEl = document.getElementById('zoom-level');
const btnReset = document.getElementById('btn-reset');
const btnToggleArcs = document.getElementById('btn-toggle-arcs');
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
}

// Initialize the application
async function init() {
  try {
    // Load static data
    airports = await loadAirports();
    console.log(`Loaded ${airports.size} airports`);

    // Initialize the globe
    globe = await initGlobe('globe-container', {
      onFlightClick: handleFlightClick,
      onFlightHover: handleFlightHover,
      onZoomChange: handleZoomChange,
      onStateClick: handleStateClick,
      airports
    });

    // Set initial zoom display
    handleZoomChange(1.2); // Initial altitude

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
    updateFlights(globe, filteredFlights, airports);

    // Update stats
    if (hasActiveFilters()) {
      flightCountEl.textContent = `${filteredFlights.length} / ${allFlights.length}`;
    } else {
      flightCountEl.textContent = allFlights.length.toLocaleString();
    }

    const countries = new Set(filteredFlights.map(f => f.originCountry).filter(Boolean));
    countryCountEl.textContent = countries.size;
  }
}

// Update flight info panel display (detailed view for clicks)
function showFlightInfo(flight) {
  document.getElementById('info-callsign').textContent = flight.callsign || 'Unknown';
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
  // Show ICAO24 or indicate simulated data
  const isDemo = flight.icao24?.startsWith('demo') || flight.icao24?.startsWith('intl');
  document.getElementById('info-icao').textContent = isDemo ? 'Simulated' : (flight.icao24 || '--');
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

  closeInfoBtn.addEventListener('click', () => {
    flightPinned = false;
    flightInfoEl.classList.add('hidden');
    highlightFlight(null);
  });

  // Click elsewhere unpins flight and clears state filter
  const filtersSidebar = document.getElementById('filters-sidebar');
  document.addEventListener('click', (e) => {
    // Don't unpin if we just clicked a flight point or were dragging
    if (justClickedFlight || isDragging) return;

    // Don't unpin/clear if clicking inside flight info or filters sidebar
    if (flightInfoEl.contains(e.target) ||
        filtersSidebar.contains(e.target) ||
        e.target.id === 'btn-filters' ||
        e.target.closest('#btn-filters') ||
        e.target.closest('#search-container') ||
        e.target.closest('#header')) {
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
