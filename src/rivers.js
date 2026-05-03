/**
 * River simulation — flow-downhill pathfinding.
 * Picks the N highest land points and flows water downhill to the ocean.
 */

/**
 * Detect coastline cells — land cells adjacent to water.
 * A cell is a coastline cell if it's land (elevation >= waterLevel)
 * and at least one of its 4-neighbors is water.
 *
 * @param {Float32Array} heightmap - Elevation data [0, 1], row-major.
 * @param {number} width - Map width.
 * @param {number} height - Map height.
 * @param {number} [waterLevel=0.36] - Elevation threshold for water.
 * @returns {Uint8Array} 1 = coastline, 0 = not coastline.
 */
export function detectCoastlines(heightmap, width, height, waterLevel = 0.36) {
  const coastline = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const elev = heightmap[i];

      // Only land cells can be coastline
      if (elev < waterLevel) continue;

      // Check 4-connected neighbors
      const neighbors = [
        x > 0          ? heightmap[i - 1]     : null, // left
        x < width - 1  ? heightmap[i + 1]     : null, // right
        y > 0          ? heightmap[i - width]  : null, // up
        y < height - 1 ? heightmap[i + width]  : null, // down
      ];

      for (const n of neighbors) {
        if (n !== null && n < waterLevel) {
          coastline[i] = 1;
          break;
        }
      }
    }
  }

  return coastline;
}

/**
 * Simulate rivers by flowing downhill from high-elevation source points.
 * Uses a greedy descent: at each cell, move to the lowest neighbor.
 * Stops when reaching water or getting stuck in a local minimum.
 *
 * @param {Float32Array} heightmap - Elevation data [0, 1], row-major.
 * @param {number} width - Map width.
 * @param {number} height - Map height.
 * @param {number} [numRivers=6] - Number of river sources to attempt.
 * @param {number} [waterLevel=0.36] - Elevation below which is considered water.
 * @param {number} [minSourceElevation=0.65] - Minimum elevation for river source.
 * @returns {Array<Array<{x: number, y: number}>>} Array of river paths.
 */
export function simulateRivers(heightmap, width, height, numRivers = 6, waterLevel = 0.36, minSourceElevation = 0.65) {
  // Collect candidate source points (high elevation land)
  const candidates = [];
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const elev = heightmap[y * width + x];
      if (elev >= minSourceElevation) {
        candidates.push({ x, y, elevation: elev });
      }
    }
  }

  // Sort by elevation descending
  candidates.sort((a, b) => b.elevation - a.elevation);

  // Pick spread-out sources — skip candidates too close to existing sources
  const minDistance = Math.max(width, height) * 0.15;
  const sources = [];
  for (const c of candidates) {
    if (sources.length >= numRivers) break;
    const tooClose = sources.some(s => {
      const dx = s.x - c.x;
      const dy = s.y - c.y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });
    if (!tooClose) {
      sources.push(c);
    }
  }

  // Flow each river downhill
  const rivers = [];
  const usedCells = new Set();

  for (const source of sources) {
    const path = flowDownhill(heightmap, width, height, source.x, source.y, waterLevel, usedCells);
    if (path.length >= 4) { // Only keep rivers with meaningful length
      rivers.push(path);
      // Mark cells as used to encourage diverse paths
      for (const p of path) {
        usedCells.add(p.y * width + p.x);
      }
    }
  }

  return rivers;
}

/**
 * Flow a single river path downhill from (startX, startY).
 * Uses 8-connected neighbors and always moves to the lowest one.
 *
 * @param {Float32Array} heightmap
 * @param {number} width
 * @param {number} height
 * @param {number} startX
 * @param {number} startY
 * @param {number} waterLevel
 * @param {Set} usedCells - Cells already used by other rivers (adds cost).
 * @returns {Array<{x: number, y: number}>} The river path.
 */
function flowDownhill(heightmap, width, height, startX, startY, waterLevel, usedCells) {
  const path = [{ x: startX, y: startY }];
  const visited = new Set();
  visited.add(startY * width + startX);

  let cx = startX;
  let cy = startY;
  const maxSteps = width * 2; // Prevent infinite loops

  for (let step = 0; step < maxSteps; step++) {
    const currentElev = heightmap[cy * width + cx];

    // Reached water — river is complete
    if (currentElev < waterLevel) break;

    // Find lowest 8-connected neighbor
    let bestX = -1;
    let bestY = -1;
    let bestElev = currentElev + 0.01; // Small threshold to allow slight plateaus

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const ni = ny * width + nx;
        if (visited.has(ni)) continue;

        let elev = heightmap[ni];
        // Add small penalty for cells used by other rivers to encourage branching
        if (usedCells.has(ni)) elev += 0.02;

        if (elev < bestElev) {
          bestElev = elev;
          bestX = nx;
          bestY = ny;
        }
      }
    }

    // Stuck in local minimum
    if (bestX === -1) break;

    cx = bestX;
    cy = bestY;
    visited.add(cy * width + cx);
    path.push({ x: cx, y: cy });
  }

  return path;
}
