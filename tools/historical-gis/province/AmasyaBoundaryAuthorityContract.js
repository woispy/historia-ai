export const AMASYA_BOUNDARY_AUTHORITY_CONTRACT = Object.freeze({
  schemaVersion: 1,
  phase: "2.8-C",
  authoritativePoliticalGeometry: false,
  candidateOnly: true,
  finalBoundaryClasses: Object.freeze(["LAND", "LAKE_BOUNDARY"]),
  rejectedFinalClasses: Object.freeze(["LAKE_INTERIOR", "WATER", "UNKNOWN"]),
});

function asBoolean(value) {
  return value === true;
}

export function classifyAmasyaBoundaryPoint(point = {}) {
  if (asBoolean(point.isLakeBoundary)) return "LAKE_BOUNDARY";
  if (asBoolean(point.isLakeInterior)) return "LAKE_INTERIOR";
  if (asBoolean(point.isLand)) return "LAND";
  if (asBoolean(point.isWater)) return "WATER";
  return "UNKNOWN";
}

export function isFinalAmasyaBoundaryPoint(point = {}) {
  return AMASYA_BOUNDARY_AUTHORITY_CONTRACT.finalBoundaryClasses.includes(
    classifyAmasyaBoundaryPoint(point),
  );
}

export function explainAmasyaBoundaryClass(point = {}) {
  const classification = classifyAmasyaBoundaryPoint(point);
  const explanations = {
    LAND: "Physical land boundary; eligible for final physical boundary semantics.",
    LAKE_BOUNDARY: "Authoritative lake shoreline; eligible for final physical boundary semantics.",
    LAKE_INTERIOR: "Lake interior; recovery support only, not a final physical boundary.",
    WATER: "Generic water point; not a final physical boundary.",
    UNKNOWN: "Unclassified point; not eligible for final physical boundary semantics.",
  };
  return Object.freeze({ classification, explanation: explanations[classification] });
}
