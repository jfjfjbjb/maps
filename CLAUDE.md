# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive map demo using Vue 3 + TypeScript + Vite with OpenLayers. The project lives in the `openlayers/` subdirectory.

## Commands

```bash
cd openlayers

# Development
npm run dev          # Start Vite dev server

# Build
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build
```

## Architecture

### Map Stack
- **OpenLayers** (`ol`) - Core mapping library (v10+)
- **Tile Layer** - Currently uses AutoNavi raster tiles (高德地图)
- **Boundary Layer** - `WebGLVectorLayer` for GPU-accelerated GeoJSON rendering
- **Boundary Data Source** - Ali DataV API: `https://geo.datav.aliyun.com/areas_v3/bound/{code}_full.json`

### Key Composables

| Composable | Purpose |
|------------|---------|
| `useControls` | Map controls (Zoom, Rotate) |
| `useBoundaryLayer` | Administrative boundary layers (China/province/city) |
| `useSchoolAnnotation` | School markers (currently commented out) |
| `useMapSchoolQuery` | Viewport-based school query (currently commented out) |

### Boundary Layer

The `useBoundaryLayer` composable handles administrative boundaries:
- Uses `WebGLVectorLayer` for GPU-accelerated rendering (important for performance with many polygons)
- Fetches GeoJSON from Ali DataV API
- Implements in-memory caching to avoid re-fetching
- `ADMIN_CODES` export contains province/city codes (e.g., `510000` = Sichuan, `510100` = Chengdu)

### Important Patterns

1. **Map initialization** - Map initializes in `MapContainer.vue` on `rendercomplete` event (not `load` event)
2. **Layer zIndex** - Boundary layer uses zIndex:5 to render above base tiles
3. **Projection** - Uses EPSG:3857 (Web Mercator) for display, data is EPSG:4326 (WGS84)
4. **Cleanup** - All composables return a `dispose()` function for cleanup on unmount

### Build Output

Production build goes to `openlayers/dist/`. The `index.html` at root loads the built app.
