import { TERRAIN_FRAGMENT_SHADER, TERRAIN_VERTEX_SHADER, TERRAIN_MATERIAL_DEFAULTS } from "./TerrainMaterial.js";

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate terrain shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "unknown shader error";
    gl.deleteShader(shader);
    throw new Error(`Terrain shader compilation failed: ${log}`);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, TERRAIN_VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, TERRAIN_FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to allocate terrain program.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "unknown program error";
    gl.deleteProgram(program);
    throw new Error(`Terrain program linking failed: ${log}`);
  }
  return program;
}

function uploadTexture(gl, texture, unit, source, internalFormat = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, source);
  gl.generateMipmap(gl.TEXTURE_2D);
}

export class TerrainGpuRenderer {
  constructor(gl, material = TERRAIN_MATERIAL_DEFAULTS) {
    if (!gl || typeof gl.createVertexArray !== "function") throw new Error("TerrainGpuRenderer requires a WebGL2 context.");
    this.gl = gl;
    this.material = { ...TERRAIN_MATERIAL_DEFAULTS, ...material };
    this.program = createProgram(gl);
    this.vao = gl.createVertexArray();
    this.positionBuffer = gl.createBuffer();
    this.heightBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    this.textures = [gl.createTexture(), gl.createTexture(), gl.createTexture(), gl.createTexture(), gl.createTexture()];
    this.indexCount = 0;
    if (!this.vao || this.textures.some((texture) => !texture)) throw new Error("Unable to allocate terrain GPU resources.");
  }

  uploadMesh(mesh) {
    const { gl } = this;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 12, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.heightBuffer);
    const heights = new Float32Array(mesh.positions.length / 3);
    for (let i = 0; i < heights.length; i += 1) heights[i] = mesh.positions[i * 3 + 2];
    gl.bufferData(gl.ARRAY_BUFFER, heights, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 4, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    this.indexCount = mesh.indices.length;
    gl.bindVertexArray(null);
  }

  uploadTextures({ baseColor, normal, splatRgba, splatSnow, landMask }) {
    if (!baseColor || !normal || !splatRgba || !splatSnow || !landMask) {
      throw new Error("Terrain renderer requires baseColor, normal, RGBA splat, snow splat and land-mask textures.");
    }
    uploadTexture(this.gl, this.textures[0], 0, baseColor);
    uploadTexture(this.gl, this.textures[1], 1, normal);
    uploadTexture(this.gl, this.textures[2], 2, splatRgba);
    uploadTexture(this.gl, this.textures[3], 3, splatSnow);
    uploadTexture(this.gl, this.textures[4], 4, landMask);
  }

  draw({ viewProjection, heightScale = this.material.heightScale } = {}) {
    if (!this.indexCount) return 0;
    const { gl } = this;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uViewProjection"), false, viewProjection);
    gl.uniform1f(gl.getUniformLocation(this.program, "uHeightScale"), heightScale);
    gl.uniform1f(gl.getUniformLocation(this.program, "uRoughness"), this.material.roughness);
    gl.uniform1f(gl.getUniformLocation(this.program, "uAmbient"), this.material.ambient);
    gl.uniform1f(gl.getUniformLocation(this.program, "uSunStrength"), this.material.sunStrength);
    gl.uniform1f(gl.getUniformLocation(this.program, "uNormalStrength"), this.material.normalStrength);
    gl.uniform3fv(gl.getUniformLocation(this.program, "uSunDirection"), this.material.sunDirection);
    gl.uniform3fv(gl.getUniformLocation(this.program, "uTerrainPalette"), new Float32Array(this.material.palette.flat()));
    for (let unit = 0; unit < this.textures.length; unit += 1) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[unit]);
    }
    gl.uniform1i(gl.getUniformLocation(this.program, "uBaseColor"), 0);
    gl.uniform1i(gl.getUniformLocation(this.program, "uNormal"), 1);
    gl.uniform1i(gl.getUniformLocation(this.program, "uSplatRgba"), 2);
    gl.uniform1i(gl.getUniformLocation(this.program, "uSplatSnow"), 3);
    gl.uniform1i(gl.getUniformLocation(this.program, "uLandMask"), 4);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
    return this.indexCount / 3;
  }

  dispose() {
    const { gl } = this;
    for (const texture of this.textures) gl.deleteTexture(texture);
    gl.deleteBuffer(this.positionBuffer);
    gl.deleteBuffer(this.heightBuffer);
    gl.deleteBuffer(this.uvBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    this.indexCount = 0;
  }
}
