import { decodeTerrainTile } from "./TerrainAssetCodec.js";

export async function loadTerrainManifest(url = "/assets/terrain/manifest.json") {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Terrain manifest request failed: ${response.status}`);
  const manifest = await response.json();
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.tiles)) throw new Error("Invalid terrain manifest.");
  return manifest;
}

export async function loadTerrainTileAsset(record) {
  if (!record?.asset) throw new Error("Terrain tile record is missing its asset URL.");
  const response = await fetch(record.asset, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Terrain tile request failed: ${response.status} (${record.id}).`);
  return decodeTerrainTile(await response.arrayBuffer());
}
