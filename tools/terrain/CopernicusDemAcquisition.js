import { assertDemFetchPlan } from "./CopernicusDemFetchPlan.js";

export const COPERNICUS_AUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

export function createCopernicusAcquisitionRequest(plan, { accessToken = null } = {}) {
  assertDemFetchPlan(plan);
  if (!accessToken) throw new Error("Copernicus DEM acquisition requires an access token; anonymous terrain acquisition is not allowed.");
  return Object.freeze({
    method: "GET",
    endpoint: `${plan.download.endpoint}/${encodeURIComponent(plan.tileId)}/$value`,
    headers: Object.freeze({ Authorization: `Bearer ${accessToken}` }),
    tileId: plan.tileId,
    productIdRequired: true,
    fictionalElevationAllowed: false,
  });
}

export function validateAcquiredProduct({ plan, productId, contentType, byteLength, checksum = null } = {}) {
  assertDemFetchPlan(plan);
  if (!productId || typeof productId !== "string") throw new Error("Acquired DEM must expose a Copernicus product ID.");
  if (!contentType || typeof contentType !== "string") throw new Error("Acquired DEM must expose a binary content type.");
  if (!Number.isInteger(byteLength) || byteLength <= 0) throw new Error("Acquired DEM must contain a non-empty binary payload.");
  if (plan.policy.verifyProductIdBeforeBuild && !productId.includes(plan.tileId)) throw new Error("Acquired product ID does not match the requested DEM tile.");
  return Object.freeze({ tileId: plan.tileId, productId, contentType, byteLength, checksum, verified: true });
}
