import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const provinces = await readJsonFiles(provinceDir);
const geometries = await readJsonFiles(geometryDir);
const geometryById = new Map(
  geometries.map(({ data }) => [data.identity?.id, data]),
);
const ids = new Set();

assert(provinces.length > 0, "No historical province assets were generated.");
assert(
  provinces.length === geometries.length,
  `Province/geometry asset count mismatch: ${provinces.length} vs ${geometries.length}.`,
);

for (const { name, data } of provinces) {
  const id = data.identity?.id;
  assert(id, `Missing province identity in ${name}.`);
  assert(!ids.has(id), `Duplicate province id: ${id}.`);
  ids.add(id);

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
}

for (const { name, data } of geometries) {
  const identity = data.identity ?? {};
  assert(identity.id, `Missing geometry identity in ${name}.`);

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

console.log(
  `Validated ${provinces.length} historical province assets and ${geometries.length} geometry assets for 1300.`,
);
