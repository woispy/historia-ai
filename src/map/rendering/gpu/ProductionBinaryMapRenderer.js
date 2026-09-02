import { BinaryMapRenderer, screenToWorld } from "./BinaryMapRenderer.js";

/** Production adapter: use the renderer's authoritative triangle geometry for deterministic province selection. */
export class ProductionBinaryMapRenderer extends BinaryMapRenderer {
  pick(x, y) {
    if (this.disposed || !this.state) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const localX = (Number(x) - rect.left) / rect.width;
    const localY = (Number(y) - rect.top) / rect.height;
    if (localX < 0 || localX > 1 || localY < 0 || localY > 1) return null;

    const world = screenToWorld(localX, localY, this.camera);
    if (!world) return null;

    return pickProvinceFromTriangles(this.state, world[0], world[1]);
  }
}

function pickProvinceFromTriangles(state, worldX, worldY) {
  const { assetSource, draws, indices } = state;
  if (!assetSource || !draws || !indices) return null;

  for (const drawCall of draws) {
    const end = drawCall.indexOffset + drawCall.indexCount;
    for (let offset = drawCall.indexOffset; offset < end; offset += 3) {
      const ia = indices[offset];
      const ib = indices[offset + 1];
      const ic = indices[offset + 2];
      if (pointInTriangle(worldX, worldY, assetSource.geometry, ia, ib, ic)) {
        return assetSource.getProvinceId(drawCall.provinceId) ?? null;
      }
    }
  }

  return null;
}

function pointInTriangle(px, py, geometry, ia, ib, ic) {
  const ax = geometry[ia * 2];
  const ay = geometry[ia * 2 + 1];
  const bx = geometry[ib * 2];
  const by = geometry[ib * 2 + 1];
  const cx = geometry[ic * 2];
  const cy = geometry[ic * 2 + 1];
  const ab = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  const bc = (cx - bx) * (py - by) - (cy - by) * (px - bx);
  const ca = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
  const hasNegative = ab < -1e-10 || bc < -1e-10 || ca < -1e-10;
  const hasPositive = ab > 1e-10 || bc > 1e-10 || ca > 1e-10;
  return !(hasNegative && hasPositive);
}

export { screenToWorld } from "./BinaryMapRenderer.js";
export default ProductionBinaryMapRenderer;
