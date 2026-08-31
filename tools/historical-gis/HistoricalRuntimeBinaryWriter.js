import fs from "node:fs/promises";
import path from "node:path";
import { encodeHistoricalRuntimeRegion } from "../../src/world/map/binary/HistoricalRuntimeBinary.js";

export async function writeHistoricalRuntimeBinaryRegion(runtimeDir, regionAsset) {
  const regionId = String(regionAsset?.regionId ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(regionId)) {
    throw new Error(`Invalid historical runtime region id for binary asset: ${regionId || "<empty>"}`);
  }

  const bytes = encodeHistoricalRuntimeRegion(regionAsset);
  const file = `regions/${regionId}.bin`;
  const outputPath = path.join(runtimeDir, file);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, bytes);

  return {
    file,
    bytes: bytes.byteLength,
  };
}
