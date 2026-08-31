export const WATER_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aUv;

uniform vec2 uCameraCenter;
uniform vec2 uViewSize;
uniform vec2 uViewportScale;

out vec2 vUv;

void main() {
  vec2 normalized = (aPosition - uCameraCenter) / (uViewSize * 0.5);
  normalized *= uViewportScale;
  gl_Position = vec4(normalized, 0.0, 1.0);
  vUv = aUv;
}
`;

export const WATER_SURFACE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uPhysicalMask;
uniform sampler2D uNormalMap;
uniform float uTime;
uniform float uSurfaceMode;
uniform float uOpacity;
uniform vec3 uOceanColor;
uniform vec3 uSeaColor;
uniform vec3 uLakeColor;
uniform vec3 uReflectionColor;
uniform float uRoughness;

in vec2 vUv;
out vec4 outColor;

float maskLand() { return texture(uPhysicalMask, vUv).r; }
float maskLake() { return texture(uPhysicalMask, vUv).g; }
float maskSea() { return texture(uPhysicalMask, vUv).b; }

float waterPresence() {
  float land = maskLand();
  float lake = maskLake();
  float sea = maskSea();
  if (uSurfaceMode < 0.5) return max(1.0 - land, sea);
  if (uSurfaceMode < 1.5) return lake;
  return max(1.0 - land, max(lake, sea));
}

float shorelineFoam() {
  vec2 texel = vec2(1.0 / 2048.0, 1.0 / 1024.0);
  float localWater = waterPresence();
  float neighbour = 0.0;
  neighbour += max(1.0 - texture(uPhysicalMask, vUv + vec2(texel.x, 0.0)).r, texture(uPhysicalMask, vUv + vec2(texel.x, 0.0)).g);
  neighbour += max(1.0 - texture(uPhysicalMask, vUv - vec2(texel.x, 0.0)).r, texture(uPhysicalMask, vUv - vec2(texel.x, 0.0)).g);
  neighbour += max(1.0 - texture(uPhysicalMask, vUv + vec2(0.0, texel.y)).r, texture(uPhysicalMask, vUv + vec2(0.0, texel.y)).g);
  neighbour += max(1.0 - texture(uPhysicalMask, vUv - vec2(0.0, texel.y)).r, texture(uPhysicalMask, vUv - vec2(0.0, texel.y)).g);
  return smoothstep(0.8, 3.0, neighbour) * localWater;
}

void main() {
  float land = maskLand();
  float lake = maskLake();
  float sea = maskSea();
  bool ocean = land < 0.5;
  bool seaWater = sea > 0.5;
  bool lakeWater = lake > 0.5;

  if (uSurfaceMode < 0.5 && !(ocean || seaWater)) discard;
  if (uSurfaceMode >= 0.5 && uSurfaceMode < 1.5 && !lakeWater) discard;
  if (uSurfaceMode >= 1.5 && !(ocean || seaWater || lakeWater)) discard;

  vec2 nUv = fract(vUv * 7.0 + vec2(uTime * 0.008, -uTime * 0.004));
  vec3 normalSample = texture(uNormalMap, nUv).xyz * 2.0 - 1.0;
  vec3 normal = normalize(vec3(normalSample.xy * 0.24, 1.0));
  vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
  float reflection = mix(0.12, 0.34, fresnel) * (1.0 - uRoughness);

  vec3 base = ocean ? uOceanColor : (lakeWater ? uLakeColor : uSeaColor);
  base += vec3(normalSample.xy * 0.018, 0.0);
  base = mix(base, uReflectionColor, reflection);

  float movingWave = 0.5 + 0.5 * sin((vUv.x * 43.0 + vUv.y * 31.0) + uTime * 0.55);
  base += movingWave * 0.012;
  base = mix(base, vec3(0.93, 0.98, 0.98), shorelineFoam() * 0.26);

  float depthTint = lakeWater ? 0.86 : (ocean ? 1.0 : 0.94);
  outColor = vec4(base * depthTint, uOpacity);
}
`;

export const RIVER_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aFlow;
in float aSide;
in float aUv;
in float aWidth;
in float aDepth;

uniform vec2 uCameraCenter;
uniform vec2 uViewSize;
uniform vec2 uViewportScale;

out vec2 vUv;
out vec2 vFlow;
out vec2 vMaskUv;
out float vDepth;

void main() {
  vec2 flow = normalize(aFlow);
  vec2 normal = vec2(-flow.y, flow.x);
  vec2 worldPosition = aPosition + normal * aSide * aWidth;
  vec2 normalized = (worldPosition - uCameraCenter) / (uViewSize * 0.5);
  normalized *= uViewportScale;
  gl_Position = vec4(normalized, 0.0, 1.0);
  vUv = vec2(aUv, aSide * 0.5 + 0.5);
  vFlow = flow;
  vMaskUv = vec2((aPosition.x + 180.0) / 360.0, (90.0 - aPosition.y) / 180.0);
  vDepth = aDepth;
}
`;

export const RIVER_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uPhysicalMask;
uniform sampler2D uNormalMap;
uniform float uTime;
uniform float uFlowSpeed;
uniform vec3 uRiverColor;
uniform vec3 uFoamColor;

in vec2 vUv;
in vec2 vFlow;
in vec2 vMaskUv;
in float vDepth;
out vec4 outColor;

void main() {
  vec4 mask = texture(uPhysicalMask, vMaskUv);
  if (mask.r < 0.5 || mask.g > 0.5 || mask.b > 0.5) discard;

  float flowPhase = vUv.x * 22.0 - uTime * uFlowSpeed;
  float flowNoise = texture(uNormalMap, fract(vec2(flowPhase * 0.045, vUv.y * 3.0))).r;
  float wave = 0.5 + 0.5 * sin(flowPhase + flowNoise * 6.2831);
  float edge = 1.0 - smoothstep(0.34, 0.50, abs(vUv.y - 0.5));
  float foam = smoothstep(0.68, 0.98, wave) * edge * (0.25 + vDepth * 0.75);

  vec3 color = mix(uRiverColor * (0.82 + vDepth * 0.16), uFoamColor, foam * 0.38);
  color += wave * 0.018;
  outColor = vec4(color, 0.78 + foam * 0.16);
}
`;
