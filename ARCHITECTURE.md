# SkyPath Architecture

Real-time 3D flight tracker built with vanilla JavaScript and Globe.gl.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Vanilla JavaScript (ES Modules) |
| **3D Engine** | [Globe.gl](https://globe.gl) (Three.js wrapper) |
| **Build Tool** | [Vite](https://vitejs.dev) |
| **Flight Data** | [OpenSky Network API](https://opensky-network.org) |
| **Styling** | CSS3 with Custom Properties |
| **Hosting** | Vercel |

## Project Structure

```
skypath/
├── index.html              # Single-page app entry
├── style.css               # Global styles + responsive breakpoints
├── public/
│   ├── favicon.svg         # App icon
│   └── logo.svg            # Brand logo
└── src/
    ├── main.js             # App orchestration & UI events
    ├── globe.js            # Globe.gl initialization & layers
    ├── filters.js          # Filter state & UI management
    ├── api/
    │   └── opensky.js      # Flight data fetching + demo fallback
    ├── config/
    │   └── themes.js       # Visual theme definitions
    ├── data/
    │   └── airports.js     # Airport database (IATA/coordinates)
    ├── layers/
    │   ├── arcs.js         # Flight path arc generation
    │   ├── points.js       # Aircraft marker points
    │   └── labels.js       # Dynamic zoom-based labels
    └── utils/
        ├── airlines.js     # ICAO→airline name mapping
        ├── solar.js        # Sun position for day/night terminator
        └── helpers.js      # General utilities
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Header    │  │  Stats Panel │  │  Flight Info Box  │  │
│  │  + Search   │  │              │  │                   │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   #globe-container                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │              Globe.gl Instance                  │  │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  │  │
│  │  │  │ Points  │ │  Arcs   │ │    Polygons     │  │  │  │
│  │  │  │ (planes)│ │ (paths) │ │ (borders/states)│  │  │  │
│  │  │  └─────────┘ └─────────┘ └─────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌─────────────┐  ┌──────────────────────────────────┐     │
│  │  Controls   │  │        Filters Sidebar           │     │
│  └─────────────┘  └──────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────┐
│  OpenSky API     │  (or demo fallback)
│  /states/all     │
└────────┬─────────┘
         │ fetch every 10s (desktop) / 30s (mobile)
         ▼
┌──────────────────┐
│   opensky.js     │  Transform API response → flight objects
│   + caching      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   filters.js     │  Apply active filters (country/state/altitude/airline)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    main.js       │  Update UI stats, trigger globe update
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────┐
│    globe.js      │────▶│  layers/*   │  Generate points, arcs, labels
└────────┬─────────┘     └─────────────┘
         │
         ▼
┌──────────────────┐
│    Globe.gl      │  Render to WebGL canvas
│    (Three.js)    │
└──────────────────┘
```

## Key Modules

### main.js
Application entry point and orchestrator:
- Initializes globe and loads airport data
- Sets up UI event listeners (buttons, keyboard shortcuts)
- Manages flight data refresh cycle
- Handles flight click/hover interactions
- Coordinates filter changes

### globe.js
Globe.gl wrapper and configuration:
- Creates and configures the 3D globe instance
- Manages visualization layers (points, arcs, polygons, labels)
- Handles day/night terminator shader
- Exports functions: `initGlobe()`, `updateFlights()`, `highlightFlight()`, `toggleArcs()`

### api/opensky.js
Flight data service:
- Fetches live data from OpenSky Network API
- 10-second cache to reduce API calls
- Automatic fallback to realistic demo data on API failure
- Demo data includes 600+ flights with proper global distribution

### config/themes.js
Visual theme system with 5 presets:
- `realistic` - Blue marble Earth texture
- `night` - City lights view
- `dark` - Subtle topology
- `minimal` - SaaS-style with polygon borders (default)
- `hologram` - Futuristic wireframe

### filters.js
Filter state management:
- Country, US state, airport, altitude, airline filters
- Globe camera focus on filter selection
- Filter toggle UI synchronization
- Exports: `filterFlights()`, `initFilters()`, `getActiveFilters()`

## Globe.gl Layers

| Layer | Purpose | Data Source |
|-------|---------|-------------|
| **Points** | Aircraft positions | OpenSky flight data |
| **Arcs** | Flight paths (sampled) | Origin/destination inference |
| **Polygons** | Country/state borders | Natural Earth GeoJSON |
| **Labels** | Airport codes (zoom-dependent) | Static airport database |

## Mobile Optimizations

The app detects mobile via media query + user agent and applies:

| Optimization | Desktop | Mobile |
|--------------|---------|--------|
| Max flights | Unlimited | 100 |
| Refresh interval | 10 seconds | 30 seconds |
| Flight arcs | Enabled | Disabled |
| Point radius | 0.15 | 0.35 (larger touch targets) |
| Transitions | Enabled | Disabled |
| Day/night terminator | Enabled | Disabled |
| Polygon hover/click | Enabled | Disabled |
| Labels layer | Enabled | Disabled |
| Backdrop blur | Enabled | Disabled |

## API Details

### OpenSky Network
- **Endpoint**: `https://opensky-network.org/api/states/all`
- **Rate limits**: 100 req/day (anonymous), 1000/day (registered)
- **Response**: Array of aircraft state vectors
- **Fields used**: icao24, callsign, origin_country, longitude, latitude, altitude, velocity, heading, vertical_rate, squawk

### Demo Fallback
When API is unavailable, generates ~600 realistic flights:
- Regional distribution across 15 global zones
- Proper airline codes per region
- Transatlantic/transpacific routes
- Realistic altitudes (8,000-12,000m) and speeds

## CSS Architecture

- CSS Custom Properties for theming
- Mobile-first responsive breakpoints: 768px, 420px
- Glassmorphism effects (backdrop-filter on desktop)
- Touch-action: manipulation for mobile tap responsiveness
- Z-index layers: globe(1) → ui-overlay(50) → panels(80-100) → tooltips(150-200)

## Build & Deploy

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

Deployed via Vercel with automatic builds on push.
