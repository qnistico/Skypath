# SkyPath

A real-time 3D flight tracker built with vanilla JavaScript and Globe.gl. Visualize global air traffic on an interactive globe with flight paths, live positions, and detailed flight information.

![SkyPath Screenshot](https://via.placeholder.com/800x450?text=SkyPath+Flight+Tracker)

## Features

- **Real-time Flight Tracking** - Live flight data from OpenSky Network API with automatic refresh
- **Interactive 3D Globe** - Smooth pan, zoom, and rotate controls powered by Globe.gl
- **Flight Information** - Hover for quick info, click for detailed panel with altitude, speed, heading, and coordinates
- **Arc Visualization** - Animated flight paths connecting origin and destination airports
- **Multiple Themes** - Switch between Realistic, Night, Dark, Minimal, and Hologram visual styles
- **Filtering System**
  - Filter by country of origin
  - Filter by US state (with interactive state hover/click)
  - Filter by proximity to airports
- **Location Search** - Search for countries and regions to navigate the globe
- **Zoom Tracking** - Visual indicator showing current zoom level

## Tech Stack

- **Vanilla JavaScript** - No frameworks, just ES modules
- **Globe.gl** - WebGL globe visualization library
- **Three.js** - 3D rendering (via Globe.gl)
- **Vite** - Development server and build tool
- **OpenSky Network API** - Real-time flight data

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/skypath.git
cd skypath

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
skypath/
├── index.html          # Main HTML with UI structure
├── style.css           # All styling
├── vite.config.js      # Vite configuration
├── package.json
└── src/
    ├── main.js         # App initialization and event handling
    ├── globe.js        # Globe.gl setup and rendering
    ├── filters.js      # Filter logic and search functionality
    ├── api/
    │   └── opensky.js  # OpenSky API integration + fallback data
    ├── config/
    │   └── themes.js   # Theme definitions and switching
    ├── data/
    │   └── airports.js # Airport database
    ├── layers/
    │   ├── arcs.js     # Flight path arc rendering
    │   ├── labels.js   # Dynamic label management
    │   └── points.js   # Aircraft position points
    └── utils/
        └── helpers.js  # Utility functions
```

## Configuration

### Changing Themes

Edit `src/config/themes.js` and change the `ACTIVE_THEME` value:

```javascript
// Options: 'realistic', 'night', 'dark', 'minimal', 'hologram'
export const ACTIVE_THEME = 'minimal';
```

### Zoom Controls

Zoom limits are configured in `src/globe.js`:

```javascript
const controls = globe.controls();
controls.minDistance = 113;  // Closest zoom
controls.maxDistance = 500;  // Furthest zoom
```

## API Notes

This project uses the [OpenSky Network API](https://openskynetwork.github.io/opensky-api/) for flight data. The free tier has rate limits, so the app includes fallback demo data when the API is unavailable.

For production use, consider:
- Registering for an OpenSky account for higher rate limits
- Implementing server-side caching
- Using a proxy to handle CORS

## License

MIT

## Acknowledgments

- [Globe.gl](https://globe.gl/) for the amazing 3D globe library
- [OpenSky Network](https://opensky-network.org/) for flight data
- [Natural Earth](https://www.naturalearthdata.com/) for GeoJSON borders
