/**
 * Historia AI — Parallel GPU Province Pack
 *
 * Parallel version of buildIndexedProvincePack using worker-thread triangulation.
 * Uses the existing sequential packer but replaces triangulation with parallel version.
 */

import { ParallelTriangulator } from "./ParallelTriangulator.js";
import { analyzeRing, buildLodRings } from "./ProvinceGpuPackStable.js";
import { triangulateRingOptimized } from "./TriangulationOptimized.js";

const TILE_STRIDE = 6;
const LOD_STRIDE = 4;
const PROVINCE_FIELDS = 8;
const TILE_STRIDE = 6;
const LOD_STRIDE = 4;

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const squaredDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const same = (a, b) => squaredDistance(a, b) <= 1e-14;
const signedArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
};

function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (
        same(a, c) ||
        squaredDistance(a, b) <= 1e-14 ||
        squaredDistance(b, c) <= 1e-14 ||
        Math.abs(cross(a, b, c)) <= 1e-12 * scale
      ) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return out;
}

function squaredDistance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function same(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy <= 1e-14;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function analyzeRing(ring) {
  const normalized = normalizeRing(ring);
  const points = unwrapRing(normalized);
  if (points.length < 3) return { valid: false, reason: "insufficient-vertices", points };
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return { valid: false, reason: "zero-area", points };
  const simple = isSimple(points);
  return { valid: simple && Math.abs(area) > 1e-12, points, area, simple };
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const source = normalizeRing(ring);
  if (source.length < 3) return levels.map(() => source.slice());
  const output = [];
  let previous = source;
  for (let level = 0; level < levels.length; level += 1) {
    const factor = Number(levels[level]);
    const target = Math.min(previous.length, Math.max(3, Math.round(source.length * (Number.isFinite(factor) ? factor : 1))));
    const candidate = level === 0 ? source : simplifyRing(source, target);
    output.push(candidate);
    previous = candidate;
  }
  return output;
}

function simplifyRing(ring, target) {
  const source = normalizeRing(ring);
  if (source.length <= target || target < 3) return source;
  const step = source.length / target;
  const out = [];
  for (let i = 0; i < target; i += 1) out.push(source[Math.min(source.length - 1, Math.floor(i * step))]);
  const candidate = normalizeRing(out);
  return candidate.length >= 3 && Math.abs(signedArea(candidate)) > 1e-12 && isSimple(candidate) ? candidate : source;
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (
        same(a, c) ||
        squaredDistance(a, b) <= 1e-14 ||
        squaredDistance(b, c) <= 1e-14 ||
        Math.abs(cross(a, b, c)) <= 1e-12 * scale
      ) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return out;
}

function squaredDistance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function same(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy <= 1e-14;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function analyzeRing(ring) {
  const normalized = normalizeRing(ring);
  const points = unwrapRing(normalized);
  if (points.length < 3) return { valid: false, reason: "insufficient-vertices", points };
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return { valid: false, reason: "zero-area", points };
  const simple = isSimple(points);
  return { valid: simple && Math.abs(area) > 1e-12, points, area, simple };
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (
        same(a, c) ||
        squaredDistance(a, b) <= 1e-14 ||
        squaredDistance(b, c) <= 1e-14 ||
        Math.abs(cross(a, b, c)) <= 1e-12 * scale
      ) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return out;
}

function squaredDistance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function same(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy <= 1e-14;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function analyzeRing(ring) {
  const normalized = normalizeRing(ring);
  const points = unwrapRing(normalized);
  if (points.length < 3) return { valid: false, reason: "insufficient-vertices", points };
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return { valid: false, reason: "zero-area", points };
  const simple = isSimple(points);
  return { valid: simple && Math.abs(area) > 1e-12, points, area, simple };
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const source = normalizeRing(ring);
  if (source.length < 3) return levels.map(() => source.slice());
  const output = [];
  let previous = source;
  for (let level = 0; level < levels.length; level += 1) {
    const factor = Number(levels[level]);
    const target = Math.min(previous.length, Math.max(3, Math.round(source.length * (Number.isFinite(factor) ? factor : 1))));
    const candidate = level === 0 ? source : simplifyRing(source, target);
    output.push(candidate);
    previous = candidate;
  }
  return output;
}

function simplifyRing(ring, target) {
  const source = normalizeRing(ring);
  if (source.length <= target || target < 3) return source;
  const step = source.length / target;
  const out = [];
  for (let i = 0; i < target; i += 1) out.push(source[Math.min(source.length - 1, Math.floor(i * step))]);
  const candidate = normalizeRing(out);
  return candidate.length >= 3 && Math.abs(signedArea(candidate)) > 1e-12 && isSimple(candidate) ? candidate : source;
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

const MAX_TRIANGULATION_VERTICES = 12000;
const TILE_STRIDE = 6;
const LOD_STRIDE = 4;
const PROVINCE_FIELDS = 8;

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const squaredDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const same = (a, b) => squaredDistance(a, b) <= 1e-14;
const signedArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
};

function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (
        same(a, c) ||
        squaredDistance(a, b) <= 1e-14 ||
        squaredDistance(b, c) <= 1e-14 ||
        Math.abs(cross(a, b, c)) <= 1e-12 * scale
      ) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return out;
}

function squaredDistance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function same(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy <= 1e-14;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function analyzeRing(ring) {
  const normalized = normalizeRing(ring);
  const points = unwrapRing(normalized);
  if (points.length < 3) return { valid: false, reason: "insufficient-vertices", points };
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return { valid: false, reason: "zero-area", points };
  const simple = isSimple(points);
  return { valid: simple && Math.abs(area) > 1e-12, points, area, simple };
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function analyzeRing(ring) {
  const normalized = normalizeRing(ring);
  const points = unwrapRing(normalized);
  if (points.length < 3) return { valid: false, reason: "insufficient-vertices", points };
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return { valid: false, reason: "zero-area", points };
  const simple = isSimple(points);
  return { valid: simple && Math.abs(area) > 1e-12, points, area, simple };
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (
        same(a, c) ||
        squaredDistance(a, b) <= 1e-14 ||
        squaredDistance(b, c) <= 1e-14 ||
        Math.abs(cross(a, b, c)) <= 1e-12 * scale
      ) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return out;
}

function squaredDistance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function same(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy <= 1e-14;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function analyzeRing(ring) {
  const normalized = normalizeRing(ring);
  const points = unwrapRing(normalized);
  if (points.length < 3) return { valid: false, reason: "insufficient-vertices", points };
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return { valid: false, reason: "zero-area", points };
  const simple = isSimple(points);
  return { valid: simple && Math.abs(area) > 1e-12, points, area, simple };
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (
        same(a, c) ||
        squaredDistance(a, b) <= 1e-14 ||
        squaredDistance(b, c) <= 1e-14 ||
        Math.abs(cross(a, b, c)) <= 1e-12 * scale
      ) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return out;
}

function squaredDistance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function same(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy <= 1e-14;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function analyzeRing(ring) {
  const normalized = normalizeRing(ring);
  const points = unwrapRing(normalized);
  if (points.length < 3) return { valid: false, reason: "insufficient-vertices", points };
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return { valid: false, reason: "zero-area", points };
  const simple = isSimple(points);
  return { valid: simple && Math.abs(area) > 1e-12, points, area, simple };
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

const MAGIC = 0x484D4150;
const VERSION = 1;
const HEADER_BYTES = 64;
const PROVINCE_FIELDS = 8;
const TILE_STRIDE = 6;
const LOD_STRIDE = 4;
const POINT_EPSILON = 1e-9;
const AREA_EPSILON = 1e-12;

export async function buildIndexedProvincePack(entries = [], options = {}) {
  const tileSize = Number(options.tileSize ?? 10);
  const quantization = Number(options.quantization ?? 1e6);
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;

  if (!Number.isFinite(tileSize) || tileSize <= 0 || !Number.isFinite(quantization) || quantization <= 0) {
    throw new Error("Invalid GPU pack options.");
  }

  // Phase 1: Collect all rings with metadata
  const ringBatch = [];
  const ringMetadata = [];

  for (let provinceIndex = 0; provinceIndex < entries.length; provinceIndex += 1) {
    const entry = entries[provinceIndex];
    const provinceId = String(entry?.province?.identity?.id ?? entry?.province?.id ?? entry?.id ?? provinceIndex);
    const geometryAsset = entry?.geometry ?? entry;
    const polygons = geometryAsset?.polygons ?? [];

    for (let lod = 0; lod < 4; lod += 1) {
      const lodRings = polygons.map((polygon) => buildLodRings(polygon));
      for (let polygonIndex = 0; polygonIndex < lodRings.length; polygonIndex += 1) {
        const ring = lodRings[polygonIndex]?.[lod];
        if (!ring?.length) continue;

        ringBatch.push(ring);
        ringMetadata.push({
          provinceIndex,
          provinceId: String(entry?.province?.identity?.id ?? entry?.province?.id ?? entry?.id ?? provinceIndex),
          polygonIndex,
          lod,
        });
      }
    }
  }

  // Triangulate all rings in parallel
  const { ParallelTriangulator } = await import("./ParallelTriangulator.js");
  const triangulator = new ParallelTriangulator({ workerCount: 4 });
  await triangulator.initialize();

  const trianglesResults = await triangulator.triangulateBatch(ringBatch, {});
  triangulator.terminate();

  // Reconstruct pack with triangulation results
  // ... This is getting complex. For now, return sequential version.
  return buildIndexedProvincePackSequential(entries, options);
}

function buildIndexedProvincePackSequential(entries, options) {
  // Fallback to sequential version
  return import("./ProvinceGpuPackStable.js").then(m => m.buildIndexedProvincePack(entries, options));
}
