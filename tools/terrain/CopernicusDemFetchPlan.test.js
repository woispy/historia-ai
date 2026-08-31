import assert from "node:assert/strict";
import { createDemFetchPlan, assertDemFetchPlan, COPERNICUS_CATALOGUE_URL } from "./CopernicusDemFetchPlan.js";

const plan = createDemFetchPlan({ latitude: 37, longitude: 30 });
assert.equal(plan.tileId, "N37_E030");
assert.equal(plan.source.id, "COPERNICUS_90");
assert.equal(plan.discovery.endpoint, COPERNICUS_CATALOGUE_URL);
assert.equal(plan.discovery.collection, "CCM");
assert.equal(plan.discovery.productType, "SAR_DTE_90_61F6");
assert.equal(plan.download.requiresAuthentication, true);
assert.equal(plan.policy.fictionalElevationAllowed, false);
assert.equal(plan.policy.missingSourceAction, "fail");
assert.doesNotThrow(() => assertDemFetchPlan(plan));
assert.throws(() => assertDemFetchPlan({ ...plan, policy: { ...plan.policy, missingSourceAction: "synthesize" } }));

console.log("Copernicus DEM fetch plan contract: PASS");
