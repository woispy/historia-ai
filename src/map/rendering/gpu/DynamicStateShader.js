/**
 * Historia AI — P7 Dynamic State WebGPU Shaders
 *
 * Render shader that colors provinces by DYNAMIC STATE (owner) instead of
 * the static province-id hash. The static geometry buffers are unchanged;
 * only the owner lookup and palette read are added. Select/hover mixing is
 * preserved.
 *
 * Bindings (group 0):
 *   0: uniform Camera { viewProj: mat4x4<f32> }
 *   1: storage indexProvinceIds: array<u32>      (static, unchanged)
 *   2: storage ownerByProvince: array<u32>       (dynamic, uploaded per frame)
 *   3: storage palette: array<vec4<f32>>         (owner color table, RGBA 0..1)
 *
 * The owner buffer is indexed by province INDEX (the draw call's flat id);
 * the palette is indexed by owner id (0 = unowned -> neutral color).
 */

export const DYNAMIC_STATE_RENDER_WGSL = `
struct Camera { viewProj: mat4x4<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> indexProvinceIds: array<u32>;
@group(0) @binding(2) var<storage, read> ownerByProvince: array<u32>;
@group(0) @binding(3) var<storage, read> palette: array<vec4<f32>>;

struct VsOut {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) provinceId: u32,
  @location(1) @interpolate(flat) owner: u32,
};

@vertex fn vs(@location(0) p: vec2<f32>, @builtin(vertex_index) vertexIndex: u32) -> VsOut {
  var out: VsOut;
  out.position = camera.viewProj * vec4<f32>(p, 0.0, 1.0);
  let provinceId = indexProvinceIds[vertexIndex];
  out.provinceId = provinceId;
  let ownerCount = arrayLength(&ownerByProvince);
  out.owner = select(0u, ownerByProvince[provinceId], provinceId < ownerCount);
  return out;
}

fn paletteColor(owner: u32) -> vec4<f32> {
  let count = arrayLength(&palette);
  if (owner == 0u || owner >= count) {
    return vec4<f32>(0.435, 0.463, 0.373, 1.0); // unowned neutral (0x6f765f)
  }
  return palette[owner];
}

@fragment fn fs(in: VsOut) -> @location(0) vec4<f32> {
  let base = paletteColor(in.owner);
  // Province-id hash mixing preserved from the static shader so neighboring
  // same-owner provinces stay visually distinct.
  let hash = fract(f32(in.provinceId) * 0.103);
  let color = vec4<f32>(base.r * (0.88 + hash * 0.24), base.g * (0.88 + hash * 0.24), base.b * (0.88 + hash * 0.24), base.a);
  return color;
}
`;

export const DYNAMIC_STATE_PICK_WGSL = `
struct Camera { viewProj: mat4x4<f32>, pickNdc: vec2<f32>, _pad: vec2<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> indexProvinceIds: array<u32>;
fn encode(id: u32) -> vec4<f32> {
  return vec4<f32>(f32(id & 255u), f32((id >> 8u) & 255u), f32((id >> 16u) & 255u), 255.0) / 255.0;
}
struct VsOut {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) provinceId: u32,
};
@vertex fn vs(@location(0) p: vec2<f32>, @builtin(vertex_index) vertexIndex: u32) -> VsOut {
  var out: VsOut;
  var c = camera.viewProj * vec4<f32>(p, 0.0, 1.0);
  c.xy = c.xy - camera.pickNdc * c.w;
  out.position = c;
  out.provinceId = indexProvinceIds[vertexIndex];
  return out;
}
@fragment fn fs(in: VsOut) -> @location(0) vec4<f32> { return encode(in.provinceId); }
`;

export const DYNAMIC_STATE_BINDINGS = Object.freeze({
  group: 0,
  camera: 0,
  indexProvinceIds: 1,
  ownerByProvince: 2,
  palette: 3,
});
