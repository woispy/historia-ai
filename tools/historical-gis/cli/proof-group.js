/**
 * Historia AI — Proof Group CLI
 *
 * Editorial validation for partially authored province boundary source
 * documents. Validates whatever subset of provinces has been entered so
 * far as a self-contained proof group: per-province diagnostics, shared
 * edge consistency, and (when everything is ready) planar topology with
 * Euler characteristic 2.
 *
 * Usage:
 *   node tools/historical-gis/cli/proof-group.js <fixtureDirectory> <sourceDocument.json>
 *
 * Exit code 0 when the entered group is fully consistent; 1 otherwise.
 * This is a proof artifact — never production authority.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateProofGroup } from "../province/ProvinceProofGroup.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const fixtureDirectory = process.argv[2] ? path.resolve(root, process.argv[2]) : path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const sourcePath = process.argv[3] ? path.resolve(root, process.argv[3]) : null;

if (!sourcePath) {
  console.error("Usage: node tools/historical-gis/cli/proof-group.js [fixtureDirectory] <sourceDocument.json>");
  process.exitCode = 1;
} else {
  const readJson = async (name) => JSON.parse(await fs.readFile(path.join(fixtureDirectory, name), "utf8"));
  let coverage;
  let provincesManifest;
  try {
    coverage = await readJson("coverage.json");
  } catch {
    coverage = null;
  }
  try {
    provincesManifest = await readJson("provinces.json");
  } catch {
    provincesManifest = null;
  }
  const sourceDocument = JSON.parse(await fs.readFile(sourcePath, "utf8"));

  const report = validateProofGroup({ sourceDocument, coverage, provincesManifest });

  console.log(`Proof group [${report.status}]: ${report.readyCount}/${report.provinceCount} provinces ready${report.coverageId ? ` (coverage ${report.coverageId})` : ""}${report.eulerCharacteristic != null ? `, Euler=${report.eulerCharacteristic}` : ""}.`);
  if (report.arcCount != null) {
    console.log(`Group topology: ${report.arcCount} arcs, ${report.nodeCount} nodes, ${report.sharedEdgeCount} shared edges, ${report.worldEdgeCount} world edges.`);
  }

  const notReady = report.provinces.filter((province) => !province.ready);
  if (notReady.length) {
    console.error(`Pending provinces (${notReady.length}):`);
    for (const province of notReady) {
      console.error(`- ${province.provinceId}: ${province.errors.join("; ")}`);
    }
  }
  if (report.groupErrors.length) {
    console.error(`Group errors (${report.groupErrors.length}):`);
    for (const item of report.groupErrors) {
      console.error(`- [${item.code}] ${item.message}`);
    }
  }

  if (!report.valid) process.exitCode = 1;
  console.log("Note: proof group artifact — production authority still requires the full declared province manifest.");
}
