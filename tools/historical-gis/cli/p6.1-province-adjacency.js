import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../../src/map/data/AnatoliaProvinceMetadata.js";
import { buildP61Adjacency, formatP61Telemetry, summarizeP61Graph } from "../P61ProvinceAdjacency.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");

const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const runtimeIds = new Set((runtime.provinces ?? []).map((province) => province?.identity?.id));
const metadataIds = new Set(ANATOLIA_PROVINCE_METADATA.map((province) => province.id));
const missingRuntime = [...metadataIds].filter((id) => !runtimeIds.has(id));
if (missingRuntime.length) throw new Error(`P6.1 metadata/runtime mismatch; missing runtime provinces: ${missingRuntime.join(", ")}`);

const graph = buildP61Adjacency(ANATOLIA_PROVINCE_METADATA, {
  landPolygons: ANATOLIA_PHYSICAL_ATLAS.landPolygons,
});
const summary = summarizeP61Graph(graph);

if (summary.seedCount !== ANATOLIA_PROVINCE_METADATA.length) {
  throw new Error(`P6.1 seed count mismatch: expected ${ANATOLIA_PROVINCE_METADATA.length}, got ${summary.seedCount}`);
}
if (!graph.mstConnected) {
  throw new Error(`P6.1 physical candidate graph cannot connect all seeds; MST has ${summary.connectivityEdgeCount} of ${summary.seedCount - 1} required edges.`);
}
if (summary.isolatedSeedCount !== 0) {
  throw new Error(`P6.1 contains ${summary.isolatedSeedCount} isolated seeds.`);
}

console.log(formatP61Telemetry(summary));
console.log(`P6.1 mstConnected=${graph.mstConnected}`);
console.log("P6.1 graph is a candidate/diagnostic graph; it is not yet authoritative province adjacency.");
