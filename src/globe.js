import Globe from 'globe.gl';
import * as THREE from 'three';
import { getActiveTheme } from './config/themes.js';
import { createArcData, createFlightPositionArc } from './layers/arcs.js';
import { createPointData } from './layers/points.js';
import { createLabelData, updateLabelsForZoom } from './layers/labels.js';
import { getSunPosition } from './utils/solar.js';

// Get active theme
const theme = getActiveTheme();

// Globe configuration
const GLOBE_CONFIG = {
  // Initial camera position - centered on US
  initialAltitude: 1,
  initialLat: 38,
  initialLng: -97,
};

// Arc styling (from theme) - subtle dashed lines
const ARC_STYLES = {
  color: () => theme.arcColor,
  altitude: 0.08,
  stroke: 0.15,
  dashLength: 0.15,
  dashGap: 0.1,
  dashAnimateTime: 5000,
};

// Point (aircraft) styling (from theme)
const POINT_STYLES = {
  color: () => theme.pointColor,
  altitude: 0.015,  // Higher than polygons (0.004) to prevent z-fighting
  radius: 0.15,
};

// Label styling (from theme)
const LABEL_STYLES = {
  color: () => theme.labelColor,
  size: 0.8,
  altitude: 0.01,
};

let currentFlights = [];
let onFlightClickCallback = null;
let onFlightHoverCallback = null;
let onStateClickCallback = null;
let onStateHoverCallback = null;
let highlightedFlightId = null;
let hoveredStateId = null;
let selectedStateId = null;
let globeInstance = null;
let currentAirports = null;
let baseArcs = [];

// GeoJSON URLs for borders (for minimal/hologram themes)
const COUNTRIES_GEOJSON_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const US_STATES_GEOJSON_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_1_states_provinces.geojson';

/**
 * Initialize the Globe.gl instance
 */
export async function initGlobe(containerId, options = {}) {
  const container = document.getElementById(containerId);
  const isMobile = options.isMobile || false;

  if (options.onFlightClick) {
    onFlightClickCallback = options.onFlightClick;
  }
  if (options.onFlightHover) {
    onFlightHoverCallback = options.onFlightHover;
  }
  if (options.onStateClick) {
    onStateClickCallback = options.onStateClick;
  }
  if (options.onStateHover) {
    onStateHoverCallback = options.onStateHover;
  }

  const globe = Globe()(container);

  // Apply theme-based globe appearance
  if (theme.globeImage) {
    globe.globeImageUrl(theme.globeImage);
  } else if (theme.globeColor) {
    // Solid color globe (no texture)
    globe.globeImageUrl(null);

    // Access Three.js globe mesh to set color
    setTimeout(() => {
      const globeMesh = globe.scene().children.find(c => c.type === 'Mesh');
      if (globeMesh && globeMesh.material) {
        globeMesh.material.color.set(theme.globeColor);
      }
    }, 100);
  }

  if (theme.bumpImage) {
    globe.bumpImageUrl(theme.bumpImage);
  }

  // Atmosphere
  globe
    .showAtmosphere(theme.showAtmosphere)
    .atmosphereColor(theme.atmosphereColor)
    .atmosphereAltitude(theme.atmosphereAltitude);

  // Apply theme background AFTER globe is configured
  // Use delayed application to prevent Globe.gl from resetting it on refresh
  const applyBackground = () => {
    if (theme.background) {
      if (theme.background.startsWith('#') || theme.background.startsWith('rgb')) {
        globe.backgroundColor(theme.background);
      } else {
        globe.backgroundImageUrl(theme.background);
      }
    }
  };
  applyBackground();
  // Re-apply after a short delay to ensure it persists through Globe.gl's initialization
  setTimeout(applyBackground, 100);
  setTimeout(applyBackground, 500);

  // Store globe instance for highlighting
  globeInstance = globe;

  // Arc layer configuration with highlight support
  globe
    .arcColor(d => getArcColor(d))
    .arcAltitude(ARC_STYLES.altitude)
    .arcStroke(d => {
      if (d.isPositionArc) return 0.4; // Same width as highlighted arc
      if (highlightedFlightId && d.flight?.icao24 === highlightedFlightId) return 0.4;
      return ARC_STYLES.stroke;
    })
    .arcDashLength(ARC_STYLES.dashLength)
    .arcDashGap(ARC_STYLES.dashGap)
    .arcDashAnimateTime(ARC_STYLES.dashAnimateTime)
    .arcsTransitionDuration(0);

  // Point layer configuration (optimized for mobile)
  globe
    .pointColor(POINT_STYLES.color)
    .pointAltitude(POINT_STYLES.altitude)
    .pointRadius(isMobile ? 0.35 : POINT_STYLES.radius)  // Larger touch targets on mobile
    .pointsMerge(false)  // Keep points separate (merging can cause issues)
    .pointsTransitionDuration(isMobile ? 0 : 1000)  // No transitions on mobile
    .onPointClick(handlePointClick)
    .onPointHover(isMobile ? null : handlePointHover);  // No hover on mobile (touch)

  // Label layer configuration (skip on mobile for performance)
  if (!isMobile) {
    globe
      .labelColor(d => d.type === 'state' ? 'rgba(120, 130, 150, 0.4)' : 'rgba(167, 139, 250, 0.6)')
      .labelSize(d => d.size || 0.5)
      .labelAltitude(LABEL_STYLES.altitude)
      .labelDotRadius(d => d.dotRadius !== undefined ? d.dotRadius : 0.3)
      .labelText('label')
      .labelsTransitionDuration(0);
  }

  // Set zoom limits
  const controls = globe.controls();
  controls.minDistance = 113;  // Closest zoom (lower = closer)
  controls.maxDistance = 500;  // Furthest zoom (higher = further away)

  // Load country + US state polygons for themes that need borders
  if (theme.polygonStroke || theme.polygonFill) {
    try {
      let allPolygons;

      if (isMobile) {
        // Mobile: load both countries and US states (same as desktop)
        const [countriesRes, statesRes] = await Promise.all([
          fetch(COUNTRIES_GEOJSON_URL),
          fetch(US_STATES_GEOJSON_URL)
        ]);

        const countries = await countriesRes.json();
        const states = await statesRes.json();

        // Filter out USA from countries (we'll show states instead)
        const countriesFiltered = countries.features.filter(
          f => f.properties.ISO_A2 !== 'US'
        );

        // Filter states to only US states
        const usStates = states.features.filter(
          f => f.properties.iso_a2 === 'US'
        );

        allPolygons = [...countriesFiltered, ...usStates];
      } else {
        // Desktop: load countries + US states
        const [countriesRes, statesRes] = await Promise.all([
          fetch(COUNTRIES_GEOJSON_URL),
          fetch(US_STATES_GEOJSON_URL)
        ]);

        const countries = await countriesRes.json();
        const states = await statesRes.json();

        // Filter out USA from countries (we'll show states instead)
        const countriesFiltered = countries.features.filter(
          f => f.properties.ISO_A2 !== 'US'
        );

        // Filter states to only US states
        const usStates = states.features.filter(
          f => f.properties.iso_a2 === 'US'
        );

        allPolygons = [...countriesFiltered, ...usStates];
      }

      globe
        .polygonsData(allPolygons)
        .polygonCapColor(d => getPolygonCapColor(d))
        .polygonSideColor(() => 'rgba(0,0,0,0)')
        .polygonStrokeColor(d => getPolygonStrokeColor(d))
        .polygonAltitude(0.004)
        .polygonsTransitionDuration(0)
        .onPolygonHover(isMobile ? null : handlePolygonHover)
        .onPolygonClick(isMobile ? null : handlePolygonClick);
    } catch (err) {
      console.warn('Failed to load borders:', err);
    }
  }

  // Add day/night terminator layer (skip on mobile for performance)
  if (!isMobile) {
    addDayNightTerminator(globe);
  }

  // Set initial camera position with smooth entry animation
  // Start zoomed out and rotate in
  globe.pointOfView({
    lat: GLOBE_CONFIG.initialLat + 20,
    lng: GLOBE_CONFIG.initialLng - 40,
    altitude: GLOBE_CONFIG.initialAltitude + 1.5
  }, 0);

  // Animate to final position
  setTimeout(() => {
    globe.pointOfView({
      lat: GLOBE_CONFIG.initialLat,
      lng: GLOBE_CONFIG.initialLng,
      altitude: GLOBE_CONFIG.initialAltitude
    }, 2500);  // 2.5 second smooth animation
  }, 100);

  // Handle zoom changes for dynamic labels and zoom tracker
  // On mobile, debounce to reduce CPU load during rotation
  let zoomTimeout = null;
  globe.controls().addEventListener('change', () => {
    if (isMobile) {
      // Debounce on mobile - only update after rotation stops
      if (zoomTimeout) clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        const altitude = globe.pointOfView().altitude;
        if (options.onZoomChange) {
          options.onZoomChange(altitude);
        }
      }, 150);
    } else {
      const altitude = globe.pointOfView().altitude;
      updateLabelsForZoom(globe, altitude, options.airports);

      if (options.onZoomChange) {
        options.onZoomChange(altitude);
      }
    }
  });

  // Responsive sizing
  window.addEventListener('resize', () => {
    globe.width(container.clientWidth);
    globe.height(container.clientHeight);
  });

  return globe;
}

/**
 * Update flight data on the globe
 */
export function updateFlights(globe, flights, airports) {
  currentFlights = flights;
  currentAirports = airports;

  // Create point data for aircraft positions
  const pointData = createPointData(flights);
  globe.pointsData(pointData);

  // Create arc data for flight paths (sample for performance)
  const arcData = createArcData(flights, airports);
  baseArcs = arcData; // Store base arcs for highlighting

  // If a flight is highlighted, preserve the position arc after refresh
  if (highlightedFlightId && currentAirports) {
    const highlightedFlight = currentFlights.find(f => f.icao24 === highlightedFlightId);
    if (highlightedFlight) {
      const positionArc = createFlightPositionArc(highlightedFlight, currentAirports);
      if (positionArc) {
        globe.arcsData([...arcData, positionArc]);
      } else {
        globe.arcsData(arcData);
      }
    } else {
      // Flight no longer exists in data, clear highlight
      highlightedFlightId = null;
      globe.arcsData(arcData);
    }
  } else {
    globe.arcsData(arcData);
  }

  // Update labels based on current zoom
  const altitude = globe.pointOfView().altitude;
  updateLabelsForZoom(globe, altitude, airports);
}

/**
 * Get arc color based on highlight state
 */
function getArcColor(arc) {
  const isHighlighted = highlightedFlightId && arc.flight?.icao24 === highlightedFlightId;

  // Position arc (from flight's current position to destination) - most prominent
  if (arc.isPositionArc) {
    return ['rgba(250, 200, 100, 1)', 'rgba(250, 150, 50, 0.9)'];
  }

  if (isHighlighted) {
    // Bright highlighted color for airport-to-airport arc
    return ['rgba(167, 139, 250, 0.9)', 'rgba(122, 162, 247, 0.7)'];
  }

  // Default theme color (dimmed if something else is highlighted)
  if (highlightedFlightId) {
    return ['rgba(100, 140, 200, 0.1)', 'rgba(100, 140, 200, 0.02)'];
  }

  return theme.arcColor;
}

/**
 * Highlight a specific flight's arc
 */
export function highlightFlight(flightId) {
  highlightedFlightId = flightId;

  // Trigger arc re-render with new colors
  if (globeInstance) {
    if (flightId && currentAirports) {
      // Find the highlighted flight
      const highlightedFlight = currentFlights.find(f => f.icao24 === flightId);

      if (highlightedFlight) {
        // Create position-to-destination arc for highlighted flight
        const positionArc = createFlightPositionArc(highlightedFlight, currentAirports);

        if (positionArc) {
          // Add position arc to base arcs
          globeInstance.arcsData([...baseArcs, positionArc]);
        } else {
          globeInstance.arcsData([...baseArcs]);
        }
      } else {
        globeInstance.arcsData([...baseArcs]);
      }
    } else {
      // No highlight - restore base arcs
      globeInstance.arcsData([...baseArcs]);
    }
  }
}

/**
 * Handle click on a flight point
 */
function handlePointClick(point) {
  if (onFlightClickCallback && point) {
    onFlightClickCallback(point.flight, 'click');
  }
}

/**
 * Handle hover on a flight point
 */
function handlePointHover(point) {
  if (onFlightHoverCallback) {
    onFlightHoverCallback(point ? point.flight : null, 'hover');
  }
}

/**
 * Get state abbreviation from polygon feature
 */
function getStateAbbr(feature) {
  if (!feature || !feature.properties) return null;
  // US states have postal code or iso_3166_2 like "US-CA"
  return feature.properties.postal || feature.properties.iso_3166_2?.split('-')[1] || null;
}

/**
 * Check if polygon is a US state
 */
function isUSState(feature) {
  if (!feature || !feature.properties) return false;
  return feature.properties.iso_a2 === 'US' || feature.properties.postal != null;
}

/**
 * Get polygon fill color based on hover/selected state
 */
function getPolygonCapColor(feature) {
  const stateAbbr = getStateAbbr(feature);
  const isState = isUSState(feature);

  // Selected state (from filter) - highest priority
  if (isState && selectedStateId && stateAbbr === selectedStateId) {
    return 'rgba(122, 162, 247, 0.2)';
  }

  // Hovered US state (only if no selection, or hovering different state)
  if (isState && hoveredStateId && stateAbbr === hoveredStateId && !selectedStateId) {
    return 'rgba(122, 162, 247, 0.12)';
  }

  // Dim other states when one is selected
  if (isState && selectedStateId && stateAbbr !== selectedStateId) {
    return 'rgba(20, 25, 40, 0.6)';
  }

  return theme.polygonFill || 'rgba(0,0,0,0)';
}

/**
 * Get polygon stroke color based on hover/selected state
 */
function getPolygonStrokeColor(feature) {
  const stateAbbr = getStateAbbr(feature);
  const isState = isUSState(feature);

  // Selected state (from filter) - highest priority
  if (isState && selectedStateId && stateAbbr === selectedStateId) {
    return 'rgba(122, 162, 247, 0.9)';
  }

  // Hovered US state
  if (isState && hoveredStateId && stateAbbr === hoveredStateId && !selectedStateId) {
    return 'rgba(122, 162, 247, 0.6)';
  }

  // Dim other states when one is selected
  if (isState && selectedStateId && stateAbbr !== selectedStateId) {
    return 'rgba(122, 162, 247, 0.1)';
  }

  return theme.polygonStroke || 'rgba(255,255,255,0.2)';
}

/**
 * Handle hover on a polygon (state/country)
 */
function handlePolygonHover(polygon) {
  if (!polygon) {
    hoveredStateId = null;
  } else if (isUSState(polygon)) {
    hoveredStateId = getStateAbbr(polygon);
  } else {
    hoveredStateId = null;
  }

  const isHovering = hoveredStateId !== null;

  // Change cursor to indicate clickable state
  const container = document.getElementById('globe-container');
  if (container) {
    container.style.cursor = isHovering ? 'pointer' : 'grab';
  }

  // Trigger re-render of polygons
  if (globeInstance) {
    globeInstance
      .polygonCapColor(d => getPolygonCapColor(d))
      .polygonStrokeColor(d => getPolygonStrokeColor(d));
  }

  if (onStateHoverCallback) {
    onStateHoverCallback(hoveredStateId);
  }
}

/**
 * Handle click on a polygon (state/country)
 */
function handlePolygonClick(polygon) {
  if (!polygon) return;

  if (isUSState(polygon)) {
    const stateAbbr = getStateAbbr(polygon);
    if (onStateClickCallback && stateAbbr) {
      onStateClickCallback(stateAbbr);
    }
  }
}

/**
 * Reset the globe view to initial position
 */
export function resetView(globe) {
  globe.pointOfView({
    lat: GLOBE_CONFIG.initialLat,
    lng: GLOBE_CONFIG.initialLng,
    altitude: GLOBE_CONFIG.initialAltitude
  }, 1000);
}

/**
 * Toggle arc visibility
 */
export function toggleArcs(globe, enabled) {
  if (enabled) {
    const arcData = createArcData(currentFlights, currentAirports);
    baseArcs = arcData; // Update base arcs cache
    globe.arcsData(arcData);
  } else {
    globe.arcsData([]);
  }
}

/**
 * Get the globe's current point of view
 */
export function getPointOfView(globe) {
  return globe.pointOfView();
}

/**
 * Update polygon styles based on active filters (highlight selected state)
 */
export function updatePolygonStyles(globe, filters) {
  if (!globe) return;

  // Update the selected state ID
  selectedStateId = filters?.state || null;

  // Re-render polygons with new state
  globe
    .polygonCapColor(d => getPolygonCapColor(d))
    .polygonStrokeColor(d => getPolygonStrokeColor(d));
}

/**
 * Add day/night terminator overlay to the globe
 * Creates a semi-transparent sphere that rotates with the sun position
 */
let terminatorMesh = null;

function addDayNightTerminator(globe) {
  // Wait for scene to be ready
  setTimeout(() => {
    const scene = globe.scene();
    if (!scene) return;

    // Create a slightly larger sphere for the night overlay
    const GLOBE_RADIUS = 100; // Globe.gl default radius
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.1, 64, 64);

    // Custom shader material for day/night effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        sunPosition: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunPosition;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 sunDir = normalize(sunPosition);
          float intensity = dot(vNormal, sunDir);

          // Smooth transition at terminator (twilight zone)
          float twilight = smoothstep(-0.1, 0.1, intensity);

          // Night side: dark blue-ish overlay
          vec3 nightColor = vec3(0.02, 0.02, 0.08);
          float nightOpacity = 0.5 * (1.0 - twilight);

          gl_FragColor = vec4(nightColor, nightOpacity);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    });

    terminatorMesh = new THREE.Mesh(geometry, material);
    scene.add(terminatorMesh);

    // Update terminator position immediately
    updateTerminatorPosition();

    // Update terminator position every minute
    setInterval(updateTerminatorPosition, 60000);
  }, 500);
}

/**
 * Update the terminator position based on current sun position
 */
function updateTerminatorPosition() {
  if (!terminatorMesh) return;

  const sunPos = getSunPosition();

  // Convert lat/lng to 3D vector
  const latRad = sunPos.lat * Math.PI / 180;
  const lngRad = sunPos.lng * Math.PI / 180;

  // Sun direction vector (pointing toward the sun)
  const sunDir = new THREE.Vector3(
    Math.cos(latRad) * Math.cos(lngRad),
    Math.sin(latRad),
    Math.cos(latRad) * Math.sin(lngRad)
  );

  terminatorMesh.material.uniforms.sunPosition.value.copy(sunDir);
}
