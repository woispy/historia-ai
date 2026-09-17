/**
 * Historia AI — P9 Terrain-Aware WebGPU Shaders
 *
 * Terrain-aware fragment shader with hillshade, biome colors, and river rendering.
 * Integrates with the existing WebGPUMapRenderer pipeline.
 */

export const ID_SCALE = 1 / 255;

/**
 * Extended vertex buffer layout: position (2) + terrain attributes (4) = 6 floats per vertex
 * Terrain attributes: [elevation_km, slope_normalized, hillshade, biome_id]
 */
export const TERRAIN_VERTEX_STRIDE = 6 * 4; // 6 floats * 4 bytes

export const TERRAIN_CULL_WGSL = `
struct Camera { viewProj: mat4x4<f32>, zoom: f32, _pad: vec3<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> tiles: array<u32>;
@group(0) @binding(2) var<storage, read> lods: array<u32>;
@group(0) @binding(3) var<storage, read> bounds: array<f32>;
@group(0) @binding(4) var<storage, read_write> indices: array<u32>;
@group(0) @binding(5) var<storage, read_write> indexProvinceIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> counter: atomic<u32>;
fn visible(minX:f32,minY:f32,maxX:f32,maxY:f32)->bool { let corners=array<vec2<f32>,4>(vec2(minX,minY),vec2(maxX,minY),vec2(minX,maxY),vec2(maxX,maxY)); for(var j=0u;j<4u;j=j+1u){ let c=camera.viewProj*vec4<f32>(corners[j],0.0,1.0); if(c.x>=-c.w&&c.x<=c.w&&c.y>=-c.w&&c.y<=c.w&&c.z>=-c.w&&c.z<=c.w){return true;} } return false; }
fn lodRange(province:u32)->vec2<u32>{ let b=province*4u; return vec2(lods[b],lods[b+1u]); }
@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id:vec3<u32>) { let tileIndex=id.x; if(tileIndex>=arrayLength(&tiles)/6u){return;} let t=tileIndex*6u; let province=tiles[t+2u]; let b=province*4u; if(!visible(bounds[b],bounds[b+1u],bounds[b+2u],bounds[b+3u])){return;} let range=lodRange(province); if(tileIndex<range.x||tileIndex>=range.x+range.y){return;} let pointOffset=tiles[t]; let pointCount=tiles[t+1u]; if(pointCount<3u){return;} for(var k=1u;k+1u<pointCount;k=k+1u){ let dst=atomicAdd(&counter,3u); indices[dst]=pointOffset; indices[dst+1u]=pointOffset+k; indices[dst+2u]=pointOffset+k+1u; indexProvinceIds[dst]=province; indexProvinceIds[dst+1u]=province; indexProvinceIds[dst+2u]=province; } }
`;

export const TERRAIN_FINALIZE_WGSL = `
@group(0) @binding(0) var<storage, read_write> counter: atomic<u32>;
@group(0) @binding(1) var<storage, read_write> indirect: array<u32>;
@compute @workgroup_size(1)
fn finalize(){ indirect[0]=atomicLoad(&counter); indirect[1]=1u; indirect[2]=0u; indirect[3]=0u; indirect[4]=0u; }
`;

export const TERRAIN_RENDER_WGSL = `
enable primitive_index;
struct Camera { viewProj: mat4x4<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> indexProvinceIds: array<u32>;
@group(0) @binding(2) var<storage, read> terrainAttrs: array<f32>; // [elevation_km, slope_norm, hillshade, biome_id] per vertex
@group(0) @binding(3) var<storage, read> biomePalette: array<u32>; // packed RGBA u32
@group(0) @binding(4) var<storage, read> riverWidths: array<f32>; // river width in meters per river index
@group(0) @binding(5) var<storage, read> riverIndices: array<u32>; // river index per province/tile

struct VsOut {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) provinceId: u32,
  @location(1) @interpolate(perspective) terrainAttr: vec4<f32>, // elevation_km, slope, hillshade, biome_id
};

@vertex fn vs(@location(0) p: vec2<f32>, @builtin(vertex_index) vertexIndex: u32) -> VsOut {
  var out: VsOut;
  out.position = camera.viewProj * vec4<f32>(p, 0.0, 1.0);
  out.provinceId = indexProvinceIds[vertexIndex];
  // Terrain attributes: 4 floats per vertex starting at vertexIndex * 4
  let attrOffset = vertexIndex * 4u;
  out.terrainAttr = vec4<f32>(
    terrainAttrs[attrOffset],
    terrainAttrs[attrOffset + 1u],
    terrainAttrs[attrOffset + 2u],
    terrainAttrs[attrOffset + 3u]
  );
  return out;
}

@fragment fn fs(in: VsOut) -> @location(0) vec4<f32> {
  let provinceId = in.provinceId;
  let elevationKm = in.terrainAttr.x;
  let slope = in.terrainAttr.y;
  let hillshade = in.terrainAttr.z;
  let biomeId = u32(in.terrainAttr.w);

  // Ocean check
  if (provinceId == 0xFFFFFFFFu) {
    return vec4<f32>(0.05, 0.15, 0.35, 1.0);
  }

  // Biome base color (unpack from biomePalette)
  let paletteSize = arrayLength(&biomePalette);
  let biomeColor = vec4<f32>(0.2, 0.4, 0.2, 1.0); // default temperate
  if (biomeId < paletteSize) {
    let packed = biomePalette[biomeId];
    biomeColor = vec4<f32>(
      f32((packed >> 0u) & 255u) / 255.0,
      f32((packed >> 8u) & 255u) / 255.0,
      f32((packed >> 16u) & 255u) / 255.0,
      f32((packed >> 24u) & 255u) / 255.0
    );
  }

  // Elevation-based color modulation (higher = lighter/rockier)
  let elevationFactor = smoothstep(0.0, 5.0, elevationKm);
  let baseColor = mix(biomeColor.xyz, vec3<f32>(0.7, 0.7, 0.65), elevationFactor * 0.5);

  // Slope shading (steeper = slightly darker)
  let slopeFactor = 1.0 - smoothstep(0.0, 45.0, in.terrainAttr.y * 45.0) * 0.15;

  // Hillshade multiplicative lighting
  let litColor = baseColor * slopeFactor * (0.3 + 0.7 * in.terrainAttr.z);

  // River rendering: check if this fragment is a river
  // (This would need river mask - simplified for now)

  return vec4<f32>(litColor, 1.0);
}
`;

export const TERRAIN_PICK_WGSL = `
struct Camera { viewProj: mat4x4<f32>, pickNdc: vec2<f32>, _pad: vec2<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> indexProvinceIds: array<u32>;
fn encode(id:u32)->vec4<f32>{return vec4<f32>(f32(id&255u),f32((id>>8u)&255u),f32((id>>16u)&255u),255.0)*${1/255};}
struct VsOut { @builtin(position) position: vec4<f32>, @location(0) @interpolate(flat) provinceId: u32 };
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

export const TERRAIN_BIOME_PALETTE = new Uint32Array([
  // Packed RGBA8 as u32 (R | G<<8 | B<<16 | A<<24)
  (20 << 0) | (40 << 8) | (80 << 16) | (255 << 24),     // 0: Ocean
  (255 << 0) | (255 << 8) | (255 << 16) | (255 << 24),   // 1: Ice Cap
  (200 << 0) | (220 << 8) | (230 << 16) | (255 << 24),   // 2: Tundra
  (100 << 0) | (160 << 8) | (100 << 16) | (255 << 24),   // 3: Boreal Forest
  (60 << 0) | (130 << 8) | (60 << 16) | (255 << 24),     // 4: Temperate Forest
  (180 << 0) | (180 << 8) | (80 << 16) | (255 << 24),    // 5: Mediterranean
  (220 << 0) | (200 << 8) | (100 << 16) | (255 << 24),   // 6: Desert
  (160 << 0) | (200 << 8) | (60 << 16) | (255 << 24),    // 7: Subtropical
  (40 << 0) | (120 << 8) | (40 << 16) | (255 << 24),     // 8: Tropical Rainforest
  (180 << 0) | (200 << 8) | (140 << 16) | (255 << 24),   // 9: Montane Grassland
  (160 << 0) | (180 << 8) | (160 << 16) | (255 << 24),   // 10: Alpine Tundra
]);