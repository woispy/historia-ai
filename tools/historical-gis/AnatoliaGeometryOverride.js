// Backward-compatible entry point for the single Anatolia geometry authority.
// Keep all classifier behavior in AnatoliaGeometryAuthority so production and
// Phase 2D regression tests cannot drift onto different Thrace boundaries.
export {
  isAnatoliaGeometryPoint,
  ANATOLIA_BBOX,
  EUROPEAN_THRACE_EXCLUSION,
} from "./AnatoliaGeometryAuthority.js";
