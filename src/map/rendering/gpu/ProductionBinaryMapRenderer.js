import { BinaryMapRenderer, screenToWorld } from "./BinaryMapRenderer.js";
import { pickProvinceFromBinaryAsset } from "./BinaryMapCpuPicker.js";

/** Production adapter: preserve GPU picking while guaranteeing a geometry-backed CPU fallback. */
export class ProductionBinaryMapRenderer extends BinaryMapRenderer {
  pick(x, y) {
    const gpuProvinceId = super.pick(x, y);
    if (gpuProvinceId !== null && gpuProvinceId !== undefined) return gpuProvinceId;

    if (this.disposed || !this.state) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const localX = (Number(x) - rect.left) / rect.width;
    const localY = (Number(y) - rect.top) / rect.height;
    if (localX < 0 || localX > 1 || localY < 0 || localY > 1) return null;

    const world = screenToWorld(localX, localY, this.camera);
    if (!world) return null;

    return pickProvinceFromBinaryAsset(this.state.assetSource, world[0], world[1]);
  }
}

export { screenToWorld } from "./BinaryMapRenderer.js";
export default ProductionBinaryMapRenderer;
