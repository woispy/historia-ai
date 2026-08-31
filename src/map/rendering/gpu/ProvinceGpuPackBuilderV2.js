/**
 * Compatibility facade for the deterministic GPU province pack builder.
 *
 * There must be exactly one authoritative triangulation implementation. The
 * historical GIS runtime is authoritative for geometry; this module only
 * preserves the V2 import surface used by the GPU build pipeline.
 */
export {
  normalizeRing,
  analyzeRing,
  triangulateRing,
  buildLodRings,
  buildIndexedProvincePack,
} from "./ProvinceGpuPack.js";
