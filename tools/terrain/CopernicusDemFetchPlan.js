import { COPERNICUS_DEM_SOURCES, createDemTileId, resolveCopernicusDemSource } from "./CopernicusDemSource.js";

export const COPERNICUS_CATALOGUE_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products";
export const COPERNICUS_DOWNLOAD_URL = "https://download.dataspace.copernicus.eu/odata/v1/Products";

export function createDemFetchPlan({ latitude, longitude, demInstance = "COPERNICUS_90" } = {}) {
  const source = resolveCopernicusDemSource(demInstance);
  const tileId = createDemTileId(latitude, longitude);
  return Object.freeze({
    source,
    tileId,
    discovery: Object.freeze({
      provider: "Copernicus Data Space Ecosystem",
      endpoint: COPERNICUS_CATALOGUE_URL,
      collection: "CCM",
      productType: source.id === COPERNICUS_DEM_SOURCES.GLO90.id ? "SAR_DTE_90_61F6" : "SAR_DTE_30_615C",
    }),
    download: Object.freeze({
      endpoint: COPERNICUS_DOWNLOAD_URL,
      requiresAuthentication: true,
      binaryProductRequired: true,
    }),
    policy: Object.freeze({
      fictionalElevationAllowed: false,
      missingSourceAction: "fail",
      verifyProductIdBeforeBuild: true,
    }),
  });
}

export function assertDemFetchPlan(plan) {
  if (!plan?.tileId || !plan?.source?.id || plan?.policy?.fictionalElevationAllowed !== false) {
    throw new Error("Invalid authoritative DEM fetch plan.");
  }
  if (plan.policy.missingSourceAction !== "fail") {
    throw new Error("Missing authoritative DEM source must fail the terrain build.");
  }
  return plan;
}
