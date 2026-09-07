/**
 * Historia AI — P5 Full Face Assembly
 *
 * Derives complete directed face rings from the authoritative Arc registry.
 * This module never invents missing borders and never repairs topology by
 * changing Euler arithmetic: incomplete/ambiguous graphs fail explicitly.
 */

import { createTopologyFace, validatePlanarTopology, planarEulerCharacteristic } from "./PlanarTopology.js";

function assertId(value, name) {
  if (value === null || value === undefined || value === "") throw new Error(`${name} is required`);
  return String(value);
}

function asObjectMap(value) {
  if (value instanceof Map) return Object.fromEntries(value.entries());
  return value ?? {};
}

function signedArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    area += a.lon * b.lat - b.lon * a.lat;
  }
  return area * 0.5;
}

function directedReference(arc, faceId) {
  if (arc.leftFace === faceId) return { arcId: arc.id, forward: true };
  if (arc.rightFace === faceId) return { arcId: arc.id, forward: false };
  return null;
}

function endpoints(arc, forward) {
  return forward
    ? { start: arc.startNode, end: arc.endNode }
    : { start: arc.endNode, end: arc.startNode };
}

function geometryForReference(arc, forward) {
  return forward ? arc.geometry : [...arc.geometry].reverse();
}

function collectFaceReferences(arcs, faceId) {
  return Object.values(arcs)
    .map((arc) => directedReference(arc, faceId))
    .filter(Boolean)
    .sort((a, b) => a.arcId.localeCompare(b.arcId));
}

function extractCycles(arcs, references, faceId) {
  const byStart = new Map();
  for (const reference of references) {
    const arc = arcs[reference.arcId];
    const edge = endpoints(arc, reference.forward);
    const list = byStart.get(edge.start) ?? [];
    list.push(reference);
    byStart.set(edge.start, list);
  }
  for (const list of byStart.values()) list.sort((a, b) => a.arcId.localeCompare(b.arcId));

  const unused = new Set(references.map((reference) => reference.arcId));
  const cycles = [];
  while (unused.size) {
    const firstId = [...unused].sort()[0];
    const first = references.find((reference) => reference.arcId === firstId);
    const cycle = [];
    let current = first;
    const startNode = endpoints(arcs[current.arcId], current.forward).start;

    for (let guard = 0; guard <= references.length; guard += 1) {
      if (!unused.has(current.arcId)) throw new Error(`Face ${faceId} reuses arc ${current.arcId} before cycle closure`);
      unused.delete(current.arcId);
      cycle.push(current);
      const endNode = endpoints(arcs[current.arcId], current.forward).end;
      if (endNode === startNode) break;

      const candidates = (byStart.get(endNode) ?? []).filter((reference) => unused.has(reference.arcId));
      if (candidates.length === 0) throw new Error(`Face ${faceId} has an open boundary at node ${endNode}`);
      if (candidates.length > 1) {
        throw new Error(`Face ${faceId} has ambiguous boundary continuation at node ${endNode}: ${candidates.map((reference) => reference.arcId).join(", ")}`);
      }
      current = candidates[0];
      if (guard === references.length) throw new Error(`Face ${faceId} cycle traversal exceeded arc count`);
    }

    const points = [];
    for (const reference of cycle) {
      const geometry = geometryForReference(arcs[reference.arcId], reference.forward);
      if (!points.length) points.push(...geometry);
      else points.push(...geometry.slice(1));
    }
    cycles.push({ ring: cycle, area: signedArea(points), points });
  }
  return cycles;
}

/**
 * Assemble all faces represented by the authoritative Arc graph.
 *
 * Each Arc side contributes exactly one directed reference. Cycles are
 * classified geometrically: the largest absolute-area cycle is the outer
 * ring; remaining cycles become holes. No synthetic Arc, Node, or Face is
 * created to make an invalid graph pass.
 */
export function assembleFullFaces({ topology, seedIds = {}, parentFaceIds = {} } = {}) {
  const nodes = asObjectMap(topology?.nodes);
  const arcs = asObjectMap(topology?.arcs);
  const requestedFaceIds = topology?.faces
    ? Object.keys(asObjectMap(topology.faces)).sort()
    : [...new Set(Object.values(arcs).flatMap((arc) => [arc.leftFace, arc.rightFace]))].sort();

  if (!requestedFaceIds.length) throw new Error("Cannot assemble faces from an empty authoritative Arc graph");

  const faces = {};
  const diagnostics = [];
  for (const faceId of requestedFaceIds) {
    assertId(faceId, "faceId");
    const references = collectFaceReferences(arcs, faceId);
    if (references.length < 3) throw new Error(`Face ${faceId} has fewer than three incident boundary arcs`);
    const cycles = extractCycles(arcs, references, faceId);
    if (!cycles.length) throw new Error(`Face ${faceId} produced no closed rings`);

    const outerIndex = cycles.reduce((best, cycle, index, all) =>
      Math.abs(cycle.area) > Math.abs(all[best].area) ? index : best, 0);
    const outer = cycles[outerIndex];
    const holes = cycles.filter((_, index) => index !== outerIndex).map((cycle) => cycle.ring);
    faces[faceId] = createTopologyFace({
      id: faceId,
      seedId: seedIds[faceId] ?? null,
      parentFaceId: parentFaceIds[faceId] ?? null,
      outerRing: outer.ring,
      holes,
    });
    diagnostics.push({
      faceId,
      incidentArcs: references.length,
      ringCount: cycles.length,
      outerSignedArea: outer.area,
      holeCount: holes.length,
    });
  }

  const assembled = { nodes, arcs, faces };
  const validation = validatePlanarTopology(assembled);
  return {
    topology: assembled,
    validation,
    eulerCharacteristic: planarEulerCharacteristic(assembled),
    diagnostics,
  };
}

export function assertFullFaceAssembly(result, { expectedEuler = null } = {}) {
  if (!result?.validation?.valid) {
    throw new Error(`Full face assembly failed topology validation: ${(result?.validation?.errors ?? []).join("; ")}`);
  }
  if (expectedEuler != null && result.eulerCharacteristic !== expectedEuler) {
    throw new Error(`Unexpected Euler characteristic ${result.eulerCharacteristic}; expected ${expectedEuler}`);
  }
  return result;
}
