import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE_PATH = path.join(ROOT, "src/world/map/source/geometry/natural-earth/admin-0-countries.geojson");

function loadTurkeyOuterRings() {
  if (!fs.existsSync(SOURCE_PATH)) return [];
  const source = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));
  const rings = [];
  for (const feature of source.features ?? []) {
    const properties = feature.properties ?? {};
    if (properties.ADM0_A3 !== "TUR" && properties.ISO_A3 !== "TUR" && properties.NAME_EN !== "Turkey") continue;
    const geometry = feature.geometry;
    if (geometry?.type === "Polygon") rings.push(geometry.coordinates[0]);
    if (geometry?.type === "MultiPolygon") for (const polygon of geometry.coordinates) rings.push(polygon[0]);
  }
  return rings.filter((ring) => Array.isArray(ring) && ring.length >= 3);
}

export const ANATOLIA_NATURAL_EARTH_LAND = Object.freeze(loadTurkeyOuterRings());
