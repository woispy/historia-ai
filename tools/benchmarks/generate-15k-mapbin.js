import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeMapBin, inspectMapBin } from "../build/mapbin-encoder.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COUNT = Number(process.env.HISTORIA_STRESS_PROVINCES ?? 15000);
const POINTS = Number(process.env.HISTORIA_STRESS_POINTS ?? 32);
const OUTPUT = process.env.HISTORIA_STRESS_MAPBIN_OUTPUT ?? path.join(ROOT, "public/assets/stress-15k.mapbin");

if (!Number.isInteger(COUNT) || COUNT < 1) throw new Error("HISTORIA_STRESS_PROVINCES must be a positive integer");
if (!Number.isInteger(POINTS) || POINTS < 3) throw new Error("HISTORIA_STRESS_POINTS must be >= 3");

function makeProvince(i) {
  const cols = 150;
  const row = Math.floor(i / cols);
  const col = i % cols;
  const cellW = 360 / cols;
  const cellH = 180 / Math.ceil(COUNT / cols);
  const cx = -180 + (col + 0.5) * cellW;
  const cy = -90 + (row + 0.5) * cellH;
  const radiusX = cellW * 0.43;
  const radiusY = cellH * 0.43;
  const phase = (i * 0.754877666) % (Math.PI * 2);
  const polygon = [];
  for (let p = 0; p < POINTS; p += 1) {
    const a = phase + (p / POINTS) * Math.PI * 2;
    const wobble = 0.82 + 0.14 * Math.sin(a * 3 + i * 0.013) + 0.04 * Math.sin(a * 7);
    polygon.push([cx + Math.cos(a) * radiusX * wobble, cy + Math.sin(a) * radiusY * wobble]);
  }
  const id = i + 1;
  return {
    province: { identity: { id }, ownership: { ownerId: (i % 997) + 1 } },
    geometry: { identity: { provinceId: id }, polygons: [polygon] },
  };
}

const entries = Array.from({ length: COUNT }, (_, i) => makeProvince(i));
const buffer = encodeMapBin(entries);
await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, new Uint8Array(buffer));
const header = inspectMapBin(buffer);
console.log(JSON.stringify({
  dataset: "historia-stress-15k",
  provinceCount: header.provinceCount,
  tileCount: header.tileCount,
  geometryPointCount: header.geometryPointCount,
  bytes: header.totalByteLength,
  pointsPerProvince: POINTS,
  output: path.relative(ROOT, OUTPUT),
}, null, 2));
