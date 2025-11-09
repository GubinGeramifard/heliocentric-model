# Heliocentric Solar System

An interactive 3D solar system visualization powered by **Three.js** with bloom post-processing, real astronomical data, and full interactivity. Explore with orbital camera controls, compare planet sizes, run gravity simulations, trace Voyager paths, and discover constellations.

**[Live Demo](https://gubingeramifard.github.io/heliocentric-model/)**

---

## Features

### Rendering
- **Full 3D WebGL** — textured planet spheres with `MeshStandardMaterial`, bump maps, and point lighting
- **Bloom post-processing** — `UnrealBloomPass` for cinematic sun glow
- **Sun corona** — animated particle system radiating outward
- **Sun lens flare** — dynamic sprites responding to camera angle
- **Earth atmosphere** — translucent blue glow halo
- **Earth night lights** — procedural city light overlay on the dark side
- **Saturn, Uranus, Neptune rings** — tilted ring geometry for all ringed planets
- **Elliptical orbits** — real eccentricities for all planets (Kepler's first law)
- **Orbital inclinations** — real inclination angles for each planet
- **Galilean moons** — Io, Europa, Ganymede, Callisto orbiting Jupiter
- **Titan** — Saturn's largest moon
- **Phobos & Deimos** — Mars' two moons
- **Triton** — Neptune's retrograde moon
- **Comet** — highly eccentric orbit with particle tail
- **Asteroid belt** — 800 instanced meshes with varied sizes/shapes
- **Starfield** — 2000 background star particles
- **Constellation overlay** — 8 major constellations with star lines
- **Spacecraft trajectories** — Voyager 1 & 2 flight paths
- **Orbital trails** — colored trail lines behind each planet
- **Intro flyover** — cinematic camera sweep on load

### Interactivity
- **Planet info panels** — click any body for data: mass, diameter, distance, period, moons, temperature, atmosphere, fun facts
- **Click-to-focus** — smooth camera animation to clicked planet
- **Planet quick-nav** — colored dots on left side for instant jumps
- **Search bar** — type to filter and jump to planets (press `/`)
- **Guided tour** — auto-pilot through all planets
- **Speed controls** — play/pause, 0.1x–5x speed slider
- **Orbital camera** — drag to rotate, scroll to zoom, touch support
- **Toggle orbits / trails / constellations / spacecraft paths**
- **Size comparison mode** — planets lined up by size
- **Scale toggle** — switch between aesthetic and realistic orbital distances
- **Gravity simulation** — N-body physics mode (Sun + Jupiter perturbations)
- **Screenshot** — download current view as PNG
- **Picture-in-Picture** — close-up viewport following focused planet
- **Minimap** — top-down orthographic overview
- **Share button** — copies URL with encoded camera position
- **Time display** — Earth years elapsed

### Polish
- **Loading screen** with animated progress bar
- **Local textures** for fast/offline loading
- **Background music** with volume control
- **PWA support** — offline via service worker
- **CI/CD** — GitHub Actions auto-deploys to Pages
- **14 keyboard shortcuts** — Space, M, O, T, N, V, C, K, G, P, F, R, /, Esc
- **Responsive** — desktop, tablet, mobile
- **Accessible** — ARIA labels, keyboard nav, `prefers-reduced-motion`

## Tech Stack

- **Three.js** r128 — WebGL, OrbitControls, EffectComposer, UnrealBloomPass, InstancedMesh
- **HTML5 / CSS3 / Vanilla JS** — no build tools, no frameworks
- **GitHub Actions** — automatic Pages deployment

## Getting Started

```bash
git clone https://github.com/GubinGeramifard/heliocentric-model.git
cd heliocentric-model
python -m http.server 8000   # or: npx serve .
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause / resume |
| `M` | Toggle music |
| `O` | Toggle orbit rings |
| `T` | Toggle trails |
| `N` | Toggle constellations |
| `V` | Toggle Voyager paths |
| `C` | Size comparison |
| `K` | Scale toggle (pretty ↔ realistic) |
| `G` | Guided tour |
| `P` | Screenshot |
| `F` | Picture-in-Picture |
| `R` | Reset camera |
| `/` | Focus search bar |
| `Escape` | Close info panel |

## License

MIT
