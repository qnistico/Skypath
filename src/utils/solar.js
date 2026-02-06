/**
 * Solar position calculations for day/night terminator
 * Based on simplified solar position algorithm
 */

/**
 * Calculate the sun's position (latitude/longitude of subsolar point)
 * @returns {{ lat: number, lng: number }} Sun position
 */
export function getSunPosition() {
  const now = new Date();

  // Julian date calculation
  const JD = now.getTime() / 86400000 + 2440587.5;

  // Days since J2000.0
  const D = JD - 2451545.0;

  // Mean longitude of the sun (degrees)
  const L = (280.461 + 0.9856474 * D) % 360;

  // Mean anomaly of the sun (degrees)
  const g = ((357.528 + 0.9856003 * D) % 360) * Math.PI / 180;

  // Ecliptic longitude (degrees)
  const lambda = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);

  // Obliquity of the ecliptic (degrees)
  const epsilon = 23.439 - 0.0000004 * D;

  // Sun's declination (latitude of subsolar point)
  const declination = Math.asin(
    Math.sin(epsilon * Math.PI / 180) * Math.sin(lambda * Math.PI / 180)
  ) * 180 / Math.PI;

  // Equation of time (minutes)
  const B = ((360 / 365) * (D - 81)) * Math.PI / 180;
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Solar noon offset
  const solarNoonOffset = EoT / 60;

  // Current UTC hours as decimal
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

  // Longitude of subsolar point
  // At 12:00 UTC, sun is at 0° longitude
  // Each hour = 15° of longitude
  const longitude = ((12 - utcHours - solarNoonOffset) * 15) % 360;

  // Normalize longitude to -180 to 180
  const normalizedLng = longitude > 180 ? longitude - 360 : longitude;

  return {
    lat: declination,
    lng: normalizedLng
  };
}

/**
 * Generate points along the terminator line
 * @param {number} numPoints - Number of points to generate
 * @returns {Array<{lat: number, lng: number}>} Terminator points
 */
export function getTerminatorPoints(numPoints = 180) {
  const sun = getSunPosition();
  const points = [];

  // Convert sun position to radians
  const sunLatRad = sun.lat * Math.PI / 180;
  const sunLngRad = sun.lng * Math.PI / 180;

  // Generate points around the terminator great circle
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Calculate terminator point
    // The terminator is 90° away from the subsolar point
    const lat = Math.asin(
      Math.cos(sunLatRad) * Math.sin(angle)
    ) * 180 / Math.PI;

    const lng = (sun.lng + Math.atan2(
      Math.cos(angle),
      -Math.sin(sunLatRad) * Math.sin(angle)
    ) * 180 / Math.PI) % 360;

    const normalizedLng = lng > 180 ? lng - 360 : (lng < -180 ? lng + 360 : lng);

    points.push({ lat, lng: normalizedLng });
  }

  return points;
}

/**
 * Calculate if a point is in daylight or darkness
 * @param {number} lat - Point latitude
 * @param {number} lng - Point longitude
 * @returns {boolean} True if in daylight
 */
export function isInDaylight(lat, lng) {
  const sun = getSunPosition();

  // Convert to radians
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const sunLatRad = sun.lat * Math.PI / 180;
  const sunLngRad = sun.lng * Math.PI / 180;

  // Calculate angular distance from subsolar point
  const cosAngle = Math.sin(latRad) * Math.sin(sunLatRad) +
                   Math.cos(latRad) * Math.cos(sunLatRad) * Math.cos(lngRad - sunLngRad);

  // If angle < 90°, point is in daylight
  return cosAngle > 0;
}
