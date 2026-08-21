/**
 * Hydrography visibility policy.
 *
 * Source geometry stays exact; this module only decides which features deserve
 * a draw call at a given LOD. Small source features are intentionally omitted
 * at wider views to keep SVG node count and paint cost bounded.
 */

const MAJOR_RIVER_IDS = new Set([
  "sakarya",
  "gediz",
  "buyuk-menderes",
  "seyhan",
  "ceyhan",
  "firat",
  "dicle",
  "kizilirmak",
  "yesilirmak",
]);

const MAJOR_LAKE_NAMES = new Set([
  "van gölü",
  "van lake",
  "tuz gölü",
  "tuz lake",
  "iznik gölü",
  "iznik lake",
  "sapanca gölü",
  "sapanca lake",
  "beyşehir gölü",
  "beysehir lake",
  "eğirdir gölü",
  "egirdir lake",
]);

const RIVER_RANK_BY_LOD = Object.freeze({
  regional: 1,
  province: 2,
  city: 3,
  detailed: 3,
});

const LAKE_AREA_BY_LOD = Object.freeze({
  regional: 0.025,
  province: 0.008,
  city: 0.002,
  detailed: 0.002,
});

function normalized(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function featureBoundsArea(feature) {
  const bounds = feature?.bounds;
  if (!Array.isArray(bounds) || bounds.length !== 4) return 0;
  const width = Math.max(0, Number(bounds[2]) - Number(bounds[0]));
  const height = Math.max(0, Number(bounds[3]) - Number(bounds[1]));
  return width * height;
}

export function getHydrographyVisibilityProfile(zoom = 1) {
  if (zoom < 1.20) return "world";
  if (zoom < 1.85) return "regional";
  if (zoom < 2.65) return "province";
  if (zoom < 3.50) return "city";
  return "detailed";
}

export function isImportantRiver(feature, lod) {
  if (!feature || lod === "world") return false;
  const canonicalId = normalized(feature.canonicalId);
  if (MAJOR_RIVER_IDS.has(canonicalId)) return true;

  const rank = Number(feature.rank);
  if (Number.isFinite(rank)) return rank <= RIVER_RANK_BY_LOD[lod];

  // Unranked source segments are retained only when they have enough spatial
  // extent to matter at the current view. This avoids rendering tiny drainage
  // fragments while never altering the underlying source geometry.
  const area = featureBoundsArea(feature);
  const minimumArea = lod === "regional" ? 0.10 : lod === "province" ? 0.025 : 0.006;
  return area >= minimumArea;
}

export function isImportantLake(feature, lod) {
  if (!feature || lod === "world") return false;
  const name = normalized(feature.name);
  if (MAJOR_LAKE_NAMES.has(name)) return true;
  return featureBoundsArea(feature) >= LAKE_AREA_BY_LOD[lod];
}

export function filterVisibleRivers(features = [], zoom = 1) {
  const lod = getHydrographyVisibilityProfile(zoom);
  return features.filter((feature) => isImportantRiver(feature, lod));
}

export function filterVisibleLakes(features = [], zoom = 1) {
  const lod = getHydrographyVisibilityProfile(zoom);
  return features.filter((feature) => isImportantLake(feature, lod));
}

export const HYDROGRAPHY_VISIBILITY_RULES = Object.freeze({
  riverRankByLod: RIVER_RANK_BY_LOD,
  lakeAreaByLod: LAKE_AREA_BY_LOD,
});
