/** Deterministic indexed GPU province geometry. HMAP/GIS remains authoritative. */
export {
  normalizeRing,
  analyzeRing,
  triangulateRing,
  buildLodRings,
  buildIndexedProvincePack,
} from "./ProvinceGpuPackStable.js";
