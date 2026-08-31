const CHANNELS = Object.freeze({ DESERT: 0, FOREST: 1, STEPPE: 2, ROCK: 3, SNOW: 4 });
const CLASS_TO_CHANNEL = Object.freeze({ desert: CHANNELS.DESERT, forest: CHANNELS.FOREST, steppe: CHANNELS.STEPPE, rock: CHANNELS.ROCK, snow: CHANNELS.SNOW });

function assertDimensions(classes, width, height) { if (!classes || classes.length !== width * height || !Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) throw new Error("Land-cover grid dimensions are invalid."); }

export function buildTerrainSplatWeights({ landCover, width, height } = {}) {
  assertDimensions(landCover, width, height);
  const weights = new Uint8Array(width * height * 4);
  const snow = new Uint8Array(width * height);
  for (let i = 0; i < landCover.length; i += 1) {
    const className = landCover[i];
    const channel = CLASS_TO_CHANNEL[className];
    if (channel === undefined) throw new Error(`Unsupported land-cover class: ${className}`);
    const base = i * 4;
    if (channel < 4) weights[base + channel] = 255; else snow[i] = 255;
  }
  return Object.freeze({ width, height, rgba: weights, snow, channels: CHANNELS });
}
