import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  downloadHistorical1300GeoJson,
  importHistoricalGeoJson,
} from "../HistoricalGeometryImporter.js";
import {
  buildHistoricalGeometryAsset,
  buildHistoricalProvinceAsset,
} from "../HistoricalProvinceAssetBuilder.js";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const inputArgument = process.argv[2] ?? "--download";
const sourceDir = path.join(root, "data/gis/1300/source");
const defaultInput = path.join(sourceDir, "world_1300.geojson");
const inputPath =
  inputArgument === "--download"
    ? defaultInput
    : path.resolve(process.cwd(), inputArgument);

await fs.mkdir(sourceDir, { recursive: true });

if (inputArgument === "--download") {
  const result = await downloadHistorical1300GeoJson(inputPath);
  console.log(
    `Downloaded ${result.featureCount} historical GIS features from ${result.url}`,
  );
}

const regions = await importHistoricalGeoJson(inputPath);

if (!regions.length) {
  throw new Error("The 1300 historical GIS source contains no usable polygons.");
}

const provinceDir = path.join(
  root,
  "src/world/map/assets/historical/1300/provinces",
);
const geometryDir = path.join(
  root,
  "src/world/map/assets/historical/1300/geometry",
);

await fs.rm(provinceDir, { recursive: true, force: true });
await fs.rm(geometryDir, { recursive: true, force: true });
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

  provinceImports.push({
    variable: `province_${provinceImports.length}`,
    path: `./provinces/${stem}.json`,
  });

  geometryImports.push({
    variable: `geometry_${geometryImports.length}`,
    path: `./${stem}.json`,
  });
}

await fs.writeFile(
  path.join(provinceDir, "manifest.js"),
  [
    ...provinceImports.map(
      ({ variable, path: importPath }) =>
        `import ${variable} from "${importPath}";`,
    ),
    "",
    "export default [",
    ...provinceImports.map(({ variable }) => `  ${variable},`),
    "];",
    "",
  ].join("\n"),
  "utf8",
);

await fs.writeFile(
  path.join(geometryDir, "manifest.js"),
  [
    ...geometryImports.map(
      ({ variable, path: importPath }) =>
        `import ${variable} from "${importPath}";`,
    ),
    "",
    "export default [",
    ...geometryImports.map(({ variable }) => `  ${variable},`),
    "];",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Imported ${regions.length} historical GIS features for 1300.`);
console.log("Generated province and geometry manifests under src/world/map/assets/historical/1300.");
console.log("Review generated assets and commit them only when the source license permits redistribution.");
