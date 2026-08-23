/**
 * Global historical political coverage contract.
 *
 * The physical world land mask is the only coastline authority. Historical
 * political data may remain source-derived and incomplete, but the renderer
 * must explicitly declare the two presentation guarantees that make the map
 * visually complete: neutral land underneath unresolved political geometry
 * and a physical-land clip around every political fill.
 */

export const HISTORICAL_POLITICAL_COVERAGE_CONTRACT = Object.freeze({
  neutralLandFallback: true,
  landClip: "world-land-mask",
  sourceOfTruth: "physical-world-land-mask",
});

export function assertHistoricalPoliticalCoverageContract(contract = {}) {
  if (contract.neutralLandFallback !== true) {
    throw new Error("Historical political coverage requires a neutral land fallback.");
  }
  if (contract.landClip !== "world-land-mask") {
    throw new Error("Historical political coverage requires the canonical world-land-mask clip.");
  }
  if (contract.sourceOfTruth !== "physical-world-land-mask") {
    throw new Error("Historical political coverage must use the physical world land mask as its coastline authority.");
  }
  return true;
}
