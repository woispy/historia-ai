import assert from "node:assert/strict";
import { createDemFetchPlan } from "./CopernicusDemFetchPlan.js";
import { createCopernicusAcquisitionRequest, validateAcquiredProduct } from "./CopernicusDemAcquisition.js";

const plan = createDemFetchPlan({ latitude: 37, longitude: 30 });
assert.throws(() => createCopernicusAcquisitionRequest(plan), /access token/);
const request = createCopernicusAcquisitionRequest(plan, { accessToken: "test-token" });
assert.equal(request.method, "GET");
assert.equal(request.tileId, "N37_E030");
assert.match(request.headers.Authorization, /^Bearer /);
assert.equal(request.fictionalElevationAllowed, false);
assert.equal(validateAcquiredProduct({ plan, productId: "COP-DEM_N37_E030", contentType: "image/tiff", byteLength: 1024 }).verified, true);
assert.throws(() => validateAcquiredProduct({ plan, productId: "COP-DEM_N38_E031", contentType: "image/tiff", byteLength: 1024 }), /does not match/);
assert.throws(() => validateAcquiredProduct({ plan, productId: "COP-DEM_N37_E030", contentType: "image/tiff", byteLength: 0 }), /non-empty/);
console.log("Phase E Copernicus acquisition contract: PASS");
