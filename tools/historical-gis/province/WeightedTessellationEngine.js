/**
 * Historia AI — Weighted Tessellation Engine
 *
 * P3 orchestration contract. Geometry production is intentionally not
 * implemented here yet. The engine establishes deterministic candidate
 * discovery, constraint evaluation and cost-driven boundary selection hooks.
 */

import { costAlongPath } from "./CostField.js";

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function assertFunction(value, name) {
  if (typeof value !== "function") throw new Error(`${name} must be a function`);
  return value;
}

export class WeightedTessellationEngine {
  constructor({ seedIndex, costField, constraintResolver = null, pathSolver = null } = {}) {
    if (!seedIndex || typeof seedIndex.queryRadius !== "function") {
      throw new Error("seedIndex must implement queryRadius()");
    }
    if (!costField || typeof costField.evaluate !== "function") {
      throw new Error("costField must implement evaluate()");
    }
    this.seedIndex = seedIndex;
    this.costField = costField;
    this.constraintResolver = constraintResolver;
    this.pathSolver = pathSolver;
  }

  discoverCandidates(seed, radius) {
    const lon = finite(seed?.position?.lon, "seed.position.lon");
    const lat = finite(seed?.position?.lat, "seed.position.lat");
    const candidates = this.seedIndex.queryRadius(lon, lat, radius);
    return candidates.filter((candidate) => candidate.id !== seed.id);
  }

  evaluateBoundary(points, sampler) {
    if (!Array.isArray(points) || points.length < 2) throw new Error("boundary requires at least two points");
    const resolvedSampler = assertFunction(sampler, "sampler");
    return costAlongPath(points, resolvedSampler, { weights: this.costField.weights });
  }

  resolveConstraints(leftSeed, rightSeed, context = {}) {
    if (!this.constraintResolver) return { allowed: true, costMultiplier: 1, reasons: [] };
    const result = this.constraintResolver(leftSeed, rightSeed, context) ?? {};
    const allowed = result.allowed !== false;
    const costMultiplier = Math.max(0, finite(result.costMultiplier ?? 1, "constraint costMultiplier"));
    return {
      allowed,
      costMultiplier,
      reasons: Array.isArray(result.reasons) ? [...result.reasons] : [],
    };
  }

  solveBoundary({ leftSeed, rightSeed, start, end, sampler, context = {} } = {}) {
    const constraints = this.resolveConstraints(leftSeed, rightSeed, context);
    if (!constraints.allowed) {
      return { accepted: false, reason: "hard-constraint", constraints, path: null, cost: Infinity };
    }
    if (!this.pathSolver) {
      return {
        accepted: false,
        reason: "path-solver-not-installed",
        constraints,
        path: null,
        cost: Infinity,
      };
    }
    const solve = assertFunction(this.pathSolver, "pathSolver");
    const result = solve({ leftSeed, rightSeed, start, end, sampler, context, costField: this.costField });
    if (!result?.path || result.path.length < 2) {
      return { accepted: false, reason: "empty-path", constraints, path: null, cost: Infinity };
    }
    const evaluated = this.evaluateBoundary(result.path, sampler);
    const cost = evaluated.total * constraints.costMultiplier;
    return {
      accepted: true,
      constraints,
      path: result.path,
      cost,
      evaluation: evaluated,
    };
  }
}
