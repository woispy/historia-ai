/**
 * Historia AI — Least Cost Path Solver
 *
 * Deterministic grid-aware A*. With minimumCost=0 it is Dijkstra-equivalent.
 * The heuristic is admissible when minimumCost is a proven lower bound for
 * traversal resistance per unit distance. Hard constraints stay blocked;
 * they are never disguised as a very large soft cost.
 */

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function nonNegative(value, name) {
  const number = finite(value, name);
  if (number < 0) throw new Error(`${name} must be >= 0`);
  return number;
}

class MinHeap {
  constructor() { this.items = []; }
  push(item) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (compareQueue(a[p], a[i]) <= 0) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    if (!a.length) return null;
    const root = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      while (true) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < a.length && compareQueue(a[left], a[smallest]) < 0) smallest = left;
        if (right < a.length && compareQueue(a[right], a[smallest]) < 0) smallest = right;
        if (smallest === i) break;
        [a[i], a[smallest]] = [a[smallest], a[i]];
        i = smallest;
      }
    }
    return root;
  }
  get size() { return this.items.length; }
}

function compareQueue(a, b) {
  if (a.f !== b.f) return a.f - b.f;
  if (a.g !== b.g) return a.g - b.g;
  return String(a.id).localeCompare(String(b.id));
}

function resolveNode(graph, value, name) {
  if (typeof value === "string") {
    const node = graph.nodeFromId(value);
    if (!node) throw new Error(`${name} is not a valid graph node id`);
    return node;
  }
  if (!value || !Number.isInteger(value.x) || !Number.isInteger(value.y)) throw new Error(`${name} must be a graph node or node id`);
  const node = graph.node(value.x, value.y);
  if (!node) throw new Error(`${name} is outside graph bounds`);
  return node;
}

export class LeastCostPathSolver {
  constructor({ graph, minimumCost = 0, maxIterations = Infinity } = {}) {
    if (!graph || typeof graph.neighbours !== "function" || typeof graph.edgeCost !== "function") {
      throw new Error("graph must implement neighbours() and edgeCost()");
    }
    this.graph = graph;
    this.minimumCost = nonNegative(minimumCost, "minimumCost");
    this.maxIterations = maxIterations === Infinity ? Infinity : Math.max(1, Math.floor(nonNegative(maxIterations, "maxIterations")));
  }

  solve({ start, end } = {}) {
    const source = resolveNode(this.graph, start, "start");
    const target = resolveNode(this.graph, end, "end");
    if (this.graph.isBlocked?.(source) || this.graph.isBlocked?.(target)) {
      return { path: null, cost: Infinity, reason: "hard-constraint", iterations: 0 };
    }
    if (source.id === target.id) return { path: [source], cost: 0, iterations: 0 };

    const open = new MinHeap();
    const gScore = new Map([[source.id, 0]]);
    const cameFrom = new Map();
    const closed = new Set();
    open.push({ id: source.id, node: source, g: 0, f: this.graph.heuristic(source, target, this.minimumCost) });

    let iterations = 0;
    while (open.size) {
      if (iterations >= this.maxIterations) return { path: null, cost: Infinity, reason: "iteration-limit", iterations };
      iterations += 1;
      const current = open.pop();
      if (closed.has(current.id)) continue;
      closed.add(current.id);

      if (current.id === target.id) {
        return { path: reconstructPath(this.graph, cameFrom, current.node), cost: current.g, iterations };
      }

      for (const neighbour of this.graph.neighbours(current.node)) {
        if (closed.has(neighbour.id)) continue;
        const tentative = current.g + this.graph.edgeCost(current.node, neighbour);
        const previous = gScore.get(neighbour.id);
        if (previous != null && tentative >= previous) continue;
        cameFrom.set(neighbour.id, current.id);
        gScore.set(neighbour.id, tentative);
        const f = tentative + this.graph.heuristic(neighbour, target, this.minimumCost);
        open.push({ id: neighbour.id, node: neighbour, g: tentative, f });
      }
    }
    return { path: null, cost: Infinity, reason: "no-path", iterations };
  }
}

function reconstructPath(graph, cameFrom, target) {
  const path = [target];
  let cursor = target.id;
  while (cameFrom.has(cursor)) {
    cursor = cameFrom.get(cursor);
    path.push(graph.nodeFromId(cursor));
  }
  path.reverse();
  return path;
}
