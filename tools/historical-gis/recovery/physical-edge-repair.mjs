import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
} from "./physical-land-authority.mjs";

const EPS = 1e-10;
const GEOMETRY_EPS = 1e-8;
const SAMPLE_COUNT = 256;
const BINARY_ITERATIONS = 32;
const VALIDATION_SAMPLES = 16;
const MAX_BOUNDARY_PROJECTION_DISTANCE = 0.02;
const MAX_BOUNDARY_CANDIDATES = 8;
const INDEX_CELL_SIZE = 0.05;
const MAX_ROUTE_NODES = 24;
const MAX_ROUTE_HOPS = 4;

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sample = (start, end, fraction) => [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
const isValidPhysicalPoint = (point) => isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);

function nearestPointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  if (denominator <= EPS) return { point: [...start], fraction: 0, distance: distance(point, start) };
  const fraction = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  const candidate = [start[0] + dx * fraction, start[1] + dy * fraction];
  return { point: candidate, fraction, distance: distance(point, candidate) };
}

function segmentIntersectionFraction(start, end, boundaryStart, boundaryEnd) {
  const rx = end[0] - start[0];
  const ry = end[1] - start[1];
  const sx = boundaryEnd[0] - boundaryStart[0];
  const sy = boundaryEnd[1] - boundaryStart[1];
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) <= EPS) return null;
  const qx = boundaryStart[0] - start[0];
  const qy = boundaryStart[1] - start[1];
  const t = (qx * sy - qy * sx) / denominator;
  const u = (qx * ry - qy * rx) / denominator;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return Math.max(0, Math.min(1, t));
}

function normalizeRings(geometry) {
  if (!Array.isArray(geometry) || !geometry.length) return [];
  if (Array.isArray(geometry[0]) && Array.isArray(geometry[0][0])) return geometry.filter((ring) => Array.isArray(ring) && ring.length >= 3);
  return geometry.length >= 3 ? [geometry] : [];
}

const lakeRings = (lake) => normalizeRings(lake?.rings ?? lake?.coordinates);

function lakeBoundaryDescriptors() {
  const result = [];
  for (const [lakeIndex, lake] of AUTHORITATIVE_LAKES.entries()) {
    for (const [ringIndex, ring] of lakeRings(lake).entries()) {
      result.push({ lake, lakeIndex, ring, ringIndex });
    }
  }
  return result;
}

const LAKE_BOUNDARIES = lakeBoundaryDescriptors();
const segmentBounds = (start, end) => ({
  minX: Math.min(start[0], end[0]),
  minY: Math.min(start[1], end[1]),
  maxX: Math.max(start[0], end[0]),
  maxY: Math.max(start[1], end[1]),
});
const cellCoordinate = (value) => Math.floor(value / INDEX_CELL_SIZE);
const cellKey = (x, y) => `${x}:${y}`;

function addToGrid(grid, segment) {
  const minX = cellCoordinate(segment.bbox.minX - MAX_BOUNDARY_PROJECTION_DISTANCE);
  const maxX = cellCoordinate(segment.bbox.maxX + MAX_BOUNDARY_PROJECTION_DISTANCE);
  const minY = cellCoordinate(segment.bbox.minY - MAX_BOUNDARY_PROJECTION_DISTANCE);
  const maxY = cellCoordinate(segment.bbox.maxY + MAX_BOUNDARY_PROJECTION_DISTANCE);
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      const key = cellKey(x, y);
      const bucket = grid.get(key);
      if (bucket) bucket.push(segment);
      else grid.set(key, [segment]);
    }
  }
}

function buildBoundarySegments() {
  const segments = [];
  const grid = new Map();
  const appendBoundary = (boundary, kind, metadata = {}) => {
    if (!Array.isArray(boundary) || boundary.length < 3) return;
    for (let segmentIndex = 0; segmentIndex < boundary.length; segmentIndex += 1) {
      const start = boundary[segmentIndex];
      const end = boundary[(segmentIndex + 1) % boundary.length];
      const segment = { boundary, segmentIndex, kind, ...metadata, start, end, bbox: segmentBounds(start, end) };
      segments.push(segment);
      addToGrid(grid, segment);
    }
  };
  for (const descriptor of LAKE_BOUNDARIES) appendBoundary(descriptor.ring, "lake", descriptor);
  for (const polygon of PHYSICAL_LAND_POLYGONS) appendBoundary(polygon, "land");
  return { segments: Object.freeze(segments), grid };
}

const BOUNDARY_INDEX = buildBoundarySegments();

function queryBoundarySegments(point) {
  const x = cellCoordinate(point[0]);
  const y = cellCoordinate(point[1]);
  const result = new Set();
  const radius = Math.ceil(MAX_BOUNDARY_PROJECTION_DISTANCE / INDEX_CELL_SIZE);
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      const bucket = BOUNDARY_INDEX.grid.get(cellKey(x + dx, y + dy));
      if (bucket) for (const segment of bucket) result.add(segment);
    }
  }
  return [...result];
}

function intersectsSegmentBounds(a, b, bbox) {
  const minX = Math.min(a[0], b[0]);
  const maxX = Math.max(a[0], b[0]);
  const minY = Math.min(a[1], b[1]);
  const maxY = Math.max(a[1], b[1]);
  return !(maxX < bbox.minX || minX > bbox.maxX || maxY < bbox.minY || minY > bbox.maxY);
}

function intersections(start, end, boundaries, kind) {
  const result = [];
  const boundarySet = new Set(boundaries);
  for (const descriptor of BOUNDARY_INDEX.segments) {
    if (descriptor.kind !== kind || !boundarySet.has(descriptor.boundary) || !intersectsSegmentBounds(start, end, descriptor.bbox)) continue;
    const fraction = segmentIntersectionFraction(start, end, descriptor.start, descriptor.end);
    if (fraction === null) continue;
    const point = sample(start, end, fraction);
    if (!isFinalPhysicalGeometryBoundaryPoint(point)) continue;
    if (result.some((entry) => Math.abs(entry.fraction - fraction) <= EPS && entry.boundary === descriptor.boundary && entry.segmentIndex === descriptor.segmentIndex)) continue;
    result.push({
      fraction,
      point,
      boundary: descriptor.boundary,
      boundaryIndex: descriptor.boundaryIndex,
      segmentIndex: descriptor.segmentIndex,
      kind,
      distance: 0,
      lake: descriptor.lake,
      lakeIndex: descriptor.lakeIndex,
      ringIndex: descriptor.ringIndex,
    });
  }
  return result.sort((a, b) => a.fraction - b.fraction);
}

function projectedBoundaryCandidates(point, boundaries, kind) {
  const result = [];
  const boundarySet = new Set(boundaries);
  for (const descriptor of queryBoundarySegments(point)) {
    if (descriptor.kind !== kind || !boundarySet.has(descriptor.boundary)) continue;
    const projection = nearestPointOnSegment(point, descriptor.start, descriptor.end);
    if (projection.distance > MAX_BOUNDARY_PROJECTION_DISTANCE) continue;
    result.push({
      point: projection.point,
      boundary: descriptor.boundary,
      boundaryIndex: descriptor.boundaryIndex,
      segmentIndex: descriptor.segmentIndex,
      kind,
      distance: projection.distance,
      lake: descriptor.lake,
      lakeIndex: descriptor.lakeIndex,
      ringIndex: descriptor.ringIndex,
    });
  }
  result.sort((a, b) => a.distance - b.distance);
  return result.slice(0, MAX_BOUNDARY_CANDIDATES);
}

function candidateDescriptors(point) {
  return [
    ...projectedBoundaryCandidates(point, LAKE_BOUNDARIES, "lake"),
    ...projectedBoundaryCandidates(point, PHYSICAL_LAND_POLYGONS, "land"),
  ].filter((candidate) => isFinalPhysicalGeometryBoundaryPoint(candidate.point));
}

function strictPhysicalVertexCandidate(point) {
  if (isValidPhysicalPoint(point)) return [...point];
  const candidates = candidateDescriptors(point).sort((a, b) => a.distance - b.distance);
  return candidates[0]?.point ? [...candidates[0].point] : null;
}

function normalizePhysicalVertices(polygon) {
  return polygon.map((point) => {
    const normalized = strictPhysicalVertexCandidate(point);
    if (!normalized) throw new Error(`No strict authoritative physical boundary for polygon vertex: ${point.join(",")}`);
    return normalized;
  });
}

function locateTransition(start, end, validFraction, invalidFraction) {
  let valid = validFraction;
  let invalid = invalidFraction;
  for (let iteration = 0; iteration < BINARY_ITERATIONS; iteration += 1) {
    const midpoint = (valid + invalid) / 2;
    if (isValidPhysicalPoint(sample(start, end, midpoint))) valid = midpoint;
    else invalid = midpoint;
  }
  return (valid + invalid) / 2;
}

function pathLength(path) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) total += distance(path[index - 1], path[index]);
  return total;
}

function boundaryArcCandidates(boundary, from, to) {
  const count = boundary.length;
  const forward = [from.point];
  let index = (from.segmentIndex + 1) % count;
  let guard = 0;
  while (index !== (to.segmentIndex + 1) % count && guard <= count) {
    forward.push(boundary[index]);
    index = (index + 1) % count;
    guard += 1;
  }
  forward.push(to.point);
  const backward = [from.point];
  index = from.segmentIndex;
  guard = 0;
  while (index !== to.segmentIndex && guard <= count) {
    backward.push(boundary[index]);
    index = (index - 1 + count) % count;
    guard += 1;
  }
  backward.push(to.point);
  return [forward, backward];
}

function isValidPhysicalPath(path) {
  if (!Array.isArray(path) || path.length < 2) return false;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const length = distance(start, end);
    const samples = Math.max(VALIDATION_SAMPLES, Math.ceil(length / 0.01));
    for (let sampleIndex = 1; sampleIndex < samples; sampleIndex += 1) {
      if (!isValidPhysicalPoint(sample(start, end, sampleIndex / samples))) return false;
    }
  }
  return true;
}

function chooseBoundaryArc(boundary, from, to) {
  return boundaryArcCandidates(boundary, from, to)
    .filter(isValidPhysicalPath)
    .sort((a, b) => pathLength(a) - pathLength(b))[0] ?? null;
}

function compatibleBoundaryCandidates(from, to) {
  if (from.kind === "lake" || to.kind === "lake") {
    return from.kind === to.kind && from.lake === to.lake && from.ringIndex === to.ringIndex;
  }
  return true;
}

function chooseBoundaryConnection(from, to) {
  if (!compatibleBoundaryCandidates(from, to)) return null;
  if (from.boundary === to.boundary) return chooseBoundaryArc(from.boundary, from, to);
  const direct = [from.point, to.point];
  return isValidPhysicalPath(direct) ? direct : null;
}

function appendUnique(target, points) {
  for (const point of points) {
    const last = target[target.length - 1];
    if (!last || distance(last, point) > GEOMETRY_EPS) target.push(point);
  }
}

function resolveBoundary(point) {
  if (isValidPhysicalPoint(point)) return [...point];
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  return resolved ? [...resolved] : null;
}

function allSamplesInvalid(start, end) {
  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    if (isValidPhysicalPoint(sample(start, end, index / SAMPLE_COUNT))) return false;
  }
  return true;
}

function routeBoundaryNetwork(startPoint, endPoint) {
  if (isValidPhysicalPath([startPoint, endPoint])) return [startPoint, endPoint];
  const starts = candidateDescriptors(startPoint).slice(0, MAX_BOUNDARY_CANDIDATES);
  const ends = candidateDescriptors(endPoint).slice(0, MAX_BOUNDARY_CANDIDATES);
  const nodes = [...starts, ...ends];
  const deduped = [];
  for (const node of nodes) {
    if (!deduped.some((entry) => entry.boundary === node.boundary && entry.segmentIndex === node.segmentIndex && distance(entry.point, node.point) <= GEOMETRY_EPS)) deduped.push(node);
  }
  const boundedNodes = deduped.slice(0, MAX_ROUTE_NODES);
  const queue = boundedNodes.map((node) => ({ node, path: [node.point], score: distance(startPoint, node.point) + node.distance, hops: 0 }));
  queue.sort((a, b) => a.score - b.score);
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    const key = `${current.node.kind}:${current.node.boundaryIndex}:${current.node.segmentIndex}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (isValidPhysicalPath([current.path[current.path.length - 1], endPoint])) {
      return [...current.path, endPoint];
    }
    if (current.hops >= MAX_ROUTE_HOPS) continue;
    for (const next of boundedNodes) {
      if (next === current.node || !compatibleBoundaryCandidates(current.node, next)) continue;
      const connection = chooseBoundaryConnection(current.node, next);
      if (!connection) continue;
      const path = [...current.path];
      appendUnique(path, connection);
      queue.push({ node: next, path, score: pathLength(path) + next.distance, hops: current.hops + 1 });
    }
  }
  return null;
}

function recoverDegenerateWaterEdge(start, end) {
  if (!allSamplesInvalid(start, end)) return null;
  const boundarySets = [
    { boundaries: LAKE_BOUNDARIES, kind: "lake" },
    { boundaries: PHYSICAL_LAND_POLYGONS, kind: "land" },
  ];
  const startCandidates = boundarySets.flatMap(({ boundaries, kind }) => projectedBoundaryCandidates(start, boundaries, kind));
  const endCandidates = boundarySets.flatMap(({ boundaries, kind }) => projectedBoundaryCandidates(end, boundaries, kind));
  const candidates = [];
  for (const from of startCandidates) {
    for (const to of endCandidates) {
      const path = chooseBoundaryConnection(from, to);
      if (path) candidates.push({ path, score: pathLength(path) + from.distance + to.distance });
    }
  }
  candidates.sort((a, b) => a.score - b.score);
  if (candidates.length) return candidates[0].path;
  return routeBoundaryNetwork(start, end);
}

function waterIntervals(start, end) {
  const states = [];
  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    const fraction = index / SAMPLE_COUNT;
    states.push({ fraction, valid: isValidPhysicalPoint(sample(start, end, fraction)) });
  }
  const intervals = [];
  for (let index = 1; index < states.length; index += 1) {
    const previous = states[index - 1];
    const current = states[index];
    if (previous.valid === current.valid) continue;
    const fraction = locateTransition(
      start,
      end,
      previous.valid ? previous.fraction : current.fraction,
      previous.valid ? current.fraction : previous.fraction,
    );
    if (!current.valid) intervals.push({ entry: fraction, exit: null });
    else if (intervals.length && intervals[intervals.length - 1].exit === null) intervals[intervals.length - 1].exit = fraction;
  }
  return intervals.filter((interval) => interval.exit !== null && interval.exit > interval.entry + EPS);
}

function withinInterval(crossing, interval) {
  return crossing.fraction >= interval.entry - 0.02 && crossing.fraction <= interval.exit + 0.02;
}

function recoveryCandidates(interval, start, end, lakeCrossings, landCrossings) {
  const entryTransition = sample(start, end, interval.entry);
  const exitTransition = sample(start, end, interval.exit);
  const result = [];
  const lakeEntries = [...lakeCrossings.filter((crossing) => withinInterval(crossing, interval)), ...projectedBoundaryCandidates(entryTransition, LAKE_BOUNDARIES, "lake")];
  const lakeExits = [...lakeCrossings.filter((crossing) => withinInterval(crossing, interval)), ...projectedBoundaryCandidates(exitTransition, LAKE_BOUNDARIES, "lake")];
  for (const entry of lakeEntries) {
    for (const exit of lakeExits) {
      if (entry.lake !== exit.lake || entry.ringIndex !== exit.ringIndex || distance(entry.point, exit.point) <= GEOMETRY_EPS) continue;
      const arc = chooseBoundaryArc(entry.boundary, entry, exit);
      if (arc) result.push({ path: arc, score: pathLength(arc) + entry.distance + exit.distance });
    }
  }
  const landEntries = [...landCrossings.filter((crossing) => withinInterval(crossing, interval)), ...projectedBoundaryCandidates(entryTransition, PHYSICAL_LAND_POLYGONS, "land")];
  const landExits = [...landCrossings.filter((crossing) => withinInterval(crossing, interval)), ...projectedBoundaryCandidates(exitTransition, PHYSICAL_LAND_POLYGONS, "land")];
  for (const entry of landEntries) {
    for (const exit of landExits) {
      const connection = chooseBoundaryConnection(entry, exit);
      if (connection) result.push({ path: connection, score: pathLength(connection) + entry.distance + exit.distance });
    }
  }
  return result.sort((a, b) => a.score - b.score);
}

function repairPhysicalEdge(start, end) {
  if (distance(start, end) <= GEOMETRY_EPS) return [start, end];
  const directValid = Array.from({ length: 17 }, (_, index) => isValidPhysicalPoint(sample(start, end, index / 16)));
  if (directValid.every(Boolean)) return [start, end];

  const lakeCrossings = intersections(start, end, LAKE_BOUNDARIES, "lake");
  const landCrossings = intersections(start, end, PHYSICAL_LAND_POLYGONS, "land");
  const intervals = waterIntervals(start, end);
  if (!intervals.length) {
    const degenerate = recoverDegenerateWaterEdge(start, end);
    if (degenerate && isValidPhysicalPath(degenerate)) return degenerate;
    throw new Error(`Physical water crossing has no closed water interval: ${start.join(",")} -> ${end.join(",")}`);
  }

  const repaired = [start];
  let cursor = start;
  for (let intervalIndex = 0; intervalIndex < intervals.length; intervalIndex += 1) {
    const interval = intervals[intervalIndex];
    const entryTransition = sample(start, end, interval.entry);
    const exitTransition = sample(start, end, interval.exit);
    const nextTransition = intervalIndex + 1 < intervals.length ? sample(start, end, intervals[intervalIndex + 1].entry) : end;
    const selected = recoveryCandidates(interval, start, end, lakeCrossings, landCrossings)[0];

    if (!selected) {
      const entry = resolveBoundary(entryTransition);
      const exit = resolveBoundary(exitTransition);
      if (!entry || !exit) throw new Error(`Physical water crossing has no valid boundary recovery path: ${start.join(",")} -> ${end.join(",")}`);
      const prefix = routeBoundaryNetwork(cursor, entry) ?? (isValidPhysicalPath([cursor, entry]) ? [cursor, entry] : null);
      const suffix = routeBoundaryNetwork(exit, nextTransition) ?? (isValidPhysicalPath([exit, nextTransition]) ? [exit, nextTransition] : null);
      if (!prefix || !suffix || !isValidPhysicalPath(prefix) || !isValidPhysicalPath(suffix)) throw new Error(`Physical water crossing has no valid boundary recovery path: ${start.join(",")} -> ${end.join(",")}`);
      appendUnique(repaired, prefix.slice(1));
      appendUnique(repaired, [entry, exit]);
      appendUnique(repaired, suffix.slice(1));
      cursor = suffix[suffix.length - 1];
      continue;
    }

    const pathStart = selected.path[0];
    const pathEnd = selected.path[selected.path.length - 1];
    const prefix = routeBoundaryNetwork(cursor, pathStart) ?? (isValidPhysicalPath([cursor, pathStart]) ? [cursor, pathStart] : null);
    const suffix = routeBoundaryNetwork(pathEnd, nextTransition) ?? (isValidPhysicalPath([pathEnd, nextTransition]) ? [pathEnd, nextTransition] : null);
    if (!prefix || !suffix || !isValidPhysicalPath(prefix) || !isValidPhysicalPath(suffix)) throw new Error(`Physical water crossing has no valid boundary recovery path: ${start.join(",")} -> ${end.join(",")}`);
    appendUnique(repaired, prefix.slice(1));
    appendUnique(repaired, selected.path);
    appendUnique(repaired, suffix.slice(1));
    cursor = suffix[suffix.length - 1];
  }

  if (!isValidPhysicalPath([cursor, end])) throw new Error(`Physical water crossing has invalid valid-span after recovery: ${start.join(",")} -> ${end.join(",")}`);
  appendUnique(repaired, [end]);
  if (!isValidPhysicalPath(repaired)) {
    for (let index = 0; index < repaired.length - 1; index += 1) {
      if (!isValidPhysicalPath([repaired[index], repaired[index + 1]])) throw new Error(`Physical edge repair produced a water segment: ${repaired[index].join(",")} -> ${repaired[index + 1].join(",")}`);
    }
  }
  return repaired;
}

export function repairPhysicalPolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon must contain at least three vertices");
  const normalizedPolygon = normalizePhysicalVertices(polygon);
  const result = [];
  for (let index = 0; index < normalizedPolygon.length; index += 1) {
    appendUnique(result, repairPhysicalEdge(normalizedPolygon[index], normalizedPolygon[(index + 1) % normalizedPolygon.length]).slice(0, -1));
  }
  return result;
}
