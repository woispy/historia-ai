/**
 * Historia AI — Map Studio Reference Layer Renderer
 *
 * Open-Historia-quality land/sea reference drawing for the digitization
 * editor. Draws the Natural Earth 10m physical geography (land mask with
 * detailed coastline, lakes, rivers) beneath the entered province rings so
 * the editor digitizes against high-quality geographic context.
 *
 * Pure canvas functions, deterministic, no dependencies. Coordinates are
 * lon/lat; the view transform is supplied by the caller (the editor's
 * geo->canvas mapping).
 */

const OPEN_HISTORIA_STYLE = Object.freeze({
  sea: "#1d3a52",
  land: "#4a4a3f",
  landCoastline: "#2e2e28",
  lake: "#1d3a52",
  lakeCoastline: "#2e2e28",
  river: "#3f6f8f",
  riverWidth: 1.2,
  coastWidth: 1.4,
});

function pointInBbox(lon, lat, view) {
  return lon >= view.minX - 2 && lon <= view.maxX + 2 && lat >= view.minY - 2 && lat <= view.maxY + 2;
}

function ringInView(ring, view) {
  return ring.some(([lon, lat]) => pointInBbox(lon, lat, view));
}

/** Sea background + land mask with detailed coastline. */
export function drawLandAndSea(ctx, landPolygons, view, geoToCanvas, style = OPEN_HISTORIA_STYLE) {
  ctx.fillStyle = style.sea;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const ring of landPolygons ?? []) {
    if (!Array.isArray(ring) || ring.length < 3 || !ringInView(ring, view)) continue;
    ctx.beginPath();
    ring.forEach(([lon, lat], index) => {
      const [cx, cy] = geoToCanvas(lon, lat);
      if (index === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.fillStyle = style.land;
    ctx.fill();
    ctx.strokeStyle = style.landCoastline;
    ctx.lineWidth = style.coastWidth;
    ctx.stroke();
  }
  return { landRingsDrawn: (landPolygons ?? []).filter((ring) => Array.isArray(ring) && ring.length >= 3 && ringInView(ring, view)).length };
}

/** Natural Earth 10m lakes. */
export function drawLakes(ctx, lakes, view, geoToCanvas, style = OPEN_HISTORIA_STYLE) {
  let drawn = 0;
  for (const lake of lakes ?? []) {
    const rings = lake?.rings ?? (lake?.coordinates ? [lake.coordinates] : []);
    for (const ring of rings) {
      if (!Array.isArray(ring) || ring.length < 3 || !ringInView(ring, view)) continue;
      ctx.beginPath();
      ring.forEach(([lon, lat], index) => {
        const [cx, cy] = geoToCanvas(lon, lat);
        if (index === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.fillStyle = style.lake;
      ctx.fill();
      ctx.strokeStyle = style.lakeCoastline;
      ctx.lineWidth = 1;
      ctx.stroke();
      drawn += 1;
    }
  }
  return { lakesDrawn: drawn };
}

/** Natural Earth 10m river centerlines. */
export function drawRivers(ctx, rivers, view, geoToCanvas, style = OPEN_HISTORIA_STYLE) {
  let drawn = 0;
  for (const river of rivers ?? []) {
    const coordinates = river?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.some(([lon, lat]) => pointInBbox(lon, lat, view))) continue;
    ctx.beginPath();
    coordinates.forEach(([lon, lat], index) => {
      const [cx, cy] = geoToCanvas(lon, lat);
      if (index === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.strokeStyle = style.river;
    ctx.lineWidth = style.riverWidth;
    ctx.stroke();
    drawn += 1;
  }
  return { riversDrawn: drawn };
}

/**
 * Draw the full physical reference layer beneath the digitization rings.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} atlas physical geography runtime (landPolygons, lakes, rivers)
 * @param {object} view { minX, minY, maxX, maxY }
 * @param {(lon, lat) => [number, number]} geoToCanvas
 */
export function drawReferenceLayer(ctx, atlas, view, geoToCanvas, style = OPEN_HISTORIA_STYLE) {
  const land = drawLandAndSea(ctx, atlas?.landPolygons, view, geoToCanvas, style);
  const lakes = drawLakes(ctx, atlas?.lakes, view, geoToCanvas, style);
  const rivers = drawRivers(ctx, atlas?.rivers, view, geoToCanvas, style);
  return { ...land, ...lakes, ...rivers };
}

export const referenceLayerStyle = OPEN_HISTORIA_STYLE;
