export const PROVINCE_VERTEX_SHADER = `#version 300 es
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

export const PROVINCE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uProvinceIds;
uniform sampler2D uLandMask;
uniform sampler2D uPalette;
uniform float uPaletteSize;
uniform float uSelectedId;
uniform vec4 uSelectedColor;
uniform vec4 uWaterColor;
uniform vec4 uLandColor;
uniform float uFillOpacity;

in vec2 vUv;
out vec4 outColor;

float decodeProvinceId(vec4 encoded) {
  vec3 bytes = floor(encoded.rgb * 255.0 + 0.5);
  return bytes.r + bytes.g * 256.0 + bytes.b * 65536.0;
}

void main() {
  float land = texture(uLandMask, vUv).r;
  if (land < 0.5) {
    outColor = uWaterColor;
    return;
  }

  float provinceId = decodeProvinceId(texture(uProvinceIds, vUv));
  if (provinceId < 0.5) {
    outColor = uLandColor;
    return;
  }

  float paletteIndex = provinceId - 1.0;
  vec2 paletteUv = vec2((paletteIndex + 0.5) / uPaletteSize, 0.5);
  vec4 color = texture(uPalette, paletteUv);

  if (uSelectedId > 0.5 && abs(provinceId - uSelectedId) < 0.5) {
    color = mix(color, uSelectedColor, 0.62);
  }

  color.a *= uFillOpacity;
  outColor = color;
}
`;
