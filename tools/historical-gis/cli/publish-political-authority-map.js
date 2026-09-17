import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPoliticalGeographyDataset } from "../province/PoliticalGeographyDatasetBuilder.js";
import { buildPoliticalMapbin } from "../../build/political-mapbin-builder.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const sourceArgument = process.argv[2];
const outputDirectory = path.join(root, "public/assets");

if (!sourceArgument) {
  console.error("Usage: node tools/historical-gis/cli/publish-political-authority-map.js <reviewed-source-document.json>");
  process.exitCode = 1;
} else {
  const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));
  const [coverage, provinces, provenance, sourceDocument] = await Promise.all([
    readJson(path.join(fixtureDirectory, "coverage.json")),
    readJson(path.join(fixtureDirectory, "provinces.json")),
    readJson(path.join(fixtureDirectory, "provenance.json")),
    readJson(path.resolve(root, sourceArgument)),
  ]);

  try {
    const { dataset, report: datasetReport } = buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument });
    const { buffer, idMap, report: mapbinReport } = buildPoliticalMapbin(dataset);
    const manifest = {
      schemaVersion: 1,
      kind: "political-geography-authority-map",
      coverageId: datasetReport.coverageId,
      sourceId: datasetReport.sourceId,
      reviewStatus: sourceDocument.reviewStatus,
      provinceCount: mapbinReport.provinces,
      generatedAt: new Date().toISOString(),
      idMap,
    };
    await fs.mkdir(outputDirectory, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(outputDirectory, "political-authority.mapbin"), new Uint8Array(buffer)),
      fs.writeFile(path.join(outputDirectory, "political-authority.manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    ]);
    console.log(`Published authority map: ${manifest.provinceCount} provinces, ${mapbinReport.totalByteLength} bytes, source=${manifest.sourceId}.`);
  } catch (error) {
    console.error(`Authority map publication blocked: ${error.message}`);
    process.exitCode = 1;
  }
}
