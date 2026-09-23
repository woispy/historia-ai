/**
 * Historia AI — Map Studio Georeferencer
 *
 * Maps pixel coordinates of a historical raster map to WGS84 lon/lat using
 * an affine transform fitted to control points (least squares). This is the
 * foundation of the Map Studio digitization workflow: the editor clicks on
 * a georeferenced historical map, and every click becomes an authoritative
 * geographic coordinate through this transform.
 *
 * Deterministic pure math, no dependencies:
 *  - Affine model: lon = a*px + b*py + c ; lat = d*px + e*py + f
 *  - >= 3 non-collinear control points; more points => least-squares fit
 *  - Residual RMS reported so the editor can warn about poor georeference
 */

function solve3x3(matrix, rhs) {
  // Gaussian elimination with partial pivoting; matrix is 3x3 row-major.
  const m = matrix.map((row) => [...row]);
  const v = [...rhs];
  for (let col = 0; col < 3; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < 3; row += 1) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) throw new Error("Control points are collinear or degenerate; affine fit requires >= 3 non-collinear points");
    if (pivot !== col) {
      [m[col], m[pivot]] = [m[pivot], m[col]];
      [v[col], v[pivot]] = [v[pivot], v[col]];
    }
    for (let row = col + 1; row < 3; row += 1) {
      const factor = m[row][col] / m[col][col];
      for (let k = col; k < 3; k += 1) m[row][k] -= factor * m[col][k];
      v[row] -= factor * v[col];
    }
  }
  const out = [0, 0, 0];
  for (let row = 2; row >= 0; row -= 1) {
    let sum = v[row];
    for (let k = row + 1; k < 3; k += 1) sum -= m[row][k] * out[k];
    out[row] = sum / m[row][row];
  }
  return out;
}

/**
 * Fit an affine transform from control points.
 * @param {Array<{pixel:[number,number], geo:[number,number]}>} controlPoints
 * @returns {{ toGeo(px,py), toPixel(lon,lat), coefficients, rmsResidual, controlPointCount }}
 */
export function fitGeoreferencer(controlPoints) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 3) {
    throw new Error("At least 3 control points are required for affine georeferencing");
  }

  // Normal equations for lon = a*px + b*py + c and lat = d*px + e*py + f.
  // A^T A (3x3) and A^T y per axis, where A rows are [px, py, 1].
  let sxx = 0, sxy = 0, sx = 0, syy = 0, sy = 0, n = controlPoints.length;
  let slx = 0, sly = 0;
  for (const { pixel, geo } of controlPoints) {
    const [px, py] = pixel.map(Number);
    const [lon, lat] = geo.map(Number);
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(lon) || !Number.isFinite(lat)) {
      throw new Error("Control points must have finite pixel and geo coordinates");
    }
    sxx += px * px; sxy += px * py; sx += px;
    syy += py * py; sy += py;
    slx += px * lon; sly += py * lon;
    // lat accumulators built below via second pass over rhs values
  }

  const A0 = [sxx, sxy, sx];
  const A1 = [sxy, syy, sy];
  const A2 = [sx, sy, n];

  const rhsLon = [slx, sly, controlPoints.reduce((sum, { geo }) => sum + Number(geo[0]), 0)];
  const rhsLat = [
    controlPoints.reduce((sum, { pixel, geo }) => sum + Number(pixel[0]) * Number(geo[1]), 0),
    controlPoints.reduce((sum, { pixel, geo }) => sum + Number(pixel[1]) * Number(geo[1]), 0),
    controlPoints.reduce((sum, { geo }) => sum + Number(geo[1]), 0),
  ];

  const [a, b, c] = solve3x3([A0, A1, A2], rhsLon);
  const [d, e, f] = solve3x3([A0, A1, A2], rhsLat);

  // Residuals
  let squaredSum = 0;
  for (const { pixel, geo } of controlPoints) {
    const [px, py] = pixel.map(Number);
    const lon = a * px + b * py + c;
    const lat = d * px + e * py + f;
    // Residual in degrees, weighted by cos(lat) for longitude so RMS is
    // roughly metric-uniform.
    const cosLat = Math.max(0.01, Math.cos((Math.abs(lat) * Math.PI) / 180));
    const dx = (lon - Number(geo[0])) * cosLat;
    const dy = lat - Number(geo[1]);
    squaredSum += dx * dx + dy * dy;
  }
  const rmsResidual = Math.sqrt(squaredSum / controlPoints.length);

  // Inverse: px = (a'*lon + b'*lat + c') via the inverse of [[a,b],[d,e]].
  const det = a * e - b * d;
  if (Math.abs(det) < 1e-12) throw new Error("Affine transform is singular");
  const ia = e / det;
  const ib = -b / det;
  const id = -d / det;
  const ie = a / det;
  const ic = -(ia * c + ib * f);
  const ifc = -(id * c + ie * f);

  return {
    controlPointCount: controlPoints.length,
    rmsResidual,
    coefficients: { lon: [a, b, c], lat: [d, e, f], pixel: [ia, ib, ic, id, ie, ifc] },
    toGeo(px, py) {
      return [a * Number(px) + b * Number(py) + c, d * Number(px) + e * Number(py) + f];
    },
    toPixel(lon, lat) {
      return [ia * Number(lon) + ib * Number(lat) + ic, id * Number(lon) + ie * Number(lat) + ifc];
    },
  };
}

/**
 * Digitize a ring: convert pixel positions to geo coordinates and close the
 * ring. Returns a closed [lon,lat][] ring with the first point repeated at
 * the end (GeoJSON convention).
 */
export function digitizeRing(georeferencer, pixelPositions, { minPoints = 3, roundDigits = 6 } = {}) {
  if (!Array.isArray(pixelPositions) || pixelPositions.length < minPoints) {
    throw new Error(`A ring needs at least ${minPoints} distinct positions`);
  }
  const round = (value) => Number(value.toFixed(roundDigits));
  const ring = pixelPositions.map(([px, py]) => {
    const [lon, lat] = georeferencer.toGeo(px, py);
    return [round(lon), round(lat)];
  });
  const first = ring[0];
  const last = ring.at(-1);
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
  return ring;
}

/**
 * Rough signed area of a lon/lat ring (planar approximation) — used by the
 * editor for winding feedback.
 */
export function ringSignedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}
