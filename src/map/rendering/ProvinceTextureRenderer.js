/**
 * Historia AI — GPU province texture renderer
 *
 * The CPU builds stable province/color, province/ID and land-mask textures once.
 * WebGL then composites those textures in a single fullscreen draw call. Camera
 * movement only changes uniforms; province geometry is not re-walked per frame.
 */

export const PROVINCE_TEXTURE_SIZE = Object.freeze({
  color: { width: 4096, height: 2048 },
  id: { width: 2048, height: 1024 },
  land: { width: 2048, height: 1024 },
});

function hexToRgb(hex) {
  const value = String(hex ?? "#6f765f").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return [111, 118, 95];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function buildPolygonPath(ctx, polygon, width, height) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  const projectX = (x) => ((x + 180) / 360) * width;
  const projectY = (y) => ((90 - y) / 180) * height;
  ctx.beginPath();
  polygon.forEach(([x, y], index) => {
    const px = projectX(x);
    const py = projectY(y);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  return true;
}

function drawProvinceTexture(provinces, size, selectedProvinceId) {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D context is unavailable.");

  ctx.clearRect(0, 0, size.width, size.height);
  for (const { province, country, geometry } of provinces) {
    const polygons = geometry?.polygons;
    if (!Array.isArray(polygons)) continue;

    const [r, g, b] = hexToRgb(country?.color);
    ctx.fillStyle = `rgb(${r} ${g} ${b})`;
    for (const polygon of polygons) {
      if (buildPolygonPath(ctx, polygon, size.width, size.height)) ctx.fill("nonzero");
    }
  }

  return canvas;
}

function encodeId(id) {
  const safe = Math.max(1, Number(id) || 1) >>> 0;
  return [safe & 255, (safe >>> 8) & 255, (safe >>> 16) & 255];
}

function drawIdTexture(provinces, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D ID context is unavailable.");

  ctx.clearRect(0, 0, size.width, size.height);
  for (const { province, geometry } of provinces) {
    const polygons = geometry?.polygons;
    if (!Array.isArray(polygons)) continue;
    const [r, g, b] = encodeId(province.id);
    ctx.fillStyle = `rgb(${r} ${g} ${b})`;
    for (const polygon of polygons) {
      if (buildPolygonPath(ctx, polygon, size.width, size.height)) ctx.fill("nonzero");
    }
  }
  return canvas;
}

function drawLandMask(size, landPath) {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D land-mask context is unavailable.");

  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = "white";
  const path = new Path2D(landPath);
  ctx.save();
  ctx.translate(0, size.height);
  ctx.scale(size.width / 360, -size.height / 180);
  ctx.fill(path, "nonzero");
  ctx.restore();
  return canvas;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    uniform vec2 u_center;
    uniform float u_zoom;
    uniform float u_aspect;
    void main() {
      vec2 world = a_position;
      float visibleWidth = 360.0 / u_zoom;
      float visibleHeight = 180.0 / u_zoom;
      float x = (world.x - u_center.x) / (visibleWidth * 0.5);
      float y = (world.y - u_center.y) / (visibleHeight * 0.5);
      float mapAspect = visibleWidth / visibleHeight;
      if (u_aspect > mapAspect) {
        x *= mapAspect / u_aspect;
      } else {
        y *= u_aspect / mapAspect;
      }
      gl_Position = vec4(x, y, 0.0, 1.0);
      v_uv = vec2((world.x + 180.0) / 360.0, (world.y + 90.0) / 180.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_color;
    uniform sampler2D u_id;
    uniform sampler2D u_land;
    uniform vec3 u_selectedId;
    uniform vec4 u_selectedColor;
    void main() {
      vec4 color = texture2D(u_color, v_uv);
      float land = texture2D(u_land, v_uv).r;
      vec3 id = texture2D(u_id, v_uv).rgb;
      float selected = step(0.002, 1.0 - distance(id, u_selectedId));
      vec3 finalColor = mix(color.rgb, u_selectedColor.rgb, selected * u_selectedColor.a);
      gl_FragColor = vec4(finalColor, color.a * land);
    }
  `;

  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown program link error";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function uploadTexture(gl, image, unit, linear = true) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return texture;
}

export function buildProvinceTextureSet(provinces, landPath, selectedProvinceId = null) {
  const color = drawProvinceTexture(provinces, PROVINCE_TEXTURE_SIZE.color, selectedProvinceId);
  const id = drawIdTexture(provinces, PROVINCE_TEXTURE_SIZE.id);
  const land = drawLandMask(PROVINCE_TEXTURE_SIZE.land, landPath);
  return { color, id, land };
}

export function createProvinceGpuRenderer(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return null;

  const program = createProgram(gl);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -180, -90, 180, -90, -180, 90,
    -180, 90, 180, -90, 180, 90,
  ]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "a_position");
  const uniforms = {
    center: gl.getUniformLocation(program, "u_center"),
    zoom: gl.getUniformLocation(program, "u_zoom"),
    aspect: gl.getUniformLocation(program, "u_aspect"),
    color: gl.getUniformLocation(program, "u_color"),
    id: gl.getUniformLocation(program, "u_id"),
    land: gl.getUniformLocation(program, "u_land"),
    selectedId: gl.getUniformLocation(program, "u_selectedId"),
    selectedColor: gl.getUniformLocation(program, "u_selectedColor"),
  };

  let textures = null;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  }

  function setTextures(textureSet) {
    if (textures) {
      gl.deleteTexture(textures.color);
      gl.deleteTexture(textures.id);
      gl.deleteTexture(textures.land);
    }
    textures = {
      color: uploadTexture(gl, textureSet.color, 0, true),
      id: uploadTexture(gl, textureSet.id, 1, false),
      land: uploadTexture(gl, textureSet.land, 2, true),
    };
  }

  function render(camera, selectedProvinceId = null) {
    if (!textures) return;
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const aspect = canvas.height ? canvas.width / canvas.height : 2;
    gl.uniform2f(uniforms.center, Number(camera?.x ?? 0), Number(camera?.y ?? 0));
    gl.uniform1f(uniforms.zoom, Math.max(0.75, Number(camera?.zoom ?? 1)));
    gl.uniform1f(uniforms.aspect, aspect);
    gl.uniform1i(uniforms.color, 0);
    gl.uniform1i(uniforms.id, 1);
    gl.uniform1i(uniforms.land, 2);

    const encoded = encodeId(selectedProvinceId);
    gl.uniform3f(uniforms.selectedId, encoded[0] / 255, encoded[1] / 255, encoded[2] / 255);
    gl.uniform4f(uniforms.selectedColor, 0.84, 0.69, 0.30, selectedProvinceId ? 0.48 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function dispose() {
    if (textures) {
      gl.deleteTexture(textures.color);
      gl.deleteTexture(textures.id);
      gl.deleteTexture(textures.land);
    }
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  }

  return { setTextures, render, resize, dispose };
}

export function getProvinceIdAtPoint(idCanvas, clientX, clientY, rect) {
  if (!idCanvas || !rect?.width || !rect?.height) return null;
  const x = Math.max(0, Math.min(idCanvas.width - 1, Math.floor(((clientX - rect.left) / rect.width) * idCanvas.width)));
  const y = Math.max(0, Math.min(idCanvas.height - 1, Math.floor(((clientY - rect.top) / rect.height) * idCanvas.height)));
  const data = idCanvas.getContext("2d", { willReadFrequently: true }).getImageData(x, y, 1, 1).data;
  const id = data[0] + (data[1] << 8) + (data[2] << 16);
  return id || null;
}
