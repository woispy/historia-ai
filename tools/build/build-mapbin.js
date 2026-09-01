import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeMapBin } from "./mapbin-encoder.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const INPUT = process.env.HISTORIA_MAP_RUNTIME_JSON ?? path.join(ROOT, "src/world/map/assets/historical/1300/runtime.json");
const OUTPUT = process.env.HISTORIA_MAPBIN_OUTPUT ?? path.join(ROOT, "public/assets/world.mapbin");
const runtime = JSON.parse(await fs.readFile(INPUT, "utf8"));
const entries = Array.isArray(runtime.provinces) ? runtime.provinces : [];
if (!entries.length) throw new Error(`Mapbin source contains no provinces: ${INPUT}`);
const buffer = encodeMapBin(entries);
await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, new Uint8Array(buffer));
const bytes = buffer.byteLength;
console.log(`Built ${path.relative(ROOT, OUTPUT)}: ${entries.length} provinces, ${bytes} bytes.`);
