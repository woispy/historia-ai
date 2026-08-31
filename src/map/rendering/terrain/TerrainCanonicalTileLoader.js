import { createTerrainAssetManifest, validateTerrainAssetManifest } from "./TerrainAssetManifest.js";
import { buildTerrainGridMesh } from "./TerrainGeometry.js";
import { createTerrainHeightSampler } from "./TerrainHeightSampler.js";

const TEXTURE_KEYS = Object.freeze(["normal", "splatRgba", "splatSnow", "landMask"]);
function assertBytes(value, name) { if (!(value instanceof ArrayBuffer)) throw new Error(`${name} must be an ArrayBuffer.`); }
function sameBounds(a, b) { const epsilon = 1e-7; return ["minX", "minY", "maxX", "maxY"].every((key) => Math.abs(a[key] - b[key]) <= epsilon); }

export function createCanonicalTerrainTileLoader({ manifestForTile, fetchBinary, decodeHeightmap, buildTexturePayloads = (payloads) => payloads } = {}) {
  if (typeof manifestForTile !== "function" || typeof fetchBinary !== "function" || typeof decodeHeightmap !== "function") throw new Error("Canonical terrain loader requires manifest, binary fetch and heightmap decoder callbacks.");
  return async function load(tileId) {
    const manifest = createTerrainAssetManifest(await manifestForTile(tileId));
    validateTerrainAssetManifest(manifest);
    if (manifest.tileId !== tileId) throw new Error(`Terrain tile manifest identity mismatch: requested ${tileId}, received ${manifest.tileId}.`);

    const heightBuffer = await fetchBinary(manifest.assets.heightmap);
    assertBytes(heightBuffer, "heightmap");
    const decoded = await decodeHeightmap(heightBuffer, manifest);
    if (!decoded?.samples || !(decoded.samples instanceof Float32Array)) throw new Error(`Terrain tile ${tileId} decoder must return Float32Array samples.`);
    if (decoded.width !== manifest.dimensions.width || decoded.height !== manifest.dimensions.height) throw new Error(`Terrain tile ${tileId} DEM dimensions do not match its manifest.`);
    if (decoded.crs !== manifest.crs) throw new Error(`Terrain tile ${tileId} DEM CRS does not match its manifest.`);
    if (!Number.isFinite(decoded.resolutionMeters) || Math.abs(decoded.resolutionMeters - manifest.resolution) > 1e-6) throw new Error(`Terrain tile ${tileId} DEM resolution does not match its manifest.`);
    if (!decoded.bounds || !sameBounds(decoded.bounds, manifest.bounds)) throw new Error(`Terrain tile ${tileId} DEM bounds do not match its manifest.`);
    if (!Number.isFinite(decoded.spacingX) || !Number.isFinite(decoded.spacingY) || decoded.spacingX <= 0 || decoded.spacingY <= 0) throw new Error(`Terrain tile ${tileId} requires explicit metric sample spacing.`);
    const mesh = buildTerrainGridMesh({ heights: decoded.samples, size: decoded.width, spacingX: decoded.spacingX, spacingY: decoded.spacingY });
    const sampler = createTerrainHeightSampler({ bounds: decoded.bounds, width: decoded.width, height: decoded.height, samples: decoded.samples, spacingX: decoded.spacingX, spacingY: decoded.spacingY });
    const textureBuffers = {};
    for (const key of TEXTURE_KEYS) { const buffer = await fetchBinary(manifest.assets[key]); assertBytes(buffer, key); textureBuffers[key] = buffer; }
    const textures = await buildTexturePayloads(textureBuffers, manifest);
    return Object.freeze({ tileId, manifest, mesh, sampler, textures, byteLength: heightBuffer.byteLength + Object.values(textureBuffers).reduce((sum, buffer) => sum + buffer.byteLength, 0), physical: Object.freeze({ crs: decoded.crs, bounds: decoded.bounds, resolutionMeters: decoded.resolutionMeters, spacingX: decoded.spacingX, spacingY: decoded.spacingY }) });
  };
}
