/**
 * Procedural name generation using syllable combination tables.
 */

const SYLLABLES = {
  prefix: ['Aer', 'Bel', 'Crag', 'Dal', 'Eal', 'Fen', 'Gor', 'Hel', 'Isol', 'Jor', 'Kael', 'Lun', 'Mor', 'Nal', 'Oakh', 'Phaer', 'Quen', 'Ryl', 'Stal', 'Thal', 'Ulf', 'Val', 'Wun', 'Xyl', 'Yar', 'Zel'],
  middle: ['an', 'en', 'in', 'on', 'un', 'ar', 'er', 'ir', 'or', 'ur', 'ath', 'eth', 'ith', 'oth', 'uth'],
  suffix: ['gard', 'heim', 'hold', 'land', 'mark', 'port', 'shire', 'stead', 'ton', 'vale', 'wall', 'wick', 'wood', 'bury', 'ford', 'gate', 'haven', 'mount', 'ridge', 'side', 'spring', 'top', 'view', 'watch', 'water', 'well'],
};

const MOUNTAIN_SYLLABLES = {
  prefix: ['Grim', 'Iron', 'Snow', 'Cloud', 'Thunder', 'Grey', 'White', 'Black', 'Blue', 'Gold', 'Silver', 'Stone', 'Frost', 'Mist', 'Storm', 'Shadow'],
  suffix: [' Peak', ' Mount', ' Horn', ' Spire', ' Crag', ' Massif', ' Crest', ' Range', ' Ridge', ' Point', ' Pillar'],
};

/**
 * Generate a procedural name.
 * @param {string} type - 'town' or 'mountain'
 * @param {string|number} seed - Random seed
 * @returns {string}
 */
export function generateName(type, seed) {
  // Simple deterministic random from seed
  const hash = String(seed).split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const rand = (mod) => Math.abs(hash) % mod;

  if (type === 'mountain') {
    const p = MOUNTAIN_SYLLABLES.prefix[rand(MOUNTAIN_SYLLABLES.prefix.length)];
    const s = MOUNTAIN_SYLLABLES.suffix[rand(MOUNTAIN_SYLLABLES.suffix.length)];
    return p + s;
  } else {
    const p = SYLLABLES.prefix[rand(SYLLABLES.prefix.length)];
    const m = SYLLABLES.middle[rand(SYLLABLES.middle.length)];
    const s = SYLLABLES.suffix[rand(SYLLABLES.suffix.length)];
    
    // Sometimes skip middle syllable
    return rand(10) > 3 ? p + m + s : p + s;
  }
}
