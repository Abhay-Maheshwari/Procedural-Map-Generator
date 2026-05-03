import './style.css';
import { generateHeightmap, generateMoistureMap } from './noise.js';
import { renderMap } from './renderer.js';
import { BIOMES } from './biomes.js';
import { saveAs } from 'file-saver';

// ─── DOM Elements ──────────────────────────────────────────
const svgWrapper = document.getElementById('svg-wrapper');
const seedInput = document.getElementById('seed-input');
const randomSeedBtn = document.getElementById('random-seed-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const shareBtn = document.getElementById('share-btn');
const octavesInput = document.getElementById('octaves-input');
const octavesValue = document.getElementById('octaves-value');
const lacunarityInput = document.getElementById('lacunarity-input');
const lacunarityValue = document.getElementById('lacunarity-value');
const persistenceInput = document.getElementById('persistence-input');
const persistenceValue = document.getElementById('persistence-value');
const scaleInput = document.getElementById('scale-input');
const scaleValue = document.getElementById('scale-value');
const renderTimeEl = document.getElementById('render-time');
const pixelCountEl = document.getElementById('pixel-count');
const riverCountEl = document.getElementById('river-count');

// Export Buttons
const exportSvgBtn = document.getElementById('export-svg-btn');
const exportPngBtn = document.getElementById('export-png-btn');

// Tooltip elements
const tooltip = document.getElementById('tooltip');
const tooltipBiome = document.getElementById('tooltip-biome');
const tooltipCoords = document.getElementById('tooltip-coords');
const tooltipElev = document.getElementById('tooltip-elev');
const tooltipMoist = document.getElementById('tooltip-moist');

// Size selector buttons
const sizeBtns = document.querySelectorAll('.size-btn');

// Zoom hint
const zoomHint = document.getElementById('zoom-hint');

// ─── State ─────────────────────────────────────────────────
let currentHeightmap = null;
let currentMoisture = null;
let currentCells = null;
let currentWidth = 128;
let currentHeight = 128;
let zoomHintVisible = true;

// ─── URL Parameters (Shareable URL) ────────────────────────
function updateURL() {
  const params = new URLSearchParams({
    seed: seedInput.value,
    size: currentWidth,
    octaves: octavesInput.value,
    lac: lacunarityInput.value,
    pers: persistenceInput.value,
    scale: scaleInput.value
  });
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('seed')) seedInput.value = params.get('seed');
  if (params.has('size')) {
    currentWidth = parseInt(params.get('size'));
    currentHeight = currentWidth;
    sizeBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.size) === currentWidth);
    });
  }
  if (params.has('octaves')) {
    octavesInput.value = params.get('octaves');
    octavesValue.textContent = octavesInput.value;
  }
  if (params.has('lac')) {
    lacunarityInput.value = params.get('lac');
    lacunarityValue.textContent = parseFloat(lacunarityInput.value).toFixed(1);
  }
  if (params.has('pers')) {
    persistenceInput.value = params.get('pers');
    persistenceValue.textContent = parseFloat(persistenceInput.value).toFixed(2);
  }
  if (params.has('scale')) {
    scaleInput.value = params.get('scale');
    scaleValue.textContent = scaleInput.value;
  }
}

// ─── Build Biome Legend ────────────────────────────────────
function buildLegend() {
  const legendEl = document.getElementById('biome-legend');
  legendEl.innerHTML = '';
  const displayOrder = ['DEEP_OCEAN', 'OCEAN', 'SHALLOW_WATER', 'BEACH', 'DESERT', 'GRASSLAND', 'SHRUBLAND', 'TEMPERATE_FOREST', 'RAINFOREST', 'TAIGA', 'TUNDRA', 'BARE', 'SCORCHED', 'MOUNTAIN', 'SNOW'];
  for (const key of displayOrder) {
    const biome = BIOMES[key];
    const item = document.createElement('div');
    item.className = 'legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.backgroundColor = biome.color;
    const label = document.createElement('span');
    label.className = 'legend-label';
    label.textContent = biome.name;
    item.appendChild(swatch);
    item.appendChild(label);
    legendEl.appendChild(item);
  }
}

// ─── Generate & Render ─────────────────────────────────────
function generate() {
  const seed = seedInput.value || '42';
  const options = {
    octaves: parseInt(octavesInput.value),
    lacunarity: parseFloat(lacunarityInput.value),
    persistence: parseFloat(persistenceInput.value),
    scale: parseFloat(scaleInput.value),
  };

  const t0 = performance.now();
  currentHeightmap = generateHeightmap(currentWidth, currentHeight, seed, options);
  currentMoisture = generateMoistureMap(currentWidth, currentHeight, seed, options);

  const container = document.getElementById('map-container');
  const maxSize = Math.min(container.clientWidth, container.clientHeight) * 0.88;
  const displaySize = Math.max(256, Math.floor(maxSize));

  const result = renderMap(svgWrapper, currentHeightmap, currentMoisture, currentWidth, currentHeight, displaySize, {
    onHover: handleCellHover,
    onLeave: handleCellLeave,
  });
  currentCells = result.cells;

  const elapsed = performance.now() - t0;
  renderTimeEl.textContent = `${elapsed.toFixed(0)}ms`;
  pixelCountEl.textContent = `${(currentWidth * currentHeight / 1000).toFixed(1)}K`;
  riverCountEl.textContent = `${result.rivers.length}`;

  updateURL();
}

// ─── Tooltip Handlers ──────────────────────────────────────
function handleCellHover(cell, isCoast, event) {
  tooltip.classList.add('visible');
  const container = document.getElementById('map-container');
  const rect = container.getBoundingClientRect();
  let tx = event.clientX - rect.left + 16;
  let ty = event.clientY - rect.top - 10;
  if (tx + 180 > rect.width) tx = event.clientX - rect.left - 190;
  if (ty + 80 > rect.height) ty = event.clientY - rect.top - 80;
  tooltip.style.left = `${tx}px`;
  tooltip.style.top = `${ty}px`;

  const coastTag = isCoast ? ' · Coast' : '';
  tooltipBiome.textContent = cell.biome.name + coastTag;
  tooltipBiome.style.borderLeftColor = cell.biome.color;
  tooltipCoords.textContent = `📍 (${cell.x}, ${cell.y})`;
  tooltipElev.textContent = `⛰️ Elevation: ${(cell.elevation * 100).toFixed(1)}%`;
  tooltipMoist.textContent = `💧 Moisture: ${(cell.moisture * 100).toFixed(1)}%`;
}

function handleCellLeave() {
  tooltip.classList.remove('visible');
}

// ─── Export Functions ──────────────────────────────────────
function exportSVG() {
  const svg = document.getElementById('map-svg');
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, `map_${seedInput.value}.svg`);
}

function exportPNG() {
  const canvas = svgWrapper.querySelector('canvas');
  if (!canvas) return;
  canvas.toBlob((blob) => {
    saveAs(blob, `map_${seedInput.value}.png`);
  });
}

// ─── Event Listeners ───────────────────────────────────────
const debouncedGenerate = () => {
  clearTimeout(window.genTimer);
  window.genTimer = setTimeout(generate, 150);
};

seedInput.addEventListener('input', debouncedGenerate);
randomSeedBtn.addEventListener('click', () => {
  seedInput.value = Math.floor(Math.random() * 999999).toString();
  generate();
});

regenerateBtn.addEventListener('click', generate);

shareBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href);
  shareBtn.textContent = 'Copied!';
  setTimeout(() => shareBtn.textContent = 'Share', 2000);
});

sizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sizeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentWidth = parseInt(btn.dataset.size);
    currentHeight = currentWidth;
    generate();
  });
});

[octavesInput, lacunarityInput, persistenceInput, scaleInput].forEach(input => {
  input.addEventListener('input', () => {
    const display = document.getElementById(`${input.id.replace('-input', '-value')}`);
    if (display) {
       const val = parseFloat(input.value);
       display.textContent = input.step.includes('.') ? val.toFixed(2) : val;
    }
    debouncedGenerate();
  });
});

exportSvgBtn.addEventListener('click', exportSVG);
exportPngBtn.addEventListener('click', exportPNG);

// ─── Initialize ────────────────────────────────────────────
loadFromURL();
buildLegend();
generate();
