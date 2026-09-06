/**
 * Refines a coarse least-cost path inside a targeted corridor.
 *
 * The coarse solution remains the global route decision. Refinement only
 * increases spatial resolution around that route, preventing a full-region
 * high-resolution graph from becoming the default cost of every solve.
 */

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

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function nearestNode(graph, target) {
  const x = clamp(Math.floor(((target.lon - graph.bounds.minLon) / (graph.bounds.maxLon - graph.bounds.minLon)) * graph.width), 0, graph.width - 1);
  const y = clamp(Math.floor(((target.lat - graph.bounds.minLat) / (graph.bounds.maxLat - graph.bounds.minLat)) * graph.height), 0, graph.height - 1);
  return graph.node(x, y);
}

export function refineLeastCostPath({ coarseGraph, coarseResult, graphFactory, solverFactory, refinementFactor = 4, corridorPaddingCells = 2 } = {}) {
  if (!coarseGraph || !coarseResult?.path?.length) throw new Error("coarseGraph and a successful coarseResult are required");
  if (typeof graphFactory !== "function") throw new Error("graphFactory must be a function");
  if (typeof solverFactory !== "function") throw new Error("solverFactory must be a function");
  const factor = positiveInteger(refinementFactor, "refinementFactor");
  const padding = positiveInteger(corridorPaddingCells, "corridorPaddingCells");

  const lonCell = (coarseGraph.bounds.maxLon - coarseGraph.bounds.minLon) / coarseGraph.width;
  const latCell = (coarseGraph.bounds.maxLat - coarseGraph.bounds.minLat) / coarseGraph.height;
  const path = coarseResult.path;
  const minLon = clamp(Math.min(...path.map((node) => node.lon)) - lonCell * padding, coarseGraph.bounds.minLon, coarseGraph.bounds.maxLon);
  const maxLon = clamp(Math.max(...path.map((node) => node.lon)) + lonCell * padding, coarseGraph.bounds.minLon, coarseGraph.bounds.maxLon);
  const minLat = clamp(Math.min(...path.map((node) => node.lat)) - latCell * padding, coarseGraph.bounds.minLat, coarseGraph.bounds.maxLat);
  const maxLat = clamp(Math.max(...path.map((node) => node.lat)) + latCell * padding, coarseGraph.bounds.minLat, coarseGraph.bounds.maxLat);
  const bounds = Object.freeze({ minLon, maxLon, minLat, maxLat });
  const width = Math.max(3, Math.ceil((maxLon - minLon) / lonCell * factor));
  const height = Math.max(3, Math.ceil((maxLat - minLat) / latCell * factor));
  const fineGraph = graphFactory({ bounds, width, height, level: factor, parentPath: path });
  const start = nearestNode(fineGraph, path[0]);
  const end = nearestNode(fineGraph, path.at(-1));
  const solver = solverFactory(fineGraph, { level: factor });
  const refinedResult = solver.solve({ start, end });

  return Object.freeze({
    refined: refinedResult,
    graph: fineGraph,
    bounds,
    width,
    height,
    refinementFactor: factor,
    corridorPaddingCells: padding,
    coarsePathNodes: path.length,
    refinedPathNodes: refinedResult.path?.length ?? 0,
  });
}

export function comparePathResolution(coarseResult, refinedResult) {
  if (!coarseResult?.path?.length || !refinedResult?.path?.length) throw new Error("both paths must be successful");
  return Object.freeze({
    coarseNodes: coarseResult.path.length,
    refinedNodes: refinedResult.path.length,
    nodeDensityMultiplier: refinedResult.path.length / coarseResult.path.length,
    costDelta: refinedResult.cost - coarseResult.cost,
  });
}
