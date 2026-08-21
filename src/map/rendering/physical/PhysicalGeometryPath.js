/**
 * Exact SVG path helpers for physical geography.
 *
 * Hydrography must not be smoothed or resampled by the renderer. These helpers
 * preserve every source vertex and only translate coordinate arrays into SVG
 * move/line/close commands.
 */

export function flattenCoordinatePoints(coordinates, output = []) {
  if (!Array.isArray(coordinates)) return output;
  if (
    coordinates.length >= 2
    && Number.isFinite(Number(coordinates[0]))
    && Number.isFinite(Number(coordinates[1]))
  ) {
    output.push([Number(coordinates[0]), Number(coordinates[1])]);
    return output;
  }
  for (const child of coordinates) flattenCoordinatePoints(child, output);
  return output;
}

export function linearPathFromCoordinates(coordinates, close = false) {
  const points = flattenCoordinatePoints(coordinates);
  if (points.length < 2) return "";

  const commands = [`M ${points[0][0]} ${points[0][1]}`];
  for (let index = 1; index < points.length; index += 1) {
    commands.push(`L ${points[index][0]} ${points[index][1]}`);
  }
  if (close) commands.push("Z");
  return commands.join(" ");
}

export function exactAreaPath(rings = []) {
  return rings
    .map((ring) => linearPathFromCoordinates(ring, true))
    .filter(Boolean)
    .join(" ");
}

export function polygonPath(polygons = []) {
  return polygons
    .map((polygon) => exactAreaPath([polygon]))
    .filter(Boolean)
    .join(" ");
}
