import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

export function buildProvinceAnchorPartition() {
  return ANATOLIA_PROVINCE_METADATA.map((province) => ({
    provinceId: province.id,
    anchor: ANATOLIA_PROVINCE_REFINEMENTS[province.id]?.anchor ?? province.centroid,
  }));
}
