import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ANATOLIA_PROVINCE_METADATA } from "../../../src/map/data/AnatoliaProvinceMetadata.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const nicaea = ANATOLIA_PROVINCE_METADATA.find((province) => province.id === "bithynia-nicaea");
if (!nicaea) throw new Error("Phase 2D physical resolver could not find bithynia-nicaea metadata.");

// The historical city anchor is the centre of Lake Iznik and is intentionally
// unsuitable as a physical province seed. Resolve the province through the
// same south/off-lake physical reconciliation point asserted by Phase 2D's
// regression contract, then restore historical presentation metadata.
const originalCentroid = [...nicaea.centroid];
const originalTerrain = nicaea.terrain;
const physicalLandAnchor = [29.72, 40.15];
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

  await fs.writeFile(runtimePath, `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
} finally {
  nicaea.centroid = originalCentroid;
  nicaea.terrain = originalTerrain;
}

console.log("Phase 2D physical resolver: Nicaea geometry generated from the south/off-lake physical reconciliation anchor and historical presentation metadata restored.");
