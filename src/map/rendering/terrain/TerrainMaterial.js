export const TERRAIN_SPLAT_CHANNELS = Object.freeze([
  "desert",
  "forest",
  "steppe",
  "rock",
  "snow",
]);

export const TERRAIN_MATERIAL_DEFAULTS = Object.freeze({
  roughness: 0.82,
  ambient: 0.34,
  heightScale: 0.06,
  normalStrength: 0.72,
  slopeRockBias: 0.55,
  snowHeightBias: 0.48,
});

export function normalizeSplatWeights(weights) {
  if (!weights || weights.length !== 5) throw new Error("Terrain splat weights require five logical channels.");
  const values = Array.from(weights, Number).map((value) => Math.max(0, Number.isFinite(value) ? value : 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return [0, 0, 1, 0, 0];
  return values.map((value) => value / total);
}

/** Five logical layers are transported as RGBA + a grayscale snow texture. */
export const TERRAIN_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
layout(location = 1) in float aHeight;
layout(location = 2) in vec2 aUv;
out vec2 vUv;
out float vHeight;
uniform mat4 uViewProjection;
uniform float uHeightScale;
void main() {
  vUv = aUv;
  vHeight = aHeight;
  gl_Position = uViewProjection * vec4(aPosition, aHeight * uHeightScale, 1.0);
}`;

export const TERRAIN_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
in float vHeight;
layout(location = 0) out vec4 outColor;
uniform sampler2D uBaseColor;
uniform sampler2D uNormal;
uniform sampler2D uSplatRgba;
uniform sampler2D uSplatSnow;
uniform sampler2D uLandMask;
uniform float uRoughness;
uniform float uAmbient;
uniform float uNormalStrength;
void main() {
  float land = texture(uLandMask, vUv).r;
  if (land < 0.5) discard;
  vec4 splat = texture(uSplatRgba, vUv);
  float snow = texture(uSplatSnow, vUv).r;
  float total = max(dot(splat, vec4(1.0)) + snow, 0.0001);
  splat /= total;
  snow /= total;
  vec3 base = texture(uBaseColor, vUv).rgb;
  vec3 normalMap = texture(uNormal, vUv).xyz * 2.0 - 1.0;
  float lighting = clamp(uAmbient + normalMap.z * uNormalStrength * 0.5, 0.0, 1.0);
  float tonal = mix(0.88, 1.08, clamp(vHeight, 0.0, 1.0));
  float rough = clamp(uRoughness + splat.g * 0.05 + splat.b * 0.08 + snow * 0.02, 0.0, 1.0);
  outColor = vec4(base * lighting * tonal * mix(1.0, 0.94, rough), 1.0);
}`;
