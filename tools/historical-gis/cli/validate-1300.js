import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const sourcePath = path.join(
  root,
  "data/gis/1300/source/world_1300.geojson",
);
const provinceDir = path.join(
  root,
  "src/world/map/assets/historical/1300/provinces",
);
const geometryDir = path.join(
  root,
  "src/world/map/assets/historical/1300/geometry",
);

async function readJsonFiles(directory) {
  let names;

  try {
    names = await fs.readdir(directory);
  } catch (error) {
    throw new Error(`Historical GIS asset directory is missing: ${directory}`, {
      cause: error,
    });
  }

  const jsonNames = names
    .filter((name) => name.endsWith(".json"))
    .sort();

  return Promise.all(
    jsonNames.map(async (name) => ({
      name,
      data: JSON.parse(
        await fs.readFile(path.join(directory, name), "utf8"),
      ),
    })),
  );
}

async function readManifest(directory) {
  const manifestPath = path.join(directory, "manifest.js");
  const content = await fs.readFile(manifestPath, "utf8");
  const imports = [...content.matchAll(/import\s+\w+\s+from\s+["'](.+?)["'];/g)]
    .map((match) => match[1]);

  for (const importPath of imports) {
    const resolvedPath = path.resolve(directory, importPath);
    try {
      await fs.access(resolvedPath);
    } catch (error) {
      throw new Error(
        `Manifest references a missing asset: ${manifestPath} -> ${importPath}`,
        { cause: error },
      );
    }
  }

  return imports;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourceRaw = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const normalizedRegions = await importHistoricalGeoJson(sourcePath, 1300);
const provinces = await readJsonFiles(provinceDir);
const geometries = await readJsonFiles(geometryDir);
const provinceManifest = await readManifest(provinceDir);
const geometryManifest = await readManifest(geometryDir);
const geometryById = new Map(
  geometries.map(({ data }) => [data.identity?.id, data]),
);
const provinceIds = new Set();
const sourceFeatureIndices = new Set();

assert(
  Array.isArray(sourceRaw.features),
  "Historical GIS source must contain a features array.",
);
assert(
  sourceRaw.features.length === normalizedRegions.length,
  `Source/normalized feature count mismatch: ${sourceRaw.features.length} vs ${normalizedRegions.length}.`,
);
assert(
  normalizedRegions.length > 0,
  "No historical province assets can be generated from the source.",
);
assert(
  provinces.length === normalizedRegions.length,
  `Province/source asset count mismatch: ${provinces.length} vs ${normalizedRegions.length}.`,
);
assert(
  geometries.length === normalizedRegions.length,
  `Geometry/source asset count mismatch: ${geometries.length} vs ${normalizedRegions.length}.`,
);
assert(
  provinceManifest.length === provinces.length,
  `Province manifest/file count mismatch: ${provinceManifest.length} vs ${provinces.length}.`,
);
assert(
  geometryManifest.length === geometries.length,
  `Geometry manifest/file count mismatch: ${geometryManifest.length} vs ${geometries.length}.`,
);

for (const { name, data } of provinces) {
  const id = data.identity?.id;
  assert(id, `Missing province identity in ${name}.`);
  assert(!provinceIds.has(id), `Duplicate province id: ${id}.`);
  provinceIds.add(id);

  const geometryId = data.references?.geometryId;
  assert(geometryId, `Missing geometry reference in ${name}.`);
  assert(
    geometryById.has(geometryId),
    `Missing geometry asset for province ${id}: ${geometryId}.`,
  );

  const historical = data.historical ?? {};
  assert(
    historical.sourceFeatureId,
    `Missing sourceFeatureId in historical province ${id}.`,
  );
  assert(
    Number.isInteger(historical.sourceFeatureIndex),
    `Missing sourceFeatureIndex in historical province ${id}.`,
  );
  assert(
    !sourceFeatureIndices.has(historical.sourceFeatureIndex),
    `Duplicate sourceFeatureIndex: ${historical.sourceFeatureIndex}.`,
  );
  sourceFeatureIndices.add(historical.sourceFeatureIndex);
}

for (const { name, data } of geometries) {
  const identity = data.identity ?? {};
  assert(identity.id, `Missing geometry identity in ${name}.`);
  assert(
    provinceIds.has(identity.provinceId),
    `Geometry ${identity.id} references a missing province: ${identity.provinceId}.`,
  );

  const polygons = data.polygons;
  assert(
    Array.isArray(polygons) && polygons.length > 0,
    `Geometry ${name} has no polygons.`,
  );

  for (const polygon of polygons) {
    assert(
      Array.isArray(polygon) && polygon.length >= 3,
      `Geometry ${name} contains an invalid polygon ring.`,
    );

    for (const coordinate of polygon) {
      assert(
        Array.isArray(coordinate) && coordinate.length >= 2,
        `Geometry ${name} contains an invalid coordinate.`,
      );

      const [longitude, latitude] = coordinate;

      assert(
        Number.isFinite(longitude) && Number.isFinite(latitude),
        `Geometry ${name} contains a non-numeric coordinate.`,
      );

      assert(
        longitude >= -180 && longitude <= 180 &&
          latitude >= -90 && latitude <= 90,
        `Geometry ${name} contains an out-of-range coordinate.`,
      );
    }
  }
}

assert(
  sourceFeatureIndices.size === normalizedRegions.length,
  `Source feature index coverage mismatch: ${sourceFeatureIndices.size} vs ${normalizedRegions.length}.`,
);

console.log(
  `Validated ${normalizedRegions.length} source features, ${provinces.length} historical province assets, ${geometries.length} geometry assets, and ${provinceManifest.length}/${geometryManifest.length} manifest entries for 1300.`,
);
