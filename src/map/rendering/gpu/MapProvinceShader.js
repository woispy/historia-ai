export const MAP_PROVINCE_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_screenUv;

void main() {
  v_screenUv = a_position;
  gl_Position = vec4(a_position * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const MAP_PROVINCE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_screenUv;
out vec4 outColor;

uniform sampler2D u_provinces;
uniform sampler2D u_landMask;
uniform vec4 u_viewBox;
uniform vec2 u_viewport;
uniform vec3 u_waterColor;

void main() {
  float viewAspect = u_viewBox.z / u_viewBox.w;
  float viewportAspect = u_viewport.x / u_viewport.y;
  float scale = min(u_viewport.x / u_viewBox.z, u_viewport.y / u_viewBox.w);
  vec2 renderedSize = u_viewBox.zw * scale;
  vec2 offset = (u_viewport - renderedSize) * 0.5;
  vec2 pixel = v_screenUv * u_viewport;

  if (pixel.x < offset.x || pixel.x > offset.x + renderedSize.x ||
      pixel.y < offset.y || pixel.y > offset.y + renderedSize.y) {
    outColor = vec4(u_waterColor, 1.0);
    return;
  }

  vec2 local = (pixel - offset) / scale;
  float longitude = u_viewBox.x + local.x;
  float svgLatitude = u_viewBox.y + local.y;
  float latitude = -svgLatitude;

  float wrappedLongitude = mod(longitude + 180.0, 360.0);
  if (wrappedLongitude < 0.0) wrappedLongitude += 360.0;

  vec2 uv = vec2(wrappedLongitude / 360.0, (90.0 - latitude) / 180.0);
  float land = texture(u_landMask, uv).r;
  vec4 province = texture(u_provinces, uv);

  float alpha = province.a * smoothstep(0.08, 0.92, land);
  vec3 color = mix(u_waterColor, province.rgb, alpha);
  outColor = vec4(color, 1.0);
}
`;

export const MAP_PROVINCE_SHADER_CONFIG = Object.freeze({
  version: "webgl2",
  textureUnits: Object.freeze({ provinces: 0, landMask: 1 }),
  waterColor: Object.freeze([0.063, 0.173, 0.208]),
});
