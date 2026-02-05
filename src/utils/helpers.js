/**
 * Utility functions for SkyPath
 */

/**
 * Format altitude for display
 * @param {number} meters - Altitude in meters
 * @returns {string} Formatted altitude string
 */
export function formatAltitude(meters) {
  if (!meters) return '--';
  const feet = Math.round(meters * 3.281);
  return `${feet.toLocaleString()} ft`;
}

/**
 * Format speed for display
 * @param {number} metersPerSecond - Speed in m/s
 * @returns {string} Formatted speed string
 */
export function formatSpeed(metersPerSecond) {
  if (!metersPerSecond) return '--';
  const mph = Math.round(metersPerSecond * 2.237);
  return `${mph.toLocaleString()} mph`;
}

/**
 * Format heading for display
 * @param {number} degrees - Heading in degrees
 * @returns {string} Formatted heading with cardinal direction
 */
export function formatHeading(degrees) {
  if (degrees === null || degrees === undefined) return '--';

  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return `${Math.round(degrees)}° ${cardinals[index]}`;
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Calculate great circle distance between two points (Haversine)
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Sleep for a given duration
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get color based on value in range (for heatmaps)
 */
export function getHeatColor(value, min, max) {
  const normalized = (value - min) / (max - min);

  // Blue -> Cyan -> Green -> Yellow -> Red
  if (normalized < 0.25) {
    return `rgb(0, ${Math.round(normalized * 4 * 255)}, 255)`;
  } else if (normalized < 0.5) {
    return `rgb(0, 255, ${Math.round((1 - (normalized - 0.25) * 4) * 255)})`;
  } else if (normalized < 0.75) {
    return `rgb(${Math.round((normalized - 0.5) * 4 * 255)}, 255, 0)`;
  } else {
    return `rgb(255, ${Math.round((1 - (normalized - 0.75) * 4) * 255)}, 0)`;
  }
}
