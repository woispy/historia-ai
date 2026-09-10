import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");

const PAIRS = [
  { key: "43↔51", a: { index: 43, point: [29.88195225008904, 40.757656227209125], provinceId: "bithynia-nicomedia", kind: "province-micro-control" }, b: { index: 51, point: [29.84813149673761, 40.73485859651603], provinceId: "bithynia-nicomedia", kind: "province-micro-control" } },
  { key: "43↔717", a: { index: 43, point: [29.88195225008904, 40.757656227209125], provinceId: "bithynia-nicomedia", kind: "province-micro-control" }, b: { index: 717, point: [29.90964745933518, 40.711316217251984], provinceId: "bithynia-nicaea", kind: "province-shape-control" } },
  { key: "44↔717", a: { index: 44, point: [29.916587269841497, 40.73014584999194], provinceId: "bithynia-nicomedia", kind: "province-micro-control" }, b: { index: 717, point: [29.90964745933518, 40.711316217251984], provinceId: "bithynia-nicaea", kind: "province-shape-control" } },
  { key: "45↔53", a: { index: 45, point: [29.932992407788362, 40.732168831106335], provinceId: "bithynia-nicomedia", kind: "province-micro-control" }, b: { index: 53, point: [29.968695933460715, 40.70652791113891], provinceId: "bithynia-nicomedia", kind: "province-micro-control" } },
  { key: "54↔60", a: { index: 54, point: [30.01351590401345, 40.69480175735732], provinceId: "bithynia-nicomedia", kind: "province-micro-control" }, b: { index: 60, point: [30.02740128985282, 40.71647465144485], provinceId: "bithynia-nicomedia", kind: "province-micro-control" } },
  { key: "shape↔barrier", a: { point: [30.03135743224865, 40.70934144674521], provinceId: "bithynia-nicomedia", kind: "province-shape-control" }, b: { index: 1672, point: [30.035, 40.7], provinceId: null, kind: "coastline-barrier" } },
];

function plane(a, b, wa = 0, wb = 0) {
  return {
    a: 2 * (b[0] - a[0]),
    b: 2 * (b[1] - a[1]),
    c: b[0] ** 2 + b[1] ** 2 - a[0] ** 2 - a[1] ** 2 + wa - wb,
  };
}

async function loadInstrumentedV15() {
  const sourcePath = path.join(ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  let instrumented = source;
  instrumented = instrumented.replace(
    "function buildControlSites() {\n  return ANATOLIA_PROVINCE_METADATA.map((item) => {",
    "function buildControlSites() {\n  const __result = ANATOLIA_PROVINCE_METADATA.map((item) => {",
  );
  instrumented = instrumented.replace(
    "  });\n}\n\nfunction polygonCentroid(polygon) {",
    "  });\n  globalThis.__V15_FORENSIC.sites = __result;\n  return __result;\n}\n\nfunction polygonCentroid(polygon) {",
  );
  instrumented = instrumented.replace(
    "  const solved = solveWeights(controlSites);",
    "  const solved = solveWeights(controlSites);\n  globalThis.__V15_FORENSIC.weights = solved.weights;",
  );
  const sourceDir = path.dirname(sourcePath);
  const tempPath = path.join(sourceDir, `.v4-v15-${process.pid}.mjs`);
  fs.writeFileSync(tempPath, `globalThis.__V15_FORENSIC = { sites: null, weights: null };\n${instrumented}`, "utf8");
  try {
    const mod = await import(`file://${tempPath}?v4=${process.pid}`);
    mod.buildAnatoliaPhase2DAssets();
    return globalThis.__V15_FORENSIC;
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const state = await loadInstrumentedV15();
assert.ok(state.sites?.length, "V15 control-site capture failed");
assert.ok(state.weights, "V15 solved-weight capture failed");

const targetSites = state.sites.filter((site) => site.provinceId === "bithynia-nicomedia" || site.provinceId === "bithynia-nicaea");
const nicomedia = state.sites.find((site) => site.provinceId === "bithynia-nicomedia");
const nicaea = state.sites.find((site) => site.provinceId === "bithynia-nicaea");
assert.ok(nicomedia && nicaea, "V15 target province anchors not found");

const v15ProvincePair = {
  a: nicomedia,
  b: nicaea,
  plane: plane(nicomedia.point, nicaea.point, state.weights[nicomedia.provinceId] ?? 0, state.weights[nicaea.provinceId] ?? 0),
};

const matrix = PAIRS.map((pair) => {
  const canonicalPlane = plane(pair.a.point, pair.b.point);
  const candidates = [];
  const isCrossProvince =
    (pair.a.provinceId === "bithynia-nicomedia" && pair.b.provinceId === "bithynia-nicaea")
    || (pair.a.provinceId === "bithynia-nicaea" && pair.b.provinceId === "bithynia-nicomedia");
  if (isCrossProvince) candidates.push({ kind: "province-control-pair", a: v15ProvincePair.a, b: v15ProvincePair.b, plane: v15ProvincePair.plane });
  return {
    key: pair.key,
    canonical: { a: pair.a, b: pair.b, plane: canonicalPlane, planeSource: "derived-from-resolved-canonical-site-pair" },
    v15: {
      candidateCount: candidates.length,
      candidates,
      absenceReason: candidates.length ? null : "V15 exposes one political control site per province and no equivalent micro-control/barrier site pair for this canonical topology class",
    },
    classification: candidates.length ? "V15_EQUIVALENT_PROVINCE_PAIR" : "NO_EQUIVALENT_V15_SITE_PAIR",
  };
});

console.log(JSON.stringify({
  schema: "phase2d-v15-site-pair-forensics-v4",
  canonicalBaseline: "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
  v15: {
    targetSiteCount: targetSites.length,
    targetSites: targetSites.map((site) => ({ point: site.point, provinceId: site.provinceId, kind: site.kind, historicalAnchor: site.historicalAnchor })),
    targetWeights: {
      "bithynia-nicomedia": state.weights["bithynia-nicomedia"],
      "bithynia-nicaea": state.weights["bithynia-nicaea"],
    },
  },
  matrix,
}, null, 2));
