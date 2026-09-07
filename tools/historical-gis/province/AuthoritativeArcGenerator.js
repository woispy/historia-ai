/**
 * Historia AI — P3.9 Authoritative Arc Generation
 *
 * Converts least-cost solver paths into the single authoritative border graph.
 * Geometry is registered once, then reused by reverse traversals. Faces never
 * own independent copies of border geometry; they only reference arcId and
 * direction.
 */

const WORLD_WIDTH = 360;
const HALF_WORLD = 180;
const DEFAULT_TOLERANCE = 1e-7;

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function assertId(value, name) {
  if (value === null || value === undefined || value === "") throw new Error(`${name} is required`);
  return String(value);
}

function positiveFinite(value, name) {
  const number = finite(value, name);
  if (number <= 0) throw new Error(`${name} must be > 0`);
  return number;
}

function canonicalLongitude(lon) {
  let value = finite(lon, "longitude");
  value = ((value + HALF_WORLD) % WORLD_WIDTH + WORLD_WIDTH) % WORLD_WIDTH - HALF_WORLD;
  return Object.is(value, -0) ? 0 : value;
}

function wrappedDelta(a, b) {
  let delta = canonicalLongitude(a) - canonicalLongitude(b);
  if (delta > HALF_WORLD) delta -= WORLD_WIDTH;
  if (delta < -HALF_WORLD) delta += WORLD_WIDTH;
  return delta;
}

function distance(a, b) {
  return Math.hypot(wrappedDelta(a.lon, b.lon), a.lat - b.lat);
}

function normalizePoint(point, index) {
  const lon = canonicalLongitude(point?.lon);
  const lat = finite(point?.lat, `path[${index}].lat`);
  if (lat < -90 || lat > 90) throw new Error(`path[${index}].lat must be in [-90, 90]`);
  return { lon, lat };
}

function dedupePath(path, tolerance) {
  if (!Array.isArray(path)) throw new Error("path must be an array");
  const result = [];
  for (const point of path) {
    const normalized = normalizePoint(point, result.length);
    if (!result.length || distance(result[result.length - 1], normalized) > tolerance) result.push(normalized);
  }
  if (result.length < 2) throw new Error("Authoritative arc path must contain at least two distinct points");
  return result;
}

function quantize(value, tolerance) {
  return Math.round(value / tolerance);
}

function pointKey(point, tolerance) {
  return `${quantize(point.lon, tolerance)}:${quantize(point.lat, tolerance)}`;
}

function geometryKey(path, tolerance) {
  return path.map((point) => pointKey(point, tolerance)).join(";");
}

function samePoint(a, b, tolerance) {
  return distance(a, b) <= tolerance;
}

function sameGeometry(a, b, tolerance) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (!samePoint(a[i], b[i], tolerance)) return false;
  return true;
}

function reversed(path) {
  return [...path].reverse();
}

function nodeIdFor(point, tolerance) {
  const normalized = normalizePoint(point, 0);
  return `n:${pointKey(normalized, tolerance)}`;
}

function arcIdFor(geometry, tolerance) {
  const forward = geometryKey(geometry, tolerance);
  const reverse = geometryKey(reversed(geometry), tolerance);
  return `arc:${forward < reverse ? forward : reverse}`;
}

/** Build-time registry for authoritative shared geometry. */
export class AuthoritativeArcRegistry {
  constructor({ tolerance = DEFAULT_TOLERANCE } = {}) {
    this.tolerance = positiveFinite(tolerance, "tolerance");
    this.nodes = new Map();
    this.arcs = new Map();
  }

  ensureNode(point, { kind = "triple-point" } = {}) {
    const normalized = normalizePoint(point, 0);
    const id = nodeIdFor(normalized, this.tolerance);
    const existing = this.nodes.get(id);
    if (existing) {
      // A node can first be encountered as a corner and later be proven to be
      // a shared junction by another authoritative Arc. Preserve the canonical
      // identity while promoting its semantic kind; never downgrade a junction.
      if (kind === "triple-point" && existing.kind !== "triple-point") existing.kind = "triple-point";
      return existing;
    }
    this.nodes.set(id, { id, kind, position: normalized, incidentArcs: [], incidentFaces: [] });
    return this.nodes.get(id);
  }

  register({ path, leftFace, rightFace, kind = "province", confidence = null, nodeKind = "triple-point" } = {}) {
    const left = assertId(leftFace, "leftFace");
    const right = assertId(rightFace, "rightFace");
    if (left === right) throw new Error("An authoritative non-world arc cannot have identical face sides");

    const geometry = dedupePath(path, this.tolerance);
    const startNode = this.ensureNode(geometry[0], { kind: nodeKind });
    const endNode = this.ensureNode(geometry.at(-1), { kind: nodeKind });
    if (startNode.id === endNode.id) throw new Error("Authoritative arc endpoints collapse to one node");

    const id = arcIdFor(geometry, this.tolerance);
    const existing = this.arcs.get(id);
    if (existing) {
      const sameForward = existing.startNode === startNode.id && existing.endNode === endNode.id;
      const sameReverse = existing.startNode === endNode.id && existing.endNode === startNode.id;
      if (!sameForward && !sameReverse) throw new Error(`Arc ${id} endpoint identity collision`);
      const expectedGeometry = sameForward ? geometry : reversed(geometry);
      if (!sameGeometry(existing.geometry, expectedGeometry, this.tolerance)) throw new Error(`Arc ${id} geometry collision exceeds tolerance`);
      const sameSides = existing.leftFace === left && existing.rightFace === right;
      const reversedSides = existing.leftFace === right && existing.rightFace === left;
      if (!sameSides && !reversedSides) throw new Error(`Arc ${id} already has two incident faces`);
      if (sameSides && !sameForward) throw new Error(`Arc ${id} requested reverse geometry with unchanged face sides`);
      if (reversedSides && !sameReverse) throw new Error(`Arc ${id} requested forward geometry with reversed face sides`);
      return { arc: existing, forward: sameForward, reused: true };
    }

    if (confidence != null) {
      confidence = finite(confidence, "confidence");
      if (confidence < 0 || confidence > 1) throw new Error("confidence must be in [0, 1]");
    }

    const arc = { id, kind, startNode: startNode.id, endNode: endNode.id, leftFace: left, rightFace: right, geometry, confidence };
    this.arcs.set(id, arc);
    this.#attach(startNode, arc, left, right);
    this.#attach(endNode, arc, left, right);
    return { arc, forward: true, reused: false };
  }

  #attach(node, arc, leftFace, rightFace) {
    if (!node.incidentArcs.includes(arc.id)) node.incidentArcs.push(arc.id);
    for (const faceId of [leftFace, rightFace]) if (!node.incidentFaces.includes(faceId)) node.incidentFaces.push(faceId);
    node.incidentArcs.sort();
    node.incidentFaces.sort();
  }

  toTopology() {
    return {
      nodes: Object.fromEntries([...this.nodes].map(([id, node]) => [id, { ...node, incidentArcs: [...node.incidentArcs], incidentFaces: [...node.incidentFaces] }])),
      arcs: Object.fromEntries([...this.arcs].map(([id, arc]) => [id, { ...arc, geometry: arc.geometry.map((point) => ({ ...point })) }])),
    };
  }
}

/** Register a successful solver result; failed searches never mutate topology. */
export function registerSolverPath(registry, { result, leftFace, rightFace, kind = "province", confidence = null, nodeKind = "triple-point" } = {}) {
  if (!registry || typeof registry.register !== "function") throw new Error("registry must be an AuthoritativeArcRegistry");
  if (!result || !Array.isArray(result.path) || result.path.length < 2) throw new Error(`Cannot register solver result: ${result?.reason ?? "missing path"}`);
  return registry.register({ path: result.path.map((node) => ({ lon: node.lon, lat: node.lat })), leftFace, rightFace, kind, confidence, nodeKind });
}

export const authoritativeArcGeometryKey = geometryKey;
export const authoritativeArcNodeId = nodeIdFor;
export const canonicalArcLongitude = canonicalLongitude;
