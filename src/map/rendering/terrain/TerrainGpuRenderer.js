import { buildTerrainGridMesh } from "./TerrainGeometry.js";
import { TERRAIN_MATERIAL_DEFAULTS, TERRAIN_VERTEX_SHADER, TERRAIN_FRAGMENT_SHADER } from "./TerrainMaterial.js";

const VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
layout(location=1) in float aHeight;
layout(location=2) in vec2 aUv;
out vec2 vUv;
out float vHeight;
uniform vec4 uTileBounds;
uniform vec2 uCameraCenter;
uniform float uZoom;
uniform float uPitch;
uniform float uYaw;
uniform float uHeightScale;
void main(){
  vec2 world=mix(uTileBounds.xy,uTileBounds.zw,aPosition);
  vec2 p=world-uCameraCenter;
  float y=radians(uYaw); float pch=radians(uPitch);
  vec2 r=vec2(p.x*cos(y)-p.y*sin(y),p.x*sin(y)+p.y*cos(y));
  r.y*=max(0.65,cos(pch));
  vec2 view=vec2(360.0,180.0)/max(uZoom,0.001);
  vUv=aUv; vHeight=aHeight;
  gl_Position=vec4(r/(view*0.5),aHeight*uHeightScale/100.0,1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv; in float vHeight;
uniform sampler2D uBaseColor; uniform sampler2D uNormal; uniform sampler2D uSplatRgba; uniform sampler2D uSplatSnow; uniform sampler2D uLandMask;
uniform float uRoughness; uniform float uAmbient; uniform float uSunStrength; uniform float uNormalStrength; uniform vec3 uSunDirection;
out vec4 outColor;
void main(){
  float land=texture(uLandMask,vUv).r; if(land<0.5)discard;
  vec4 splat=texture(uSplatRgba,vUv); float snow=texture(uSplatSnow,vUv).r;
  float total=max(dot(splat,vec4(1.0))+snow,0.0001); splat/=total; snow/=total;
  vec3 palette=vec3(0.72,0.58,0.38)*splat.r+vec3(0.28,0.42,0.24)*splat.g+vec3(0.52,0.50,0.31)*splat.b+vec3(0.43,0.43,0.40)*splat.a+vec3(0.78,0.80,0.78)*snow;
  vec3 base=texture(uBaseColor,vUv).rgb*max(palette,vec3(0.05));
  vec3 normalMap=normalize(texture(uNormal,vUv).xyz*2.0-1.0); normalMap.xy*=uNormalStrength; normalMap=normalize(normalMap);
  float sun=max(dot(normalMap,normalize(uSunDirection)),0.0); float lighting=clamp(uAmbient+sun*uSunStrength,0.0,1.5);
  float tonal=mix(0.88,1.08,clamp(vHeight,0.0,1.0)); float rough=clamp(uRoughness+splat.g*0.05+splat.b*0.08+snow*0.02,0.0,1.0); float highlight=mix(1.04,0.97,rough);
  outColor=vec4(base*lighting*tonal*highlight,1.0);
}`;

export class TerrainGpuRenderer {
  constructor(gl, material = TERRAIN_MATERIAL_DEFAULTS) {
    if (!gl || typeof gl.createVertexArray !== "function") throw new Error("TerrainGpuRenderer requires a WebGL2 context.");
    this.gl = gl; this.material = { ...TERRAIN_MATERIAL_DEFAULTS, ...material }; this.program = createProgram(gl); this.tiles = new Map(); this.disposed = false;
    this.uniforms = {
      tileBounds: gl.getUniformLocation(this.program, "uTileBounds"), cameraCenter: gl.getUniformLocation(this.program, "uCameraCenter"), zoom: gl.getUniformLocation(this.program, "uZoom"), pitch: gl.getUniformLocation(this.program, "uPitch"), yaw: gl.getUniformLocation(this.program, "uYaw"), heightScale: gl.getUniformLocation(this.program, "uHeightScale"), roughness: gl.getUniformLocation(this.program, "uRoughness"), ambient: gl.getUniformLocation(this.program, "uAmbient"), sunStrength: gl.getUniformLocation(this.program, "uSunStrength"), normalStrength: gl.getUniformLocation(this.program, "uNormalStrength"), sunDirection: gl.getUniformLocation(this.program, "uSunDirection"), baseColor: gl.getUniformLocation(this.program, "uBaseColor"), normal: gl.getUniformLocation(this.program, "uNormal"), splatRgba: gl.getUniformLocation(this.program, "uSplatRgba"), splatSnow: gl.getUniformLocation(this.program, "uSplatSnow"), landMask: gl.getUniformLocation(this.program, "uLandMask")
    };
  }

  uploadTile(tileId, asset) {
    if (this.disposed) throw new Error("Cannot upload into a disposed terrain renderer.");
    this.removeTile(tileId);
    const mesh = buildTerrainGridMesh({ heights: asset.heights, size: asset.size, skirtDepth: 0.02 });
    const { gl } = this, vao = gl.createVertexArray(), position = gl.createBuffer(), height = gl.createBuffer(), uv = gl.createBuffer(), index = gl.createBuffer();
    if (!vao || !position || !height || !uv || !index) throw new Error(`Terrain GPU allocation failed for ${tileId}.`);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, position); gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 12, 0);
    const heightValues = new Float32Array(asset.heights); gl.bindBuffer(gl.ARRAY_BUFFER, height); gl.bufferData(gl.ARRAY_BUFFER, heightValues, gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 4, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, uv); gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW); gl.bindVertexArray(null);
    const textures = [createSolidTexture(gl, [255,255,255,255]), createNormalTexture(gl, asset), createTexture(gl, asset.splatRgba, asset.size, asset.size, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE), createTexture(gl, asset.splatSnow, asset.size, asset.size, gl.R8, gl.RED, gl.UNSIGNED_BYTE), createTexture(gl, asset.landMask, asset.size, asset.size, gl.R8, gl.RED, gl.UNSIGNED_BYTE)];
    this.tiles.set(tileId, { vao, buffers: [position, height, uv, index], textures, count: mesh.indices.length, bounds: asset.bounds });
  }

  removeTile(tileId) { const tile = this.tiles.get(tileId); if (!tile) return; const { gl } = this; gl.deleteVertexArray(tile.vao); for (const buffer of tile.buffers) gl.deleteBuffer(buffer); for (const texture of tile.textures) gl.deleteTexture(texture); this.tiles.delete(tileId); }

  draw(camera = {}) {
    if (this.disposed || !this.tiles.size) return 0;
    const { gl } = this; gl.useProgram(this.program); gl.uniform2f(this.uniforms.cameraCenter, Number(camera.x) || 0, Number(camera.y) || 0); gl.uniform1f(this.uniforms.zoom, Number(camera.zoom) || 1); gl.uniform1f(this.uniforms.pitch, Number(camera.pitch) || 0); gl.uniform1f(this.uniforms.yaw, Number(camera.yaw) || 0); gl.uniform1f(this.uniforms.heightScale, this.material.heightScale); gl.uniform1f(this.uniforms.roughness, this.material.roughness); gl.uniform1f(this.uniforms.ambient, this.material.ambient); gl.uniform1f(this.uniforms.sunStrength, this.material.sunStrength); gl.uniform1f(this.uniforms.normalStrength, this.material.normalStrength); gl.uniform3fv(this.uniforms.sunDirection, this.material.sunDirection);
    let triangles = 0;
    for (const tile of this.tiles.values()) {
      gl.uniform4f(this.uniforms.tileBounds, tile.bounds.minX, tile.bounds.minY, tile.bounds.maxX, tile.bounds.maxY);
      gl.bindVertexArray(tile.vao);
      for (let unit = 0; unit < tile.textures.length; unit += 1) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tile.textures[unit]); }
      gl.uniform1i(this.uniforms.baseColor, 0); gl.uniform1i(this.uniforms.normal, 1); gl.uniform1i(this.uniforms.splatRgba, 2); gl.uniform1i(this.uniforms.splatSnow, 3); gl.uniform1i(this.uniforms.landMask, 4);
      gl.drawElements(gl.TRIANGLES, tile.count, gl.UNSIGNED_INT, 0); triangles += tile.count / 3;
    }
    gl.bindVertexArray(null); return triangles;
  }

  dispose() { if (this.disposed) return; this.disposed = true; for (const id of [...this.tiles.keys()]) this.removeTile(id); this.gl.deleteProgram(this.program); }
}

function createTexture(gl, data, width, height, internalFormat, format, type) { const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data); return texture; }
function createSolidTexture(gl, rgba) { return createTexture(gl, new Uint8Array(rgba), 1, 1, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE); }
function createNormalTexture(gl, asset) { const rgba = new Uint8Array(asset.size * asset.size * 4); for (let i = 0; i < asset.size * asset.size; i += 1) { rgba[i*4] = asset.normals[i*3] + 128; rgba[i*4+1] = asset.normals[i*3+1] + 128; rgba[i*4+2] = asset.normals[i*3+2] + 128; rgba[i*4+3] = 255; } return createTexture(gl, rgba, asset.size, asset.size, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE); }
function compileShader(gl, type, source) { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const error = gl.getShaderInfoLog(shader) || "unknown terrain shader error"; gl.deleteShader(shader); throw new Error(error); } return shader; }
function createProgram(gl) { const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX); const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT); const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { const error = gl.getProgramInfoLog(program) || "Terrain program link failed"; gl.deleteProgram(program); throw new Error(error); } return program; }
