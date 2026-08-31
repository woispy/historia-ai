/**
 * WebGPU-native province rendering contract.
 * Buffers are intentionally POD/array based so the same metadata can be emitted
 * by the deterministic GPU pack builder and consumed by compute culling.
 */

export const PROVINCE_META_FLOATS = 12;
export const TILE_META_FLOATS = 8;
export const INDIRECT_COMMAND_UINTS = 5;

export const COMPUTE_CULL_SHADER = `
struct Camera { viewport : vec4<f32>, zoom : f32, _pad0 : vec3<f32> };
struct Province { bounds : vec4<f32>, lod0 : vec2<u32>, lod1 : vec2<u32>, lod2 : vec2<u32>, lod3 : vec2<u32> };
struct DrawCommand { indexCount : atomic<u32>, instanceCount : u32, firstIndex : u32, baseVertex : i32, firstInstance : u32 };
@group(0) @binding(0) var<storage, read> provinces : array<Province>;
@group(0) @binding(1) var<storage, read_write> commands : array<DrawCommand>;
@group(0) @binding(2) var<uniform> camera : Camera;

fn visible(bounds : vec4<f32>) -> bool {
  let halfW = camera.viewport.z / max(camera.zoom, 0.0001);
  let halfH = camera.viewport.w / max(camera.zoom, 0.0001);
  let minX = camera.viewport.x - halfW;
  let maxX = camera.viewport.x + halfW;
  let minY = camera.viewport.y - halfH;
  let maxY = camera.viewport.y + halfH;
  return bounds.z >= minX && bounds.x <= maxX && bounds.w >= minY && bounds.y <= maxY;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let index = gid.x;
  if (index >= arrayLength(&provinces)) { return; }
  let province = provinces[index];
  if (!visible(province.bounds)) { return; }
  let lod = select(0u, select(1u, select(2u, 3u, camera.zoom >= 24.0), camera.zoom >= 8.0), camera.zoom >= 2.5);
  var range = province.lod0;
  if (lod == 1u) { range = province.lod1; }
  if (lod == 2u) { range = province.lod2; }
  if (lod == 3u) { range = province.lod3; }
  if (range.y == 0u) { return; }
  // One command slot per stable province index keeps the first implementation deterministic.
  commands[index].indexCount = range.y;
  commands[index].instanceCount = 1u;
  commands[index].firstIndex = range.x;
  commands[index].baseVertex = 0;
  commands[index].firstInstance = index;
}
`;

export function createProvinceMetaArray(pack) {
  const data = new Float32Array((pack?.provinces?.length ?? 0) * PROVINCE_META_FLOATS);
  for (const province of pack?.provinces ?? []) {
    const offset = province.provinceIndex * PROVINCE_META_FLOATS;
    const b = province.bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    data.set([b.minX, b.minY, b.maxX, b.maxY], offset);
    for (let lod = 0; lod < 4; lod += 1) {
      const range = province.lodRanges?.[lod] ?? { firstIndex: 0, indexCount: 0 };
      data[offset + 4 + lod * 2] = range.firstIndex;
      data[offset + 5 + lod * 2] = range.indexCount;
    }
  }
  return data;
}

export function createIndirectCommandBuffer(provinceCount) {
  return new Uint32Array(Math.max(0, Number(provinceCount) || 0) * INDIRECT_COMMAND_UINTS);
}

export function validateIndirectCommand(command, indexCount) {
  if (!command || command.length < 5) return false;
  const count = Number(command[0]);
  const first = Number(command[2]);
  return Number.isInteger(count) && Number.isInteger(first)
    && count >= 0 && count % 3 === 0 && first >= 0 && first + count <= indexCount;
}
