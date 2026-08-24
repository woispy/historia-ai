/**
 * 1300 Anatolia — 44-province geometry authority manifest.
 *
 * Extends the stable 38-province manifest with six source-reviewed geographic
 * anchors. Geometry is generated from the province identity and physical-land
 * authority; no hand-authored political polygon is stored here.
 */

import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST } from "./Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_1300_PROVINCE_EXPANSION } from "./AnatoliaProvinceMetadata44.js";

const geometry = (id, sourceKey, notes = null) => Object.freeze({
  id,
  sourceKey,
  clipToPhysicalLand: true,
  notes,
});

export const ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST_44 = Object.freeze([
  ...ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST,
  ...ANATOLIA_1300_PROVINCE_EXPANSION.map((province) => geometry(
    province.id,
    province.id,
    `Historical expansion anchor for ${province.name}; extent remains source-constrained and non-cadastral.`,
  )),
]);

export const ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS_44 = Object.freeze(
  Object.fromEntries(
    ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST_44.map(({ id, sourceKey }) => [id, sourceKey]),
  ),
);
