import { useEffect, useRef } from "react";
import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas";
import { buildMapTextureSet } from "./MapTextureAtlas";

const VERTEX_SHADER = `
attribute vec2 a_position;
uniform vec2 u_center;
uniform vec2 u_viewSize;
varying vec2 v_uv;

void main() {
  float longitude = u_center.x + a_position.x * u_viewSize.x * 0.5;
  float latitude = u_center.y + a_position.y * u_viewSize.y * 0.5;
  v_uv = vec2((longitude + 180.0) / 360.0, (90.0 - latitude) / 180.0);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_provinces;
uniform sampler2D u_landMask;
uniform vec3 u_landColor;
varying vec2 v_uv;

void main() {
  float land = texture2D(u_landMask, v_uv).r;
  if (land < 0.5) discard;

  vec4 political = texture2D(u_provinces, v_uv);
  vec3 color = mix(u_landColor, political.rgb, political.a);
  gl_FragColor = vec4(color, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown WebGL program link error";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createTexture(gl, source, filter = gl.LINEAR) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function resizeCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function renderFrame(renderer, camera) {
  if (!renderer || !camera) return;
  const { canvas, gl, program, positionBuffer, uniforms } = renderer;
  resizeCanvas(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  const zoom = Math.max(0.75, Number(camera.zoom ?? 1));
  gl.uniform2f(uniforms.center, Number(camera.x ?? 0), Number(camera.y ?? 0));
  gl.uniform2f(uniforms.viewSize, 360 / zoom, 180 / zoom);
  gl.uniform3f(uniforms.landColor, 0.157, 0.196, 0.173);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.provinceTexture);
  gl.uniform1i(uniforms.provinces, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, renderer.landMaskTexture);
  gl.uniform1i(uniforms.landMask, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function buildRenderer(canvas, provinces, mapStyle) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const runtimeProvinces = provinces.filter(
    (entry) => entry?.province?.historical?.classification !== "curated-regional-gameplay-overlay",
  );
  const colorResolver = ({ country }) => (
    mapStyle === "terrain" ? country?.terrainColor ?? country?.color : country?.color
  );
  const textures = buildMapTextureSet(
    runtimeProvinces,
    WORLD_LAND_POLYGONS,
    maxTextureSize,
    colorResolver,
  );
  if (!textures.provinces || !textures.landMask) return null;

  const program = createProgram(gl);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const renderer = {
    gl,
    canvas,
    program,
    positionBuffer,
    positionLocation: gl.getAttribLocation(program, "a_position"),
    provinceTexture: createTexture(gl, textures.provinces, gl.LINEAR),
    landMaskTexture: createTexture(gl, textures.landMask, gl.NEAREST),
    uniforms: {
      center: gl.getUniformLocation(program, "u_center"),
      viewSize: gl.getUniformLocation(program, "u_viewSize"),
      provinces: gl.getUniformLocation(program, "u_provinces"),
      landMask: gl.getUniformLocation(program, "u_landMask"),
      landColor: gl.getUniformLocation(program, "u_landColor"),
    },
  };

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return renderer;
}

function destroyRenderer(renderer) {
  if (!renderer) return;
  renderer.gl.deleteTexture(renderer.provinceTexture);
  renderer.gl.deleteTexture(renderer.landMaskTexture);
  renderer.gl.deleteBuffer(renderer.positionBuffer);
  renderer.gl.deleteProgram(renderer.program);
}

function ProvinceTextureLayer({ provinces = [], camera = {}, mapStyle = "detailed", onReady }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(camera);
  const frameRef = useRef(0);

  useEffect(() => {
    cameraRef.current = camera;
    if (frameRef.current) return undefined;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      renderFrame(rendererRef.current, cameraRef.current);
    });
    return undefined;
  }, [camera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer = null;
    try {
      renderer = buildRenderer(canvas, provinces, mapStyle);
    } catch (error) {
      console.error("Historia AI map WebGL initialization failed", error);
    }

    if (!renderer) {
      onReady?.(false);
      return undefined;
    }

    rendererRef.current = renderer;
    onReady?.(true);
    const resizeObserver = new ResizeObserver(() => renderFrame(rendererRef.current, cameraRef.current));
    resizeObserver.observe(canvas);
    renderFrame(renderer, cameraRef.current);

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      destroyRenderer(rendererRef.current);
      rendererRef.current = null;
    };
  }, [provinces, mapStyle, onReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="map-gpu-province-layer"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

export default ProvinceTextureLayer;
