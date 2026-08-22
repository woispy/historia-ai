export {
  createMap,
} from "./MapFactory.js";

/**
 * Geometry is a map-time resource, not a game-bootstrap dependency.
 * Keep the heavy geometry module behind an explicit dynamic import so the
 * generated Natural Earth JSON cannot enter the initial application graph.
 */
export async function loadMapGeometry(date = null) {
  const { bootstrapGeometry } = await import("./geometry/index.js");
  return bootstrapGeometry(date);
}
