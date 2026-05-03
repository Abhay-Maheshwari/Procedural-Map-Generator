# 🗺️ Procedural Map Generator

A high-performance, interactive fantasy world map generator built with Vanilla JavaScript and D3.js. It uses mathematical noise algorithms to simulate realistic terrain, biomes, rivers, and procedural place names.

![Project Preview](https://raw.githubusercontent.com/Abhay-Maheshwari/Procedural-Map-Generator/main/src/assets/hero.png)

## 🚀 Live Demo
[Procedural Map Generator](https://abhay-maheshwari.github.io/Procedural-Map-Generator/) (Replace with your actual deployment link)

## ✨ Features

### 🏔️ Terrain Generation
- **Simplex Noise & fBm**: Multi-octave Fractal Brownian Motion for natural, rugged landscapes.
- **Dual-Pass Noise**: Independent elevation and moisture layers ensure realistic biome distribution.
- **Seed-Based**: Every seed generates a unique, reproducible world.

### 🌿 Biome System
- **15 Unique Biomes**: Based on the Whittaker climate diagram (from Deep Ocean to Snow Peaks).
- **Elevation Shading**: Dynamic lighting that adds 3D depth to mountains and valleys.

### 🌊 Simulation & Details
- **River Flow**: Greedy downhill descent algorithm with smoothed vector paths.
- **Coastline Detection**: Darkened shoreline borders for high visual fidelity.
- **Procedural Naming**: Syllable-combination engine for deterministic town and mountain names.

### 🛠️ Interactive Tools
- **D3 Zoom & Pan**: Fluid exploration from world-scale down to individual cells.
- **Floating Tooltips**: Real-time data on elevation, moisture, and biome type.
- **High-Performance Rendering**: Hybrid Canvas/SVG engine supporting up to 512px resolutions.
- **Shareable URLs**: Map settings are encoded into query parameters for easy sharing.
- **Export Options**: Download your creations as high-quality **SVG** or **PNG** files.

## 🛠️ Tech Stack
- **Core**: JavaScript (ES6+), HTML5, CSS3
- **Visualization**: [D3.js](https://d3js.org/) (SVG Overlays & Zoom)
- **Algorithms**: [Simplex-Noise](https://github.com/jwagner/simplex-noise.js), [Seedrandom](https://github.com/davidbau/seedrandom)
- **Export**: [File-saver.js](https://github.com/eligrey/FileSaver.js/)
- **Build Tool**: [Vite](https://vitejs.dev/)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Abhay-Maheshwari/Procedural-Map-Generator.git
   cd Procedural-Map-Generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📂 Project Structure
```text
├── public/              # Static assets (favicons, icons)
├── src/
│   ├── assets/          # Project images
│   ├── biomes.js        # Whittaker classification & shading
│   ├── main.js          # App state & UI wiring
│   ├── names.js         # Procedural name generator
│   ├── noise.js         # Simplex & fBm implementation
│   ├── renderer.js      # Hybrid Canvas/SVG engine
│   ├── rivers.js        # River & Coastline simulation
│   └── style.css        # Premium dark theme styles
├── index.html           # Main entry point
└── package.json         # Project configuration
```

## 📜 How it Works
1. **Noise Pass**: The engine generates an elevation map and a moisture map using Simplex noise.
2. **Biome Mapping**: Each cell's `(elevation, moisture)` value is mapped to a biome color.
3. **Simulation**: The engine detects coastlines and simulates water flowing downhill to form rivers.
4. **Rendering**: The base tiles are rendered to a **Canvas** for speed, while interactive elements (rivers, names) are drawn as **SVG** elements via D3 for crispness.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ by [Abhay Maheshwari](https://github.com/Abhay-Maheshwari)
