import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import {
  buildHistoricalGeometryAsset,
  buildHistoricalProvinceAsset,
} from "../HistoricalProvinceAssetBuilder.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node tools/historical-gis/cli/import-1300.js <world_1300.geojson>");
  process.exit(1);
}

const absoluteInput = path.resolve(process.cwd(), inputPath);
const regions = await importHistoricalGeoJson(absoluteInput);

const provinceDir = path.join(root, "src/world/map/assets/historical/1300/provinces");
const geometryDir = path.join(root, "src/world/map/assets/historical/1300/geometry");
await fs.mkdir(provinceDir, { recursive: true });
await fs.mkdir(geometryDir, { recursive: true });

const provinceImports = [];
const geometryImports = [];

for (const region of regions) {
  const provinceAsset = buildHistoricalProvinceAsset(region);
  const geometryAsset = buildHistoricalGeometryAsset(region);
  const stem = provinceAsset.identity.id;

  await fs.writeFile(
    path.join(provinceDir, `${stem}.json`),
    `${JSON.stringify(provinceAsset, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(geometryDir, `${stem}.json`),
    `${JSON.stringify(geometryAsset, null, 2)}\n`,
    "utf8",
  );

  provinceImports.push(`import province_${provinceImports.length} from "./provinces/${stem}.json";`);
  geometryImports.push(`import geometry_${geometryImports.length} from "./${stem}.json";`);
}

await fs.writeFile(
  path.join(provinceDir, "manifest.js"),
  `${provinceImports.join("\n")}\n\nexport default [\n${provinceImports.map((_, index) => `  province_${index},`).join("\n")}\n];\n`,
  "utf8",
);

await fs.writeFile(
  path.join(geometryDir, "manifest.js"),
  `${geometryImports.join("\n")}\n\nexport default [\n${geometryImports.map((_, index) => `  geometry_${index},`).join("\n")}\n];\n`,
  "utf8",
);

console.log(`Imported ${regions.length} historical GIS features for 1300.`);
console.log("Review the generated assets before committing them to the repository.");
