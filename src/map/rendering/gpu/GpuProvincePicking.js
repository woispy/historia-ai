/** GPU-native province picking helpers. No SVG/raster bridge is involved. */
export const PICKING_FORMAT = "r32uint";

export function createPickingIdBuffer(provinceCount) {
  return new Uint32Array(Math.max(0, Number(provinceCount) || 0));
}

export function encodeProvinceIdForPicking(provinceIndex) {
  const value = Number(provinceIndex);
  if (!Number.isInteger(value) || value < 0 || value > 0xfffffffe) return 0xffffffff;
  return value >>> 0;
}

export function decodeProvinceIdFromPicking(value) {
  const id = Number(value) >>> 0;
  return id === 0xffffffff ? -1 : id;
}

export function buildPickingVertexIds(pack) {
  const ids = new Uint32Array(pack?.vertices?.length ? pack.vertices.length / 2 : 0);
  for (const province of pack?.provinces ?? []) {
    for (const range of province.lodRanges ?? []) {
      for (let i = range.firstIndex; i < range.firstIndex + range.indexCount; i += 1) {
        const vertexIndex = pack.indices[i];
        ids[vertexIndex] = encodeProvinceIdForPicking(province.provinceIndex);
      }
    }
  }
  return ids;
}

export function createGpuPickingFramebuffer(gl, width, height) {
  if (!gl || gl.createFramebuffer === undefined) throw new Error("GPU picking requires a WebGL-capable context");
  const framebuffer = gl.createFramebuffer(); const texture = gl.createTexture();
  if (!framebuffer || !texture) throw new Error("Unable to allocate GPU picking target");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, width, height, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) { gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer); throw new Error("GPU picking framebuffer is incomplete"); }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); return { framebuffer, texture, width, height };
}

export function readProvinceId(gl, target, x, y) {
  if (!target) return -1;
  const px = Math.max(0, Math.min(target.width - 1, Math.floor(x)));
  const py = Math.max(0, Math.min(target.height - 1, target.height - 1 - Math.floor(y)));
  const pixel = new Uint32Array(1);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.readPixels(px, py, 1, 1, gl.RED_INTEGER, gl.UNSIGNED_INT, pixel);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return decodeProvinceIdFromPicking(pixel[0]);
}
