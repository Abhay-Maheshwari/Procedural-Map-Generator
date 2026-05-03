import * as d3 from 'd3';
import { getBiome, applyElevationShading } from './biomes.js';
import { detectCoastlines, simulateRivers } from './rivers.js';
import { generateName } from './names.js';

/**
 * Render the map using a hybrid Canvas (base) and SVG (overlays) approach.
 */
export function renderMap(container, heightmap, moistureMap, width, height, displaySize = 640, callbacks = {}) {
  const cellSize = Math.max(1, displaySize / Math.max(width, height));
  const svgWidth = width * cellSize;
  const svgHeight = height * cellSize;

  // Clear container
  d3.select(container).selectAll('*').remove();

  // 1. Create Canvas for the base tiles (Performance Pass)
  const canvas = d3.select(container)
    .append('canvas')
    .attr('width', width)
    .attr('height', height)
    .style('width', `${svgWidth}px`)
    .style('height', `${svgHeight}px`)
    .style('position', 'absolute')
    .style('image-rendering', 'pixelated')
    .style('border-radius', '14px')
    .node();

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // 2. Create SVG for overlays (Rivers, Names, Zoom/Pan)
  const svg = d3.select(container)
    .append('svg')
    .attr('id', 'map-svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .style('position', 'relative')
    .style('z-index', 1);

  const g = svg.append('g').attr('class', 'map-group');

  // Build cells and draw to canvas
  const cells = new Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const elevation = heightmap[i];
      const moisture = moistureMap[i];
      const biome = getBiome(elevation, moisture);
      const color = applyElevationShading(biome.color, elevation);
      
      cells[i] = { x, y, elevation, moisture, biome, color };

      // Update Canvas Pixel Buffer
      const r = parseInt(color.slice(1, 3), 16);
      const g_val = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const offset = i * 4;
      data[offset] = r;
      data[offset + 1] = g_val;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Coastlines
  const coastlineMap = detectCoastlines(heightmap, width, height);
  const coastlineCells = [];
  for (let i = 0; i < coastlineMap.length; i++) {
    if (coastlineMap[i] === 1) {
      const x = i % width;
      const y = Math.floor(i / width);
      coastlineCells.push({ x, y });
    }
  }

  g.selectAll('rect.coast')
    .data(coastlineCells)
    .join('rect')
    .attr('class', 'coast')
    .attr('x', d => d.x * cellSize)
    .attr('y', d => d.y * cellSize)
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('fill', 'rgba(10, 25, 50, 0.35)')
    .attr('shape-rendering', 'crispEdges');

  // Rivers
  const rivers = simulateRivers(heightmap, width, height);
  const lineGenerator = d3.line()
    .x(d => d.x * cellSize + cellSize / 2)
    .y(d => d.y * cellSize + cellSize / 2)
    .curve(d3.curveBasis);

  const riverGroup = g.append('g').attr('class', 'rivers');
  rivers.forEach(river => {
    riverGroup.append('path')
      .datum(river)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#4a90c4')
      .attr('stroke-width', Math.max(cellSize * 0.4, 2))
      .attr('opacity', 0.8);
  });

  // 3. Procedural Place Names (New Feature)
  const places = [];
  // Add 3-5 town names
  for(let j=0; j<5; j++) {
    const idx = Math.floor(Math.random() * cells.length);
    const cell = cells[idx];
    if (cell.elevation > 0.4 && cell.elevation < 0.7) {
       places.push({ ...cell, name: generateName('town', cell.elevation + j), type: 'town' });
    }
  }
  // Add 2 mountain names
  for(let k=0; k<2; k++) {
    const idx = Math.floor(Math.random() * cells.length);
    const cell = cells[idx];
    if (cell.elevation > 0.8) {
       places.push({ ...cell, name: generateName('mountain', cell.elevation + k), type: 'mountain' });
    }
  }

  const labelGroup = g.append('g').attr('class', 'labels');
  labelGroup.selectAll('text')
    .data(places)
    .join('text')
    .attr('x', d => d.x * cellSize)
    .attr('y', d => d.y * cellSize - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .style('text-shadow', '0 1px 2px black')
    .text(d => d.name);

  // Zoom/Pan
  const zoom = d3.zoom()
    .scaleExtent([0.5, 20])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
      // Sync Canvas with SVG Zoom
      const { x, y, k } = event.transform;
      canvas.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
      canvas.style.transformOrigin = '0 0';
    });

  svg.call(zoom);

  // Interaction
  const overlay = svg.append('rect')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .attr('fill', 'transparent')
    .style('cursor', 'crosshair');

  overlay.on('mousemove', function(event) {
    if (!callbacks.onHover) return;
    const [mx, my] = d3.pointer(event, g.node());
    const cellX = Math.floor(mx / cellSize);
    const cellY = Math.floor(my / cellSize);
    if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height) {
      const cell = cells[cellY * width + cellX];
      callbacks.onHover(cell, coastlineMap[cellY * width + cellX] === 1, event);
    }
  });

  overlay.on('mouseleave', () => callbacks.onLeave && callbacks.onLeave());

  return { svg: svg.node(), canvas, cells, rivers };
}

// Keep helper functions
export function getElevationAt(heightmap, x, y, width) {
  if (x < 0 || y < 0 || x >= width) return 0;
  return heightmap[y * width + x] || 0;
}
