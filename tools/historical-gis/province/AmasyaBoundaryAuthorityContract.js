/**
 * Candidate-only decision contract for the Amasya / Edge-3 physical-boundary
 * ambiguity identified during Phase 2.8-C.
 *
 * This contract classifies an already-sampled point; it does not create or
 * mutate political geometry. Lake interiors are never final physical-land
 * boundary points. A lake boundary may bind an edge; generic water may not.
 */

export const AMASYA_BOUNDARY_AUTHORITY_CONTRACT = Object.freeze({
  schemaVersion: 1,
  phase: "2.8-C",
  authoritativePoliticalGeometry: false,
  candidateOnly: true,
  classes: Object.freeze([
    "LAND",
    "LAKE_BOUNDARY",
    "LAKE_INTERIOR",
    "WATER",
    "UNKNOWN",
  ]),
  finalBoundaryClasses: Object.freeze(["LAND", "LAKE_BOUNDARY"]),
  rejectedFinalClasses: Object.freeze(["LAKE_INTERIOR", "WATER", "UNKNOWN"]),
});

export function classifyAmasyaBoundaryPoint(point) {
  if (!point || typeof point !== "object") return "UNKNOWN";
  if (point.isLakeBoundary === true) return "LAKE_BOUNDARY";
  if (point.isLakeInterior === true) return "LAKE_INTERIOR";
  if (point.isLand === true) return "LAND";
  if (point.isWater === true) return "WATER";
  return "UNKNOWN";
}

export function isFinalAmasyaBoundaryPoint(point) {
  const classification = classifyAmasyaBoundaryPoint(point);
  return AMASYA_BOUNDARY_AUTHORITY_CONTRACT.finalBoundaryClasses.includes(classification);
}

export function explainAmasyaBoundaryDecision(point) {
  const classification = classifyAmasyaBoundaryPoint(point);
  const finalBoundary = isFinalAmasyaBoundaryPoint(point);
  return Object.freeze({
    classification,
    finalBoundary,
    candidateOnly: true,
    reason: finalBoundary
      ? classification === "LAKE_BOUNDARY"
        ? "lake-boundary point may bind a physical edge"
        : "land point is eligible for physical edge binding"
      : classification === "LAKE_INTERIOR"
        ? "lake interior is excluded from final physical-land boundary"
        : classification === "WATER"
          ? "generic water point cannot bind a final physical-land edge"
          : "unknown physical classification requires review",
  });
}
