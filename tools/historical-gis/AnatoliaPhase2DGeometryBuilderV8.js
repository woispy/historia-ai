import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import {
  ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST,
  ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS,
} from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_TOLERANCE = 0.055;
const SAMPLE_STEP = 0.06;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const MAINLAND_MIN_AREA = 5;
const MAX_AREA_RATIO = 4.2;
const MAX_WEIGHT_ITERATIONS = 24;
const MAX_WEIGHT_STEP = 4;

const rawAnchor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor ?? item.centroid;

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      (a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]
    ) inside = !inside;
  }
  return inside;
}

function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = dx * dx + dy * dy;
  const t = d < EPS
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
}

function distanceToPolygon(point, polygon) {
  let distance = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    distance = Math.min(distance, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return distance;
}

function signedArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    sum += polygon[i][0] * polygon[(i + 1) % polygon.length][1]
      - polygon[(i + 1) % polygon.length][0] * polygon[i][1];
  }
  return sum / 2;
}

function area(polygon) {
  return Math.abs(signedArea(polygon));
}

function cross(a, b, point) {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
}

function landPolygons() {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.filter((polygon) => area(polygon) >= MAINLAND_MIN_AREA);
}

function isCoastCorrectionLandPoint(point) {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.some((correction) => pointInPolygon(point, correction.coordinates));
}

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function isStaticLandPoint(point) {
  if (isCoastCorrectionLandPoint(point)) return true;
  if (ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))) return true;
  let distance = Infinity;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) distance = Math.min(distance, distanceToPolygon(point, polygon));
  return distance <= COAST_TOLERANCE;
}

function isPhysicalLandPoint(point) {
  // Explicit physical-coast corrections are authoritative land geometry. They
  // reconcile omissions in the lightweight mainland mask and therefore must
  // take precedence over coarse generated lake coverage at the corrected shore.
  if (isCoastCorrectionLandPoint(point)) return true;
  return isStaticLandPoint(point) && !inLake(point);
}

function halfPlane(polygon, a, b, c) {
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);
    if (currentInside && nextInside) output.push(next);
    else if (currentInside !== nextInside) {
      const cv = a * current[0] + b * current[1] - c;
      const nv = a * next[0] + b * next[1] - c;
      const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv);
      output.push([
        current[0] + (next[0] - current[0]) * t,
        current[1] + (next[1] - current[1]) * t,
      ]);
      if (!currentInside && nextInside) output.push(next);
    }
  }
  return output;
}
