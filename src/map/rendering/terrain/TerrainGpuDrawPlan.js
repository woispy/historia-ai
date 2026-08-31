const MODES = Object.freeze(["same", "neighbor-finer", "neighbor-coarser", "boundary"]);
function assertMode(mode) { if (!MODES.includes(mode)) throw new Error(`Unknown terrain seam mode: ${mode}.`); }

export function createGpuTerrainDrawPlan({ baseIndexCount, seamIndexCounts = {}, edges = {}, resident = true } = {}) {
  if (!Number.isInteger(baseIndexCount) || baseIndexCount < 0) throw new Error("Terrain base index count must be a non-negative integer.");
  if (!resident) return Object.freeze({ draw: false, passes: Object.freeze([]), indexCount: 0 });
  const modes = Object.values(edges).map((edge) => edge?.mode || "boundary");
  for (const mode of modes) assertMode(mode);
  const seamCounts = Object.freeze({});
  const passes = [{ mode: "base", indexCount: baseIndexCount }];
  let indexCount = baseIndexCount;
  for (const mode of MODES.slice(1)) {
    const count = seamIndexCounts[mode] ?? 0;
    if (!Number.isInteger(count) || count < 0) throw new Error(`Invalid seam index count for ${mode}.`);
    if (modes.includes(mode) && count > 0) { passes.push({ mode, indexCount: count }); indexCount += count; }
  }
  return Object.freeze({ draw: true, passes: Object.freeze(passes.map((pass) => Object.freeze(pass))), indexCount, seamCounts });
}

export { MODES };
