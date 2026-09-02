import { runGeometryPipeline } from "./pipelines/GeometryPipeline.js";
import { runProvincePipeline } from "./pipelines/ProvincePipeline.js";
import { runTerrainPipeline } from "./pipelines/TerrainPipeline.js";
import { log, success } from "./shared/index.js";

/** Entry point of the complete Historia AI asset build system. */
export async function buildAssets() {
  log("Starting Asset Builder...");
  const geometryAssets = runGeometryPipeline();
  runProvincePipeline(geometryAssets);
  await runTerrainPipeline();
  success("Asset Builder finished successfully.");
}
