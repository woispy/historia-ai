/**
 * Historia AI — P6.1 Province Adjacency Graph
 *
 * This graph is a deterministic CANDIDATE graph derived from validated
 * historical seeds. It is not yet a statement that two provinces share a
 * final cartographic border. P6.2 is responsible for solving/pruning those
 * candidate relationships against physical and historical constraints.
 *
 * Design rules:
 * - canonical seed coordinates are the only geometric input;
 * - great-circle distance ranks physical proximity;
 * - local k-nearest candidates are collected through SpatialHashSeedIndex;
 * - a deterministic Euclidean/MST-style connectivity pass prevents isolated
 *   seed components when the configured local radius is too small;
 * - hierarchy relation is metadata, never a hidden hard constraint;
 * - output ordering is stable by seed/edge id.
 */

import { SpatialHashSeedIndex } from "./SpatialSeedIndex.js";

const EARTH_RADIUS_KM = 6371.0088;
const EPSILON = 1e-12;

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function radians(value) {
  return value * Math.PI / 180;
}

function canonicalDeltaLongitude(a, b) {
  return ((b - a + 540) % 360) - 180;
}

export function greatCircleDistanceKm(a, b) {
  const lat1 = radians(finite(a?.lat, "a.lat"));
  const lat2 = radians(finite(b?.lat, "b.lat"));
  const dLat = lat2 - lat1;
  const dLon = radians(canonicalDeltaLongitude(finite(a?.lon, "a.lon"), finite(b?.lon, "b.lon")));
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = Math.min(1, Math.max(0, sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon));
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function hierarchyRelation(a, b) {
  const parentA = a.hierarchy?.parentId ?? null;
  const parentB = b.hierarchy?.parentId ?? null;
  if (parentA && parentA === parentB) return "same-parent";
  if (parentA && parentB) return "cross-parent";
  return "unparented";
}

function edgeId(a, b) {
  return a.id.localeCompare(b.id) < 0 ? `adj:${a.id}:${b.id}` : `adj:${b.id}:${a.id}`;
}

function compareCandidates(a, b) {
  const delta = a.distanceKm - b.distanceKm;
  if (Math.abs(delta) > EPSILON) return delta;
  return a.other.id.localeCompare(b.other.id);
}

function unionFind(ids) {
  const parent = new Map(ids.map((id) => [id, id]));
  const rank = new Map(ids.map((id) => [id, 0]));
  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    while (parent.get(id) !== id) {
      const next = parent.get(id);
      parent.set(id, root);
      id = next;
    }
    return root;
  };
  const join = (a, b) => {
    let ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (rank.get(ra) < rank.get(rb)) [ra, rb] = [rb, ra];
    parent.set(rb, ra);
    if (rank.get(ra) === rank.get(rb)) rank.set(ra, rank.get(ra) + 1);
    return true;
  };
  return { find, join };
}

export function buildProvinceAdjacencyGraph(seeds, {
  cellSize = 1,
  maxRadiusKm = 350,
  maxNeighbors = 4,
} = {}) {
  if (!Array.isArray(seeds) || seeds.length === 0) throw new Error("seeds must be a non-empty array");
  if (!Number.isInteger(maxNeighbors) || maxNeighbors < 1) throw new Error("maxNeighbors must be a positive integer");
  if (!Number.isFinite(maxRadiusKm) || maxRadiusKm <= 0) throw new Error("maxRadiusKm must be positive");

  const index = new SpatialHashSeedIndex({ cellSize });
  for (const seed of seeds) index.insert(seed);

  const nodes = seeds.map((seed) => ({
    id: seed.id,
    name: seed.identity?.name ?? seed.id,
    position: { ...seed.position },
    parentId: seed.hierarchy?.parentId ?? null,
    confidence: seed.historical?.confidence?.overall ?? 0,
  })).sort((a, b) => a.id.localeCompare(b.id));

  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));
  const edgeMap = new Map();

  for (const seed of seeds) {
    const radiusDegrees = Math.min(180, maxRadiusKm / 111.2);
    const candidates = index.queryRadius(seed.position.lon, seed.position.lat, radiusDegrees)
      .filter((candidate) => candidate.id !== seed.id)
      .map((candidate) => ({
        other: candidate,
        distanceKm: greatCircleDistanceKm(seed.position, candidate.position),
      }))
      .filter((candidate) => candidate.distanceKm <= maxRadiusKm + 1e-9)
      .sort(compareCandidates)
      .slice(0, maxNeighbors);

    for (const candidate of candidates) {
      const a = seed.id.localeCompare(candidate.other.id) < 0 ? seed : candidate.other;
      const b = a === seed ? candidate.other : seed;
      const id = edgeId(a, b);
      if (!edgeMap.has(id)) {
        edgeMap.set(id, {
          id,
          source: a.id,
          target: b.id,
          distanceKm: candidate.distanceKm,
          hierarchyRelation: hierarchyRelation(seedById.get(a.id), seedById.get(b.id)),
          discovery: "local-k-nearest",
        });
      }
    }
  }

  // Guarantee a connected candidate graph without pretending those edges are
  // final borders. This is a candidate-MST pass only; P6.2 may reject edges.
  const allPairs = [];
  for (let i = 0; i < seeds.length; i += 1) {
    for (let j = i + 1; j < seeds.length; j += 1) {
      const a = seeds[i], b = seeds[j];
      allPairs.push({
        id: edgeId(a, b),
        source: a.id,
        target: b.id,
        distanceKm: greatCircleDistanceKm(a.position, b.position),
        hierarchyRelation: hierarchyRelation(a, b),
      });
    }
  }
  allPairs.sort((a, b) => (a.distanceKm - b.distanceKm) || a.id.localeCompare(b.id));
  const uf = unionFind(nodes.map((node) => node.id));
  for (const edge of allPairs) {
    if (!uf.join(edge.source, edge.target)) continue;
    if (!edgeMap.has(edge.id)) edgeMap.set(edge.id, { ...edge, discovery: "connectivity-mst" });
  }

  const edges = [...edgeMap.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {
    version: 1,
    authoritative: false,
    nodes,
    edges,
    diagnostics: {
      seedCount: nodes.length,
      edgeCount: edges.length,
      localEdgeCount: edges.filter((edge) => edge.discovery === "local-k-nearest").length,
      connectivityEdgeCount: edges.filter((edge) => edge.discovery === "connectivity-mst").length,
      sameParentEdgeCount: edges.filter((edge) => edge.hierarchyRelation === "same-parent").length,
      crossParentEdgeCount: edges.filter((edge) => edge.hierarchyRelation === "cross-parent").length,
      maxRadiusKm,
      maxNeighbors,
    },
  };
}

export function validateProvinceAdjacencyGraph(graph) {
  if (!graph || graph.authoritative !== false) throw new Error("adjacency graph must remain explicitly non-authoritative");
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (nodeIds.size !== graph.nodes.length) throw new Error("duplicate adjacency node id");
  const edgeIds = new Set();
  const degrees = new Map([...nodeIds].map((id) => [id, 0]));
  for (const edge of graph.edges) {
    if (edge.source === edge.target) throw new Error(`self adjacency edge: ${edge.id}`);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) throw new Error(`adjacency edge references unknown node: ${edge.id}`);
    if (edgeIds.has(edge.id)) throw new Error(`duplicate adjacency edge: ${edge.id}`);
    edgeIds.add(edge.id);
    degrees.set(edge.source, degrees.get(edge.source) + 1);
    degrees.set(edge.target, degrees.get(edge.target) + 1);
    if (!Number.isFinite(edge.distanceKm) || edge.distanceKm <= 0) throw new Error(`invalid adjacency distance: ${edge.id}`);
  }
  if (nodeIds.size > 1 && [...degrees.values()].some((degree) => degree === 0)) throw new Error("adjacency graph contains an isolated seed");
  return { valid: true, nodeCount: nodeIds.size, edgeCount: edgeIds.size };
}
