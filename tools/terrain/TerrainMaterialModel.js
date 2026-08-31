const MATERIALS = Object.freeze({ desert: { roughness: 0.9, ambient: 0.7 }, forest: { roughness: 0.82, ambient: 0.72 }, steppe: { roughness: 0.88, ambient: 0.7 }, rock: { roughness: 0.76, ambient: 0.68 }, snow: { roughness: 0.62, ambient: 0.82 } });

function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function assertWeightArray(weights, count) { if (!weights || weights.length !== count * 5) throw new Error("Terrain material weights must contain five channels per sample."); }

export function evaluateTerrainMaterial({ weights, sampleIndex, albedoByClass, roughnessByClass = MATERIALS, ambientByClass = MATERIALS } = {}) {
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0) throw new Error("Terrain material sample index must be non-negative.");
  const count = Math.floor((weights?.length || 0) / 5); assertWeightArray(weights, count); if (sampleIndex >= count) throw new Error("Terrain material sample index is outside the weight grid.");
  if (!albedoByClass || typeof albedoByClass !== "object") throw new Error("Terrain material albedo palette is required.");
  const names = ["desert", "forest", "steppe", "rock", "snow"];
  let total = 0; const albedo = [0,0,0]; let roughness = 0; let ambient = 0;
  for (let channel = 0; channel < names.length; channel += 1) { const name = names[channel]; const w = clamp01(weights[sampleIndex * 5 + channel] / 255); const color = albedoByClass[name]; const material = roughnessByClass[name] || MATERIALS[name]; const ambientMaterial = ambientByClass[name] || MATERIALS[name]; if (!Array.isArray(color) || color.length !== 3) throw new Error(`Albedo for ${name} must be RGB.`); for (let c = 0; c < 3; c += 1) albedo[c] += color[c] * w; roughness += material.roughness * w; ambient += ambientMaterial.ambient * w; total += w; }
  if (total <= 0) throw new Error("Terrain material sample has no active land-cover weight.");
  return Object.freeze({ albedo: Object.freeze(albedo.map((v) => v / total)), roughness: roughness / total, ambient: ambient / total });
}

export { MATERIALS };
