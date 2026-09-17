import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSourceDocumentTemplate, validateSourceDocumentProgress } from "../province/ProvinceSourceStudio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const command = process.argv[2];
const fixtureDirectory = process.argv[3] ? path.resolve(root, process.argv[3]) : path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const target = process.argv[4] ? path.resolve(root, process.argv[4]) : null;

const readJson = async (name) => JSON.parse(await fs.readFile(path.join(fixtureDirectory, name), "utf8"));

if (command === "init") {
  if (!target) {
    console.error("Usage: node tools/historical-gis/cli/studio-source-document.js init [fixtureDirectory] <outputPath> [sourceId] [sourceRef]");
    process.exitCode = 1;
  } else {
    const sourceId = process.argv[5] ?? "anatolia-1300-editorial";
    const sourceRef = process.argv[6] ?? "editorial reconstruction; reviewed boundary sources pending";
    const template = createSourceDocumentTemplate({
      coverage: await readJson("coverage.json"),
      provinces: await readJson("provinces.json"),
      sourceId,
      sourceRef,
    });
    await fs.writeFile(target, JSON.stringify(template, null, 2), "utf8");
    console.log(`Source document template written: ${target} (${template.provinces.length} provinces, all pending).`);
  }
} else if (command === "check") {
  if (!target) {
    console.error("Usage: node tools/historical-gis/cli/studio-source-document.js check [fixtureDirectory] <sourceDocument.json>");
    process.exitCode = 1;
  } else {
    const sourceDocument = JSON.parse(await fs.readFile(target, "utf8"));
    const progress = validateSourceDocumentProgress({
      coverage: await readJson("coverage.json"),
      provinces: await readJson("provinces.json"),
      sourceDocument,
    });
    console.log(`Studio progress: ${progress.ready}/${progress.total} provinces ready, promotable=${progress.promotable}.`);
    for (const province of progress.provinces) {
      if (!province.ready) {
        console.error(`- ${province.provinceId}: ${province.errors.join("; ")}`);
      }
    }
    if (progress.structuralErrors.length) {
      for (const item of progress.structuralErrors) console.error(`- [structural] ${item}`);
    }
  }
} else {
  console.error("Usage: node tools/historical-gis/cli/studio-source-document.js <init|check> [fixtureDirectory] <path>");
  process.exitCode = 1;
}
