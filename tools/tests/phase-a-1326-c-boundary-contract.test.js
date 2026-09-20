import fs from "node:fs/promises";
import path from "node:path";

const CURRENT_AUTHORITY = "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js";
const LEGACY_AUTHORITY = "tools/historical-gis/recovery/physical-land-authority.mjs";

const currentSource = await fs.readFile(CURRENT_AUTHORITY, "utf8");
const currentExports = currentSource.match(/export\s*\{([^}]+)\}/)?.[1] ?? "";
const legacyPresent = await fs.access(LEGACY_AUTHORITY).then(() => true).catch(() => false);

const report = {
  schemaVersion: 1,
  authorityPath: CURRENT_AUTHORITY,
  requiredCurrentPredicate: "isPhysicalLandPoint",
  currentPredicateExported: currentExports.split(",").map((value) => value.trim()).includes("isPhysicalLandPoint"),
  legacyForensicAuthorityPath: LEGACY_AUTHORITY,
  legacyForensicAuthorityPresent: legacyPresent,
  geometryBoundaryPredicateExposed: /isPhysicalGeometryBoundaryPoint/.test(currentExports),
  finalGeometryBoundaryPredicateExposed: /isFinalPhysicalGeometryBoundaryPoint/.test(currentExports),
  resolverExposed: /resolvePhysicalGeometryBoundaryPoint/.test(currentExports),
  decision: {
    currentPhysicalLandContract: "BOUND",
    explicitGeometryBoundaryContract: "OPEN",
    legacyAuthorityReintroduction: legacyPresent ? "REVIEW_REQUIRED" : "ABSENT",
    productionMutation: false,
    promotion: "BLOCKED",
  },
};

if (!report.currentPredicateExported) {
  throw new Error("Current physical authority does not export isPhysicalLandPoint");
}
if (report.geometryBoundaryPredicateExposed || report.finalGeometryBoundaryPredicateExposed || report.resolverExposed) {
  throw new Error("C boundary-recovery contract unexpectedly appeared without forensic review");
}
if (legacyPresent) {
  throw new Error("Legacy forensic physical-land authority unexpectedly exists on the staging branch");
}

const output = process.argv[2] ?? "data/build/gis/1326/c-boundary-contract.json";
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
