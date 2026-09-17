/**
 * Historia AI — Map Studio Control Point Automation
 *
 * Automates control point definition for georeferencing a real historical
 * raster map. The ONLY human input is the map's printed geographic extent
 * (read once from the map's own labels/legend — metadata, not data entry).
 * Everything else is automated:
 *
 *  1. deriveCornerControlPoints: corner (+ optional edge-midpoint) control
 *     points derived deterministically from the declared extent.
 *  2. fitFromExtent: fit the affine georeferencer directly from the extent.
 *  3. validateGeoreference: automatic sanity gate using known city anchors —
 *     every anchor's WGS84 coordinate is transformed to pixel space and must
 *     land inside the image. A wrongly-declared extent is DETECTED here,
 *     fail-closed, per-anchor diagnostics included.
 *  4. autoCalibrate: full pipeline (derive -> fit -> validate).
 *
 * This module never invents geometry and never promotes anything: a valid
 * calibration only enables the digitization editor.
 */

import { fitGeoreferencer } from "./MapGeoreferencer.js";

function cornerControlPoints(imageWidth, imageHeight, extent) {
  const { minX, minY, maxX, maxY } = extent;
  return [
    { pixel: [0, 0], geo: [minX, maxY] },
    { pixel: [imageWidth, 0], geo: [maxX, maxY] },
    { pixel: [imageWidth, imageHeight], geo: [maxX, minY] },
    { pixel: [0, imageHeight], geo: [minX, minY] },
  ];
}

/**
 * Derive corner (+ optional edge-midpoint) control points from the declared
 * extent. Deterministic.
 */
export function deriveCornerControlPoints({ imageWidth, imageHeight, extent, includeMidpoints = false }) {
  validateExtentInput({ imageWidth, imageHeight, extent });
  const points = cornerControlPoints(imageWidth, imageHeight, extent);
  if (includeMidpoints) {
    const { minX, minY, maxX, maxY } = extent;
    const midLon = (minX + maxX) / 2;
    const midLat = (minY + maxY) / 2;
    points.push(
      { pixel: [imageWidth / 2, 0], geo: [midLon, maxY] },
      { pixel: [imageWidth, imageHeight / 2], geo: [maxX, midLat] },
      { pixel: [imageWidth / 2, imageHeight], geo: [midLon, minY] },
      { pixel: [0, imageHeight / 2], geo: [minX, midLat] },
      { pixel: [imageWidth / 2, imageHeight / 2], geo: [midLon, midLat] },
    );
  }
  return points;
}

function validateExtentInput({ imageWidth, imageHeight, extent }) {
  if (!Number.isInteger(imageWidth) || imageWidth <= 0 || !Number.isInteger(imageHeight) || imageHeight <= 0) {
    throw new TypeError("imageWidth and imageHeight must be positive integers");
  }
  if (!extent || ![ "minX", "minY", "maxX", "maxY" ].every((key) => Number.isFinite(Number(extent[key])))) {
    throw new TypeError("extent must define finite minX, minY, maxX, maxY");
  }
  if (Number(extent.minX) >= Number(extent.maxX) || Number(extent.minY) >= Number(extent.maxY)) {
    throw new TypeError("extent must define a positive-area geographic rectangle");
  }
}

/**
 * Fit the affine georeferencer directly from the declared extent.
 */
export function fitFromExtent({ imageWidth, imageHeight, extent, includeMidpoints = false }) {
  const controlPoints = deriveCornerControlPoints({ imageWidth, imageHeight, extent, includeMidpoints });
  const georeferencer = fitGeoreferencer(controlPoints);
  return { georeferencer, controlPoints };
}

/**
 * Automatic sanity gate: transform known city anchors to pixel space and
 * verify they land inside the image. City anchors MUST be landmarks visible
 * on the map; an anchor outside the image means the declared extent is
 * inconsistent with the map content — fail-closed, per-anchor diagnostics.
 *
 * @param {object} georeferencer fitted georeferencer (toPixel)
 * @param {Array<{id, name?, x, y}>} cityAnchors x = WGS84 lon, y = WGS84 lat
 */
export function validateGeoreference({ georeferencer, cityAnchors, imageWidth, imageHeight, marginPixels = 0 }) {
  if (!georeferencer || typeof georeferencer.toPixel !== "function") throw new TypeError("georeferencer with toPixel is required");
  if (!Array.isArray(cityAnchors)) throw new TypeError("cityAnchors must be an array");
  if (!Number.isInteger(imageWidth) || !Number.isInteger(imageHeight)) throw new TypeError("imageWidth and imageHeight must be integers");

  const anchors = cityAnchors.map((anchor) => {
    const [px, py] = georeferencer.toPixel(Number(anchor.x), Number(anchor.y));
    const inside = px >= -marginPixels && px <= imageWidth + marginPixels && py >= -marginPixels && py <= imageHeight + marginPixels;
    return {
      id: anchor.id ?? null,
      name: anchor.name ?? null,
      geo: [Number(anchor.x), Number(anchor.y)],
      pixel: [px, py],
      inside,
    };
  });

  const insideCount = anchors.filter((anchor) => anchor.inside).length;
  return {
    valid: anchors.length > 0 && insideCount === anchors.length,
    insideCount,
    outsideCount: anchors.length - insideCount,
    anchors,
  };
}

/**
 * Solve the north-up map extent from pixel<->geo correspondences of known
 * cities clicked on the map. Reduces human input to TWO city clicks:
 * click a visually identifiable city, pick it from the atlas, repeat once —
 * the extent is solved and everything else follows.
 *
 * @param {Array<{pixel:[number,number], geo:[number,number]}>} correspondences
 * @returns {{ minX, minY, maxX, maxY }} solved extent
 */
export function solveExtentFromAnchorPixels({ correspondences, imageWidth, imageHeight }) {
  if (!Array.isArray(correspondences) || correspondences.length < 2) {
    throw new Error("At least 2 city anchor correspondences are required to solve the extent");
  }
  if (!Number.isInteger(imageWidth) || !Number.isInteger(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
    throw new TypeError("imageWidth and imageHeight must be positive integers");
  }
  const normalized = correspondences.map(({ pixel, geo }) => ({
    px: Number(pixel?.[0]), py: Number(pixel?.[1]),
    lon: Number(geo?.[0]), lat: Number(geo?.[1]),
  }));
  if (normalized.some((point) => ![point.px, point.py, point.lon, point.lat].every(Number.isFinite))) {
    throw new TypeError("correspondences must have finite pixel and geo coordinates");
  }

  // Use the two westernmost/easternmost pixels for the best scale estimate.
  const sorted = [...normalized].sort((a, b) => a.px - b.px);
  const west = sorted[0];
  const east = sorted.at(-1);
  if (east.px === west.px) throw new Error("Anchor pixels must differ in x to solve the longitude scale");
  const scaleX = (east.px - west.px) / (east.lon - west.lon);
  if (!Number.isFinite(scaleX) || scaleX <= 0) throw new Error("Anchor cities must be distinct in longitude");

  // North-up: pixel y grows southward, so the southernmost pixel is the
  // highest-pixel one; compare lat directly through the pixel mapping.
  const byLat = [...normalized].sort((a, b) => a.py - b.py);
  const north = byLat[0];
  const south = byLat.at(-1);
  if (south.py === north.py) throw new Error("Anchor pixels must differ in y to solve the latitude scale");
  const scaleY = (south.py - north.py) / (north.lat - south.lat);
  if (!Number.isFinite(scaleY) || scaleY <= 0) throw new Error("Anchor cities must be distinct in latitude");

  // Anchor consistency check (fail-closed): every correspondence must agree
  // with the solved linear mapping within a tolerance, otherwise the clicks
  // are mislabeled.
  const tolerance = 0.5; // degrees
  for (const point of normalized) {
    const expectedLon = west.lon + (point.px - west.px) / scaleX;
    const expectedLat = north.lat - (point.py - north.py) / scaleY;
    if (Math.abs(expectedLon - point.lon) > tolerance || Math.abs(expectedLat - point.lat) > tolerance) {
      throw new Error(`Anchor correspondence inconsistent with the linear map: ${point.lon}, ${point.lat} does not fit`);
    }
  }

  const minX = west.lon - west.px / scaleX;
  const maxX = minX + imageWidth / scaleX;
  const maxLat = north.lat + north.py / scaleY;
  const minY = maxLat - imageHeight / scaleY;
  return { minX, minY, maxX, maxY: maxLat };
}

/**
 * Full calibration pipeline: derive corner control points from the declared
 * extent, fit the georeferencer, then run the city-anchor sanity gate.
 * Returns calibration ready for the digitization editor; flagged invalid
 * when the extent is inconsistent with the anchor content (fail-closed).
 */
export function autoCalibrate({ imageWidth, imageHeight, extent, cityAnchors = [], includeMidpoints = false, marginPixels = 0 }) {
  validateExtentInput({ imageWidth, imageHeight, extent });
  const { georeferencer, controlPoints } = fitFromExtent({ imageWidth, imageHeight, extent, includeMidpoints });
  const validation = validateGeoreference({ georeferencer, cityAnchors, imageWidth, imageHeight, marginPixels });
  return {
    georeferencer,
    controlPoints,
    extent: { ...extent },
    validation,
    ready: validation.valid,
    note: "Calibration enables digitization only; boundary geometry still requires the proof-group pipeline before promotion.",
  };
}

/**
 * Two-click calibration: solve the extent from pixel<->geo correspondences
 * of TWO visually identifiable cities, then run the full autoCalibrate
 * pipeline with ALL city anchors as the sanity gate. This is the minimal
 * human input for calibrating a real historical map: click two known
 * cities, everything else is automated.
 */
export function calibrateFromAnchorPixels({ imageWidth, imageHeight, correspondences, cityAnchors = [], includeMidpoints = false, marginPixels = 0 }) {
  const extent = solveExtentFromAnchorPixels({ correspondences, imageWidth, imageHeight });
  const calibration = autoCalibrate({ imageWidth, imageHeight, extent, cityAnchors, includeMidpoints, marginPixels });
  return { ...calibration, extent, solvedFrom: correspondences.map(({ geo }) => geo) };
}
