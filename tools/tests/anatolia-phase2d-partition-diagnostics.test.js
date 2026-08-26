import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

try {
  const result = buildAnatoliaPhase2DAssets();
  console.log(`Phase 2D partition diagnostics completed: ${result.provinceCount} provinces, ${result.polygonCount} polygons.`);
} catch (error) {
  console.error(`Phase 2D partition diagnostics failed: ${error.message}`);
  process.exitCode = 1;
}
