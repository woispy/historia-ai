import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPoliticalGeographyDataset } from "../province/PoliticalGeographyDatasetBuilder.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const fixtureDirectory = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const sourcePath = process.argv[3] ? path.resolve(root, process.argv[3]) : null;

if (!sourcePath) {
  console.error("Usage: node tools/historical-gis/cli/build-political-geography-dataset.js [fixtureDirectory] <sourceDocument.json>");
  process.exitCode = 1;
} else {
  const readJson = async (name) => JSON.parse(await fs.readFile(path.join(fixtureDirectory, name), "utf8"));
  const sourceDocument = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  try {
    const { report } = buildPoliticalGeographyDataset({
      coverage: await readJson("coverage.json"),
      provinces: await readJson("provinces.json"),
      provenance: await readJson("provenance.json"),
      sourceDocument,
    });
    console.log(`Political Geography dataset built: ${report.provinceCount} provinces, ${report.arcCount} arcs, ${report.faceCount} faces, Euler=${report.eulerCharacteristic}, authority gate valid.`);
    console.log(JSON.stringify(report, null, 2));
    console.log("Note: the builder returns the promoted dataset; persisting it into the fixture directory is a deliberate, reviewed step.");
  } catch (error) {
    console.error(`Political Geography dataset build blocked: ${error.message}`);
    process.exitCode = 1;
  }
}
