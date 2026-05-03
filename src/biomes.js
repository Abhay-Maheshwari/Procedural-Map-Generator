/**
 * Biome classification system inspired by the Whittaker biome diagram.
 * Uses elevation + moisture to determine biome type.
 */

// ─── Biome Definitions ────────────────────────────────────
export const BIOMES = {
  DEEP_OCEAN:    { name: 'Deep Ocean',        color: '#1a3a5c' },
  OCEAN:         { name: 'Ocean',             color: '#2a6495' },
  SHALLOW_WATER: { name: 'Shallow Water',     color: '#3d8abf' },
  BEACH:         { name: 'Beach',             color: '#d4c48a' },
  SCORCHED:      { name: 'Scorched',          color: '#8a8a72' },
  BARE:          { name: 'Bare',              color: '#a0a085' },
  TUNDRA:        { name: 'Tundra',            color: '#b8c4a0' },
  SNOW:          { name: 'Snow',              color: '#e8eadf' },
  DESERT:        { name: 'Desert',            color: '#d4b463' },
  SHRUBLAND:     { name: 'Shrubland',         color: '#8a9e5e' },
  GRASSLAND:     { name: 'Grassland',         color: '#6aaa3a' },
  TEMPERATE_FOREST: { name: 'Temperate Forest', color: '#3a7a2a' },
  TAIGA:         { name: 'Taiga',             color: '#4a6e4a' },
  RAINFOREST:    { name: 'Rainforest',        color: '#1e6030' },
  MOUNTAIN:      { name: 'Mountain',          color: '#7a7a7a' },
};

/**
 * Classify a cell into a biome based on elevation and moisture.
 * Thresholds are tuned for natural-looking results across many seeds.
 *
 * Whittaker-inspired layout:
 *   - Elevation axis: ocean → shore → lowlands → highlands → alpine → peaks
 *   - Moisture axis:  dry → moderate → wet
 *
 * @param {number} elevation - Value in [0, 1].
 * @param {number} moisture  - Value in [0, 1].
 * @returns {object} Biome object with { name, color }.
 */
export function getBiome(elevation, moisture) {
  // ── Water zones ───────────────────────────────────────
  if (elevation < 0.22) return BIOMES.DEEP_OCEAN;
  if (elevation < 0.32) return BIOMES.OCEAN;
  if (elevation < 0.36) return BIOMES.SHALLOW_WATER;

  // ── Shoreline ─────────────────────────────────────────
  if (elevation < 0.40) return BIOMES.BEACH;

  // ── Snow peaks ────────────────────────────────────────
  if (elevation > 0.88) return BIOMES.SNOW;

  // ── Alpine / High elevation (0.75–0.88) ───────────────
  if (elevation > 0.75) {
    if (moisture < 0.25) return BIOMES.SCORCHED;
    if (moisture < 0.50) return BIOMES.BARE;
    if (moisture < 0.75) return BIOMES.TUNDRA;
    return BIOMES.MOUNTAIN;
  }

  // ── Highlands (0.60–0.75) ─────────────────────────────
  if (elevation > 0.60) {
    if (moisture < 0.25) return BIOMES.SHRUBLAND;
    if (moisture < 0.55) return BIOMES.TAIGA;
    return BIOMES.TEMPERATE_FOREST;
  }

  // ── Lowlands (0.40–0.60) ──────────────────────────────
  if (moisture < 0.20) return BIOMES.DESERT;
  if (moisture < 0.40) return BIOMES.GRASSLAND;
  if (moisture < 0.65) return BIOMES.TEMPERATE_FOREST;
  return BIOMES.RAINFOREST;
}

/**
 * Apply elevation-based shading to a hex color.
 * Multiplies the brightness (lightness) by an elevation factor
 * so higher elevations appear brighter and lower ones darker.
 *
 * @param {string} hexColor - Base biome color (e.g. '#3a7a2a').
 * @param {number} elevation - Value in [0, 1].
 * @returns {string} Shaded hex color.
 */
export function applyElevationShading(hexColor, elevation) {
  // Parse hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Shading factor: remap elevation to a brightness multiplier
  // Range: ~0.55 (dark valleys) to ~1.15 (bright peaks)
  const factor = 0.55 + elevation * 0.60;

  // Apply and clamp
  const sr = Math.min(255, Math.max(0, Math.round(r * factor)));
  const sg = Math.min(255, Math.max(0, Math.round(g * factor)));
  const sb = Math.min(255, Math.max(0, Math.round(b * factor)));

  return `#${sr.toString(16).padStart(2, '0')}${sg.toString(16).padStart(2, '0')}${sb.toString(16).padStart(2, '0')}`;
}
