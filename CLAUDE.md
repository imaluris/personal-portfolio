# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static portfolio website with an interactive 3D hero section. No build process — files are served directly as-is. Content is in Italian.

## Development

There is no dev server configured. Serve the project with any static file server, e.g.:

```
npx serve src/
```

or open `src/index.html` directly in a browser (note: module imports require a server, not `file://`).

`npm test` is defined but currently a no-op.

## Architecture

### Entry point

`src/index.html` — single-page layout. Defines an import map loading Three.js and addons from CDN (`unpkg.com`), then loads `js/three-scene.js` as an ES module.

### Three.js scene (`js/three-scene.js`)

The 3D particle animation works in three phases:

1. **Load** — GLTFLoader reads `assets/scene.gltf` + `assets/scene.bin` (1 MB binary, 18 k vertices). The mesh itself is hidden; only its geometry is used.
2. **Sample** — vertices are sliced into ~100 vertical cross-sections; one `SphereGeometry` particle is placed per sample point and grouped under `spheresGroup`.
3. **Animate** — each particle travels from a randomized start position to its final sampled position using `easeOutCubic`. After arrival, the whole `spheresGroup` rotates in response to mouse movement.

Key variables: `spheresGroup` (THREE.Group), `particlesData[]` (per-particle animation state), `mouseX`/`mouseY` (normalized mouse tracking).

Renderer uses `alpha: true` and limits pixel ratio to 2 for performance.

### Styling (`css/animations.css`)

Color palette: black background, cyan `#00d0d3` accent, purple `#5a00a3` / violet `#7c3aed`. Fullscreen flex layout (`100vw × 100vh`). Key animations: `slideIn` (name text), `slideOut` (reveal mask). The stylesheet also contains HUD element styles (circles, lines, dots) that are not currently used in the HTML.

### Assets

`assets/scene.gltf` + `assets/scene.bin` — glTF 2.0 model. The binary file is large (~1 MB); avoid modifying it manually.

## Key constraints

- **No bundler**: all JavaScript must be valid ES2020+ that browsers can run natively. Do not introduce CommonJS (`require`) or build-step-only syntax.
- **Three.js via CDN**: version is pinned to `0.179.1` in the import map inside `index.html`. If upgrading, update both the core and addons URLs together.
- **Static hosting**: no server-side logic. All paths in JS/CSS must be relative or root-relative and work under a static file server.
