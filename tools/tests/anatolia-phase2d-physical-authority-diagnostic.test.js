import assert from "node:assert/strict";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

try {
  const result = buildAnatoliaPhase2DAssets();
  assert.equal(result.provinceCount, 38);
  console.log(`Phase 2D physical-authority diagnostic: builder succeeded for ${result.provinceCount} provinces.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Phase 2D physical-authority diagnostic: ${message}`);
  if (message.includes("no physical-land geometry for ")) {
    const provinceId = message.split("no physical-land geometry for ")[1]?.trim() ?? "unknown";
    console.error(JSON.stringify({ failure: "empty-physical-land-partition", provinceId }));
  }
  process.exitCode = 1;
}
