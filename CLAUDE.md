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

### Styling (`css/`)

`css/style.css` contains no rules: it only `@import`s the other files, in cascade order (the order matters). The index is what `index.html` links.

- `base/` — `reset.css` (box-sizing, body), `cursor.css` (custom cursor, disabled on touch)
- `layout/` — `sections.css` (3D canvas + sections container), `side-nav.css`, `scroll-indicators.css`
- `components/` — `section-label.css`, `modal.css`, `cookie-banner.css`
- `sections/` — one file per section: `home.css`, `projects.css`, `projects-stack.css` (diagonal 3D stack, desktop only), `techstack.css`, `contact.css`

Each file keeps its own responsive `@media` rules at the bottom. New styles go in the file of the section/component they belong to; a new file must also be added to `style.css`.

Color palette: black background, cyan `#00d0d3` accent, purple `#5a00a3` / violet `#7c3aed`. Fullscreen flex layout (`100vw × 100vh`). Key animations: `slideIn` (name text), `slideOut` (reveal mask), both in `sections/home.css`. That file also contains HUD element styles (circles, lines, dots) that are not currently used in the HTML.

### Projects stack (`js/projects-stack.js`, `js/diagonal-stack/`)

On desktop (>768px) the `.project-card` elements of the Projects section become an infinite diagonal 3D stack (virtual scroll, own spring physics, no libraries). On mobile (≤768px) nothing changes: the paged grid stays.

- `projects-stack.js` mounts/unmounts the stack on the breakpoint and moves the existing cards into it (they go back to their `.projects-page` on unmount). It is imported by `scroll.js`.
- In the Projects section the wheel only moves the cards (`scroll.js` ignores it there); you leave via the mouse icon or the side nav.
- `diagonal-stack/config.js` holds every number to tweak (card size, angle, spacing, curve, hover lift). `stack.js` builds the scene, `card.js` adopts a card, `input.js` handles wheel/touch/keys.
- Clicking a card still opens the modal (`js/modal.js`, unchanged).

### Assets

`assets/scene.gltf` + `assets/scene.bin` — glTF 2.0 model. The binary file is large (~1 MB); avoid modifying it manually.

## Key constraints

- **No bundler**: all JavaScript must be valid ES2020+ that browsers can run natively. Do not introduce CommonJS (`require`) or build-step-only syntax.
- **Three.js via CDN**: version is pinned to `0.179.1` in the import map inside `index.html`. If upgrading, update both the core and addons URLs together.
- **Static hosting**: no server-side logic. All paths in JS/CSS must be relative or root-relative and work under a static file server.
