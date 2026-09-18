import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeMapBin } from "./mapbin-encoder.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const inputArg = readArg("--input");
const INPUT = inputArg
  ? path.resolve(process.cwd(), inputArg)
  : process.env.HISTORIA_MAP_RUNTIME_JSON
    ? path.resolve(process.cwd(), process.env.HISTORIA_MAP_RUNTIME_JSON)
    : null;
const OUTPUT = process.env.HISTORIA_MAPBIN_OUTPUT
  ? path.resolve(process.cwd(), process.env.HISTORIA_MAPBIN_OUTPUT)
  : path.join(ROOT, "public/assets/world.mapbin");

if (!INPUT) {
  throw new Error(
    "MapBin input is required. Pass --input <runtime.json> or HISTORIA_MAP_RUNTIME_JSON. No historical year is selected implicitly.",
  );
}

const runtime = JSON.parse(await fs.readFile(INPUT, "utf8"));
const provinces = Array.isArray(runtime.provinces) ? runtime.provinces : [];
const geometries = Array.isArray(runtime.geometries) ? runtime.geometries : [];
if (!provinces.length) throw new Error(`Mapbin source contains no provinces: ${INPUT}`);
const geometryById = new Map(geometries.map((geometry) => [String(geometry?.identity?.provinceId ?? geometry?.identity?.id), geometry]));
const entries = provinces.map((province) => ({ province, geometry: geometryById.get(String(province?.identity?.id)) }));
const missing = entries.filter((entry) => !entry.geometry);
if (missing.length) throw new Error(`Mapbin source has ${missing.length} provinces without authoritative geometry.`);
const buffer = encodeMapBin(entries);
await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, new Uint8Array(buffer));
console.log(`Built ${path.relative(ROOT, OUTPUT)}: ${entries.length} provinces, ${geometries.length} authoritative geometries, ${buffer.byteLength} bytes.`);
