/**
 * Globe Theme Configuration
 *
 * =====================================================
 * HOW TO USE: Change the ACTIVE_THEME value below
 * =====================================================
 */

// 👇 CHANGE THIS to switch themes: 'realistic', 'night', 'dark', 'minimal', 'hologram'
export const ACTIVE_THEME = 'minimal';

/**
 * Theme Definitions
 */
export const THEMES = {

  // Classic blue marble Earth
  realistic: {
    name: 'Realistic',
    globeImage: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImage: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    background: 'https://unpkg.com/three-globe/example/img/night-sky.png',
    showAtmosphere: true,
    atmosphereColor: 'rgba(100, 180, 255, 0.4)',
    atmosphereAltitude: 0.15,
    globeColor: null,
    showGlobe: true,
    polygonFill: null,
    polygonStroke: null,
    arcColor: ['rgba(255, 100, 50, 0.8)', 'rgba(255, 200, 100, 0.3)'],
    pointColor: '#ffaa00',
    labelColor: 'rgba(255, 255, 255, 0.9)',
  },

  // Night view with city lights
  night: {
    name: 'Night Lights',
    globeImage: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
    bumpImage: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    background: 'https://unpkg.com/three-globe/example/img/night-sky.png',
    showAtmosphere: true,
    atmosphereColor: 'rgba(0, 212, 255, 0.2)',
    atmosphereAltitude: 0.12,
    globeColor: null,
    showGlobe: true,
    polygonFill: null,
    polygonStroke: null,
    arcColor: ['rgba(0, 212, 255, 0.9)', 'rgba(0, 212, 255, 0.2)'],
    pointColor: '#00ff88',
    labelColor: 'rgba(255, 255, 255, 0.9)',
  },

  // Dark topology - subtle and modern
  dark: {
    name: 'Dark Topology',
    globeImage: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    bumpImage: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    background: 'https://unpkg.com/three-globe/example/img/night-sky.png',
    showAtmosphere: true,
    atmosphereColor: 'rgba(0, 150, 255, 0.15)',
    atmosphereAltitude: 0.1,
    globeColor: null,
    showGlobe: true,
    polygonFill: null,
    polygonStroke: null,
    arcColor: ['rgba(100, 200, 255, 0.8)', 'rgba(100, 200, 255, 0.2)'],
    pointColor: '#00d4ff',
    labelColor: 'rgba(200, 220, 255, 0.9)',
  },

  // Minimal - solid dark sphere with polygon borders (SaaS style)
  minimal: {
    name: 'Minimal SaaS',
    globeImage: null,
    bumpImage: null,
    background: 'https://unpkg.com/three-globe/example/img/night-sky.png',
    showAtmosphere: true,
    atmosphereColor: 'rgba(122, 162, 247, 1)',
    atmosphereAltitude: 0.14,
    globeColor: '#0a0a1a',
    showGlobe: true,
    polygonFill: 'rgba(18, 22, 35, 0.75)',
    polygonStroke: 'rgba(122, 162, 247, 0.4)',
    polygonStrokeWidth: 0.3,
    arcColor: ['rgba(122, 162, 247, 0.4)', 'rgba(122, 162, 247, 0.1)'],
    pointColor: '#7aa2f7',
    labelColor: 'rgba(122, 162, 247, 1)',
  },

  // Hologram - wireframe futuristic look
  hologram: {
    name: 'Hologram',
    globeImage: null,
    bumpImage: null,
    background: '#000008',
    showAtmosphere: true,
    atmosphereColor: 'rgba(0, 255, 200, 0.15)',
    atmosphereAltitude: 0.2,
    globeColor: '#000510',
    showGlobe: true,
    polygonFill: 'rgba(0, 20, 30, 0.6)',
    polygonStroke: 'rgba(0, 255, 200, 0.6)',
    polygonStrokeWidth: 0.5,
    arcColor: ['rgba(0, 255, 200, 1)', 'rgba(255, 0, 150, 0.5)'],
    pointColor: '#ff0088',
    labelColor: 'rgba(0, 255, 200, 1)',
  },

};

/**
 * Get the currently active theme
 */
export function getActiveTheme() {
  return THEMES[ACTIVE_THEME] || THEMES.night;
}
