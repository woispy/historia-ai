/**
 * Historia AI — Parallel GPU Province Pack
 *
 * Compatibility entry point for the experimental parallel packer.
 *
 * The canonical production packer remains ProvinceGpuPackStable. Keeping this
 * module as a thin facade prevents the experimental path from maintaining a
 * second copy of geometry normalization, LOD, and triangulation logic.
 */

export { buildIndexedProvincePack } from "./ProvinceGpuPackStable.js";
export { ParallelTriangulator } from "./ParallelTriangulator.js";
