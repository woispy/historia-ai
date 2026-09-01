import { BinaryMapAssetSource } from "./BinaryMapAssetSource.js";

const DEFAULT_URL = "/assets/world.mapbin";

/** Browser-only loader: network bytes become immutable binary runtime views. */
export async function loadMapBin(url = DEFAULT_URL, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") throw new TypeError("MapBinLoader requires fetch");
  const response = await fetchImpl(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Map asset request failed: ${response.status} ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  return BinaryMapAssetSource.fromArrayBuffer(buffer);
}

export { DEFAULT_URL as DEFAULT_MAPBIN_URL };
export default loadMapBin;
