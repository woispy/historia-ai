/**
 * Historia AI — P3 Province Proof Group
 *
 * Editorial validation for PARTIALLY authored province boundary source
 * documents. The golden dataset requires all 38 provinces before promotion;
 * this module lets the editorial team validate incremental work:
 *
 *  - Per-province, fail-closed diagnostics with exact error attribution
 *    (the editor knows WHICH province to fix).
 *  - Pairwise shared-edge consistency between entered provinces (winding
 *    mismatch and non-manifold segments are attributed to every province
 *    involved).
 *  - When every entered province is ready, the group flows through the
 *    proven import + face assembly pipeline and must satisfy planar Euler
 *    characteristic 2.
 *
 * This is a PROOF artifact, never production authority: the result is
 * explicitly marked notProductionAuthority and never writes to the golden
 * fixture. A valid proof group still requires the full 38-province manifest
 * before the PoliticalGeographyDatasetBuilder will promote anything.
 */

import { importReviewedProvinceSource, validateProvinceRing } from "./ProvinceSourceImporter.js";
import { AuthoritativeArcRegistry } from "./AuthoritativeArcGenerator.js";
import { assembleFullFaces } from "./FullFaceAssembly.js";

const ALLOWED_REVIEW_STATUSES = new Set(["reviewed", "verified"]);

function canonicalLon(lon) {
  let n = Number(lon);
  if (!Number.isFinite(n)) return NaN;
  n = ((n + 180) % 360 + 360) % 360 - 180;
  return Object.is(n, -0) ? 0 : n;
}

function unwrapLongitudes(points) {
  if (!points.length) return [];
  const result = [{ lon: canonicalLon(points[0].lon), lat: Number(points[0].lat) }];
  for (let i = 1; i < points.length; i += 1) {
    let lon = canonicalLon(points[i].lon);
    const previous = result[i - 1].lon;
    while (lon - previous > 180) lon -= 360;
    while (lon - previous < -180) lon += 360;
    result.push({ lon, lat: Number(points[i].lat) });
  }
  return result;
}

function orient(a, b, c, epsilon) {
  const value = (b.lon - a.lon) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lon - a.lon);
  if (Math.abs(value) <= epsilon) return 0;
  return value > 0 ? 1 : -1;
}

function segmentsIntersect(a, b, c, d, epsilon) {
  const o1 = orient(a, b, c, epsilon);
  const o2 = orient(a, b, d, epsilon);
  const o3 = orient(c, d, a, epsilon);
  const o4 = orient(c, d, b, epsilon);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && Math.min(a.lon, b.lon) - epsilon <= c.lon && c.lon <= Math.max(a.lon, b.lon) + epsilon && Math.min(a.lat, b.lat) - epsilon <= c.lat && c.lat <= Math.max(a.lat, b.lat) + epsilon) ||
    (o2 === 0 && Math.min(a.lon, b.lon) - epsilon <= d.lon && d.lon <= Math.max(a.lon, b.lon) + epsilon && Math.min(a.lat, b.lat) - epsilon <= d.lat && d.lat <= Math.max(a.lat, b.lat) + epsilon) ||
    (o3 === 0 && Math.min(c.lon, d.lon) - epsilon <= a.lon && a.lon <= Math.max(c.lon, d.lon) + epsilon && Math.min(c.lat, d.lat) - epsilon <= a.lat && a.lat <= Math.max(c.lat, d.lat) + epsilon) ||
    (o4 === 0 && Math.min(c.lon, d.lon) - epsilon <= b.lon && b.lon <= Math.max(c.lon, d.lon) + epsilon && Math.min(c.lat, d.lat) - epsilon <= b.lat && b.lat <= Math.max(c.lat, d.lat) + epsilon);
}

/** Detect self-intersections in a single province ring. Bounded O(n²). */
function ringSelfIntersections(ring, maxIntersections = 8) {
  if (!Array.isArray(ring) || ring.length < 4) return [];
  const points = unwrapLongitudes(ring.map(([lon, lat]) => ({ lon, lat })));
  if (points.length > 2 && points[0].lon === points.at(-1).lon && points[0].lat === points.at(-1).lat) points.pop();
  const n = points.length;
  if (n < 3) return [];
  const epsilon = 1e-9;
  const intersections = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n], epsilon)) {
        intersections.push({ segments: [i, j] });
        if (intersections.length >= maxIntersections) return intersections;
      }
    }
  }
  return intersections;
}

function ringInsideBbox(ring, bbox) {
  const [minX, minY, maxX, maxY] = bbox;
  return ring.every(([lon, lat]) => Number(lon) >= minX && Number(lon) <= maxX && Number(lat) >= minY && Number(lat) <= maxY);
}

function segmentKey(a, b) {
  return a === b ? a : (a < b ? `${a}|${b}` : `${b}|${a}`);
}

function quantizedKey(lon, lat, tolerance) {
  return `${Math.round(canonicalLon(lon) / tolerance)}:${Math.round(Number(lat) / tolerance)}`;
}

/**
 * Validate a partially authored source document as a proof group.
 * Returns a per-province diagnostic report; when every entered province is
 * ready, the group is validated end to end through the proven import +
 * face assembly pipeline (Euler must equal 2).
 */
export function validateProofGroup({ sourceDocument, coverage = null, provincesManifest = null, tolerance = 1e-7 } = {}) {
  if (!sourceDocument || typeof sourceDocument !== "object") throw new Error("sourceDocument must be an object");
  if (!Array.isArray(sourceDocument.provinces)) throw new Error("sourceDocument.provinces must be an array");

  const declaredSource = provincesManifest ?? coverage;
  const declaredSet = declaredSource && Array.isArray(declaredSource.provinces) ? new Set(declaredSource.provinces.map((entry) => String(entry.provinceId))) : null;
  const bbox = coverage && Array.isArray(coverage.bbox) && coverage.bbox.length === 4 ? coverage.bbox : null;

  const provinces = [];
  const groupErrors = [];
  const byId = new Map();
  const seen = new Set();

  for (const entry of sourceDocument.provinces) {
    const provinceId = String(entry?.provinceId ?? "");
    if (!provinceId) {
      groupErrors.push({ code: "missing-province-id", provinceIds: [], message: "source document contains a province without provinceId" });
      continue;
    }
    if (seen.has(provinceId)) {
      groupErrors.push({ code: "duplicate-province", provinceIds: [provinceId], message: `duplicate province entry ${provinceId}` });
      continue;
    }
    seen.add(provinceId);

    const errors = [];
    if (declaredSet && !declaredSet.has(provinceId)) {
      errors.push("not declared in the coverage manifest");
    }
    if (!ALLOWED_REVIEW_STATUSES.has(entry.reviewStatus)) {
      errors.push(`reviewStatus must be "reviewed" or "verified" (got ${JSON.stringify(entry.reviewStatus ?? null)})`);
    }
    const confidence = entry.confidence == null ? NaN : Number(entry.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      errors.push("confidence must be a number in [0, 1]");
    }
    if (typeof entry.sourceRef !== "string" || !entry.sourceRef.trim()) {
      errors.push("province needs a sourceRef citation");
    }
    if (!Array.isArray(entry.ring) || entry.ring.length === 0) {
      errors.push("ring is empty (geometry pending)");
    } else {
      const ringCheck = validateProvinceRing(entry.ring, tolerance);
      if (!ringCheck.valid) errors.push(...ringCheck.errors.map((message) => `ring invalid: ${message}`));
      else {
        const selfIntersections = ringSelfIntersections(entry.ring);
        if (selfIntersections.length) {
          errors.push(`ring self-intersects at ${selfIntersections.length} segment pair(s) (first: segments ${selfIntersections[0].segments.join(" and ")})`);
        }
        if (bbox && !ringInsideBbox(entry.ring, bbox)) {
          errors.push("ring is outside the declared coverage bbox");
        }
      }
    }
    const record = { provinceId, declared: !declaredSet || declaredSet.has(provinceId), ready: errors.length === 0, errors };
    provinces.push(record);
    byId.set(provinceId, { entry, record });
  }

  // Pairwise shared-edge checks with attribution to every province involved.
  const entered = [...byId.entries()].filter(([, { record }]) => record.ready);
  if (entered.length >= 2) {
    const segmentIndex = new Map();
    for (const [provinceId, { entry }] of entered) {
      const keys = entry.ring.map(([lon, lat]) => quantizedKey(lon, lat, tolerance));
      const distinct = [];
      for (const key of keys) {
        if (!distinct.length || distinct.at(-1) !== key) distinct.push(key);
      }
      if (distinct.length > 1 && distinct[0] === distinct.at(-1)) distinct.pop();
      if (distinct.length < 3) continue;
      for (let i = 0; i < distinct.length; i += 1) {
        const from = distinct[i];
        const to = distinct[(i + 1) % distinct.length];
        const key = segmentKey(from, to);
        const list = segmentIndex.get(key) ?? [];
        list.push({ provinceId, from, to });
        segmentIndex.set(key, list);
      }
    }
    for (const [key, list] of segmentIndex) {
      if (list.length === 1) continue;
      if (list.length > 2) {
        const message = `non-manifold boundary segment ${key} is incident to ${list.length} provinces`;
        groupErrors.push({ code: "non-manifold-segment", provinceIds: list.map((item) => item.provinceId), message });
        for (const { provinceId } of list) byId.get(provinceId).record.errors.push(message);
        for (const { provinceId } of list) byId.get(provinceId).record.ready = false;
        continue;
      }
      const [first, second] = list;
      if (first.from === second.from) {
        const message = `provinces ${first.provinceId} and ${second.provinceId} traverse shared segment ${key} in the same direction (inconsistent winding / overlapping geometry)`;
        groupErrors.push({ code: "winding-mismatch", provinceIds: [first.provinceId, second.provinceId], message });
        for (const { provinceId } of [first, second]) {
          byId.get(provinceId).record.errors.push(message);
          byId.get(provinceId).record.ready = false;
        }
      }
    }
  }

  const readyCount = provinces.filter((record) => record.ready).length;
  const allReady = provinces.length > 0 && readyCount === provinces.length && groupErrors.length === 0;

  let topology = null;
  let eulerCharacteristic = null;
  let assemblyErrors = [];
  let intakeReport = null;
  if (allReady) {
    try {
      const { registry, report } = importReviewedProvinceSource(sourceDocument, { tolerance, createRegistry: (options) => new AuthoritativeArcRegistry(options) });
      const assembly = assembleFullFaces({ topology: registry.toTopology() });
      if (!assembly.validation?.valid) {
        assemblyErrors = assembly.validation.errors ?? [];
        groupErrors.push({ code: "topology-validation", provinceIds: [], message: `assembled topology failed planar validation: ${assemblyErrors.join("; ")}` });
      } else {
        topology = assembly.topology;
        eulerCharacteristic = assembly.eulerCharacteristic;
      }
      intakeReport = report;
    } catch (error) {
      groupErrors.push({ code: "intake", provinceIds: [], message: error.message });
    }
  }

  const valid = allReady && assemblyErrors.length === 0 && eulerCharacteristic === 2 && groupErrors.every((item) => item.code !== "intake" && item.code !== "topology-validation");

  return {
    status: valid ? "valid" : "invalid",
    sourceId: sourceDocument.sourceId ?? null,
    coverageId: coverage?.coverageId ?? null,
    provinceCount: provinces.length,
    readyCount,
    pendingCount: provinces.length - readyCount,
    provinces,
    groupErrors,
    topology,
    eulerCharacteristic,
    arcCount: intakeReport ? intakeReport.arcCount : null,
    nodeCount: intakeReport ? intakeReport.nodeCount : null,
    sharedEdgeCount: intakeReport ? intakeReport.sharedEdgeCount : null,
    worldEdgeCount: intakeReport ? intakeReport.worldEdgeCount : null,
    notProductionAuthority: true,
    note: "Proof group artifact. Production authority still requires the full declared province manifest via PoliticalGeographyDatasetBuilder.",
  };
}
