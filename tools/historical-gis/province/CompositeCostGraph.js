/**
 * Historia AI — Composite Cost Graph
 *
 * A deterministic 8-neighbour grid graph over a geographic extent. The graph
 * is intentionally agnostic to the backing raster: callers provide a cell
 * sample/transition sampler. Hard constraints are represented as blocked
 * nodes; physical resistance remains a soft traversal cost.
 */

import { wrappedLongitudeDelta } from "./CostField.js";

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function positiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${name} must be a positive integer`);
  return number;
}

function key(x, y) {
  return `${x},${y}`;
}

const DIRECTIONS_8 = Object.freeze([
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],           [1, 0],
  [-1, 1],  [0, 1],  [1, 1],
]);

export class CompositeCostGraph {
  constructor({ width, height, bounds, sampleCell, transitionCost = null, blocked = null } = {}) {
    this.width = positiveInteger(width, "width");
    this.height = positiveInteger(height, "height");
    if (!bounds || !Number.isFinite(bounds.minLon) || !Number.isFinite(bounds.maxLon)
      || !Number.isFinite(bounds.minLat) || !Number.isFinite(bounds.maxLat)) {
      throw new Error("bounds must contain finite minLon/maxLon/minLat/maxLat");
    }
    if (bounds.maxLon <= bounds.minLon || bounds.maxLat <= bounds.minLat) throw new Error("bounds must have positive extent");
    if (typeof sampleCell !== "function") throw new Error("sampleCell must be a function");
    this.bounds = Object.freeze({ ...bounds });
    this.sampleCell = sampleCell;
    this.transitionCost = transitionCost;
    this.blocked = blocked;
  }

  node(x, y) {
    const ix = Number(x);
    const iy = Number(y);
    if (!Number.isInteger(ix) || !Number.isInteger(iy) || ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return null;
    const lon = this.bounds.minLon + ((ix + 0.5) / this.width) * (this.bounds.maxLon - this.bounds.minLon);
    const lat = this.bounds.minLat + ((iy + 0.5) / this.height) * (this.bounds.maxLat - this.bounds.minLat);
    return Object.freeze({ x: ix, y: iy, lon, lat, id: key(ix, iy) });
  }

  nodeFromId(id) {
    const match = /^(-?\d+),(-?\d+)$/.exec(String(id));
    return match ? this.node(Number(match[1]), Number(match[2])) : null;
  }

  neighbours(node) {
    const result = [];
    for (const [dx, dy] of DIRECTIONS_8) {
      const candidate = this.node(node.x + dx, node.y + dy);
      if (!candidate) continue;
      if (this.isBlocked(candidate)) continue;
      result.push(candidate);
    }
    return result;
  }

  isBlocked(node) {
    return typeof this.blocked === "function" ? this.blocked(node, this.sampleCell(node)) === true : false;
  }

  heuristic(from, to, minimumCost = 0) {
    const dx = wrappedLongitudeDelta(from.lon, to.lon);
    const dy = to.lat - from.lat;
    return Math.hypot(dx, dy) * Math.max(0, finite(minimumCost, "minimumCost"));
  }

  edgeCost(from, to) {
    const dx = wrappedLongitudeDelta(from.lon, to.lon);
    const dy = to.lat - from.lat;
    const distance = Math.hypot(dx, dy);
    const sampled = typeof this.transitionCost === "function"
      ? this.transitionCost(from, to, this.sampleCell(from), this.sampleCell(to))
      : (this.sampleCell(to)?.total ?? this.sampleCell(to)?.cost ?? 1);
    const cost = finite(sampled, "transition cost");
    if (cost < 0) throw new Error("transition cost must be >= 0");
    return cost * distance;
  }
}
