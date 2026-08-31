import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ANATOLIA_PROVINCE_METADATA } from "../../../src/map/data/AnatoliaProvinceMetadata.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const nicaea = ANATOLIA_PROVINCE_METADATA.find((province) => province.id === "bithynia-nicaea");
if (!nicaea) throw new Error("Phase 2D physical resolver could not find bithynia-nicaea metadata.");

// The historical city anchor is the centre of Lake Iznik and is intentionally
// unsuitable as a physical province seed. Phase 2D already carries a curated
// physical-land anchor for this province; use it only during deterministic
// geometry generation, then restore the historical presentation metadata in
// the generated runtime asset.
const originalCentroid = [...nicaea.centroid];
const originalTerrain = nicaea.terrain;
const physicalLandAnchor = [29.95, 40.65];
nicaea.centroid = physicalLandAnchor;
nicaea.terrain = "plains";

try {
  await import("./import-1300.js");

  const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
  const province = runtime.provinces.find((candidate) => candidate.identity?.id === nicaea.id);
  const geometry = runtime.geometries.find((candidate) => candidate.identity?.id === nicaea.id);

  if (!province || !geometry) {
    throw new Error("Phase 2D physical resolver could not locate generated Nicaea assets.");
  }

  province.geometry.terrain = originalTerrain;
  province.historical.anchor = originalCentroid;
  geometry.metadata.precision = geometry.metadata.precision ?? "cartographic-refinement";

  await fs.writeFile(runtimePath, `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
} finally {
  nicaea.centroid = originalCentroid;
  nicaea.terrain = originalTerrain;
}

console.log("Phase 2D physical resolver: Nicaea geometry generated from the curated physical-land anchor and historical presentation metadata restored.");
