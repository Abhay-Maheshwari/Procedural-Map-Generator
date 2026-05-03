import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';

/**
 * Create a seeded 2D noise function using simplex noise.
 * @param {string|number} seed - The seed value for deterministic output.
 * @returns {function(number, number): number} A noise function returning values in [-1, 1].
 */
export function createSeededNoise(seed) {
  const prng = seedrandom(seed.toString());
  return createNoise2D(prng);
}

/**
 * Get a single noise value at (x, y) with fractal Brownian motion layering.
 *
 * @param {function} noiseFn - A seeded noise2D function.
 * @param {number} x - Grid x coordinate.
 * @param {number} y - Grid y coordinate.
 * @param {object} options - fBm parameters.
 * @param {number} [options.octaves=4] - Number of octave layers.
 * @param {number} [options.lacunarity=2.0] - Frequency multiplier per octave.
 * @param {number} [options.persistence=0.5] - Amplitude multiplier per octave.
 * @param {number} [options.scale=80] - Base noise scale (higher = more zoomed out).
 * @returns {number} Elevation value normalized to [0, 1].
 */
export function getNoise(noiseFn, x, y, options = {}) {
  const {
    octaves = 4,
    lacunarity = 2.0,
    persistence = 0.5,
    scale = 80,
  } = options;

  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    const sampleX = (x / scale) * frequency;
    const sampleY = (y / scale) * frequency;

    // noiseFn returns [-1, 1]
    value += noiseFn(sampleX, sampleY) * amplitude;

    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  // Normalize from [-maxAmplitude, maxAmplitude] to [0, 1]
  return (value / maxAmplitude + 1) / 2;
}

/**
 * Generate a full 2D heightmap array.
 *
 * @param {number} width - Map width in pixels.
 * @param {number} height - Map height in pixels.
 * @param {string|number} seed - Seed for reproducible generation.
 * @param {object} options - fBm parameters (octaves, lacunarity, persistence, scale).
 * @returns {Float32Array} Flat array of elevation values [0, 1], row-major.
 */
export function generateHeightmap(width, height, seed, options = {}) {
  const noiseFn = createSeededNoise(seed);
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = getNoise(noiseFn, x, y, options);
    }
  }

  return data;
}

// ─── Moisture offset constants ─────────────────────────────
// Large offsets ensure the moisture noise field is spatially
// uncorrelated with the elevation field.
const MOISTURE_OFFSET_X = 5000;
const MOISTURE_OFFSET_Y = 3000;

/**
 * Generate a 2D moisture map, uncorrelated with the elevation heightmap.
 * Uses a different seed variant and offset coordinates.
 *
 * @param {number} width - Map width in pixels.
 * @param {number} height - Map height in pixels.
 * @param {string|number} seed - Base seed (will be modified for independence).
 * @param {object} options - fBm parameters (octaves, lacunarity, persistence, scale).
 * @returns {Float32Array} Flat array of moisture values [0, 1], row-major.
 */
export function generateMoistureMap(width, height, seed, options = {}) {
  // Use a different seed so the PRNG sequence is independent
  const moistureSeed = `${seed}_moisture`;
  const noiseFn = createSeededNoise(moistureSeed);
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = getNoise(
        noiseFn,
        x + MOISTURE_OFFSET_X,
        y + MOISTURE_OFFSET_Y,
        options
      );
    }
  }

  return data;
}
