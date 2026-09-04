import { TERRAIN_BINARY_VERSION, decodeTerrainTile } from "./TerrainAssetCodec.js";

const TERRAIN_MANIFEST_VERSION = 3;
const TERRAIN_MANIFEST_FORMAT = "HTRN-v3";

export async function loadTerrainManifest(url = "/assets/terrain/manifest.json") {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Terrain manifest request failed: ${response.status}`);
  const manifest = await response.json();
  if (!manifest || manifest.version !== TERRAIN_MANIFEST_VERSION || manifest.format !== TERRAIN_MANIFEST_FORMAT || !Array.isArray(manifest.tiles)) throw new Error("Invalid terrain manifest.");
  for (const record of manifest.tiles) {
    if (!record?.id || !record.asset || !finiteBounds(record.bounds) || !finiteBounds(record.dataBounds)) throw new Error(`Invalid terrain bounds contract for tile ${record?.id ?? "unknown"}.`);
  }
  return manifest;
}

export async function loadTerrainTileAsset(record, manifest = null) {
  if (!record?.asset) throw new Error("Terrain tile record is missing its asset URL.");
  const response = await fetch(`${record.asset}${record.asset.includes("?") ? "&" : "?"}htrn=${TERRAIN_BINARY_VERSION}${manifest?.generatedAt ? `&v=${encodeURIComponent(manifest.generatedAt)}` : ""}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Terrain tile request failed: ${response.status} (${record.id}).`);
  const asset = decodeTerrainTile(await response.arrayBuffer());
  if (asset.version !== TERRAIN_BINARY_VERSION) throw new Error(`Unsupported HTRN terrain asset version: ${asset.version} (${record.id}).`);
  if (asset.size !== record.grid) throw new Error(`HTRN grid mismatch for ${record.id}: ${asset.size} !== ${record.grid}.`);
  if (!sameBounds(asset.bounds, record.bounds)) throw new Error(`HTRN bounds mismatch for ${record.id}.`);
  if (!(asset.demValidity instanceof Uint8Array) || asset.demValidity.length !== asset.size * asset.size) throw new Error(`HTRN DEM validity mask mismatch for ${record.id}.`);
  return asset;
}

function finiteBounds(bounds) { return Boolean(bounds && ["minX","minY","maxX","maxY"].every((key) => Number.isFinite(bounds[key])) && bounds.minX < bounds.maxX && bounds.minY < bounds.maxY && bounds.minX >= -180 && bounds.maxX <= 180 && bounds.minY >= -90 && bounds.maxY <= 90); }
function sameBounds(a, b) { return ["minX","minY","maxX","maxY"].every((key) => Math.abs(Number(a?.[key]) - Number(b?.[key])) <= 1e-5); }
