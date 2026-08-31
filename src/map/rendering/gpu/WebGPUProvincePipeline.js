/** WebGPU-native province metadata and indirect-command contract. */
export const PROVINCE_META_BYTES = 48;
export const INDIRECT_COMMAND_BYTES = 20;

export const COMPUTE_CULL_SHADER = `
struct Camera { center : vec2<f32>, halfExtent : vec2<f32>, zoom : f32, _pad : vec3<f32> };
struct Province { bounds : vec4<f32>, lod0 : vec2<u32>, lod1 : vec2<u32>, lod2 : vec2<u32>, lod3 : vec2<u32> };
struct DrawCommand { indexCount : u32, instanceCount : u32, firstIndex : u32, baseVertex : i32, firstInstance : u32 };
@group(0) @binding(0) var<storage, read> provinces : array<Province>;
@group(0) @binding(1) var<storage, read_write> commands : array<DrawCommand>;
@group(0) @binding(2) var<uniform> camera : Camera;
fn visible(bounds : vec4<f32>) -> bool {
  let minX = camera.center.x - camera.halfExtent.x; let maxX = camera.center.x + camera.halfExtent.x;
  let minY = camera.center.y - camera.halfExtent.y; let maxY = camera.center.y + camera.halfExtent.y;
  return bounds.z >= minX && bounds.x <= maxX && bounds.w >= minY && bounds.y <= maxY;
}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let index = gid.x; if (index >= arrayLength(&provinces)) { return; }
  let p = provinces[index];
  if (!visible(p.bounds)) { commands[index].indexCount = 0u; return; }
  var range = p.lod0;
  if (camera.zoom >= 2.5) { range = p.lod1; }
  if (camera.zoom >= 8.0) { range = p.lod2; }
  if (camera.zoom >= 24.0) { range = p.lod3; }
  commands[index].indexCount = range.y;
  commands[index].instanceCount = select(0u, 1u, range.y > 0u);
  commands[index].firstIndex = range.x;
  commands[index].baseVertex = 0;
  commands[index].firstInstance = index;
}
`;

export function createProvinceMetaBufferData(pack) {
  const bytes = new ArrayBuffer((pack?.provinces?.length ?? 0) * PROVINCE_META_BYTES);
  const view = new DataView(bytes);
  for (const province of pack?.provinces ?? []) {
    const offset = province.provinceIndex * PROVINCE_META_BYTES;
    const b = province.bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    view.setFloat32(offset, b.minX, true); view.setFloat32(offset + 4, b.minY, true);
    view.setFloat32(offset + 8, b.maxX, true); view.setFloat32(offset + 12, b.maxY, true);
    for (let lod = 0; lod < 4; lod += 1) {
      const range = province.lodRanges?.[lod] ?? { firstIndex: 0, indexCount: 0 };
      view.setUint32(offset + 16 + lod * 8, range.firstIndex, true);
      view.setUint32(offset + 20 + lod * 8, range.indexCount, true);
    }
  }
  return bytes;
}

export function createIndirectCommandBuffer(provinceCount) {
  return new ArrayBuffer(Math.max(0, Number(provinceCount) || 0) * INDIRECT_COMMAND_BYTES);
}

export function writeIndirectCommand(target, index, { indexCount, firstIndex, instanceCount = 1, baseVertex = 0, firstInstance = index }) {
  const view = target instanceof DataView ? target : new DataView(target);
  const offset = index * INDIRECT_COMMAND_BYTES;
  view.setUint32(offset, Number(indexCount) >>> 0, true); view.setUint32(offset + 4, Number(instanceCount) >>> 0, true);
  view.setUint32(offset + 8, Number(firstIndex) >>> 0, true); view.setInt32(offset + 12, Number(baseVertex) | 0, true);
  view.setUint32(offset + 16, Number(firstInstance) >>> 0, true);
}

export function validateIndirectCommand(command, indexCount) {
  if (!command || command.byteLength < INDIRECT_COMMAND_BYTES) return false;
  const view = command instanceof DataView ? command : new DataView(command);
  const count = view.getUint32(0, true); const first = view.getUint32(8, true);
  return count % 3 === 0 && first + count <= indexCount;
}
