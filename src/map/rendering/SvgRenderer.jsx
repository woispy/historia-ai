/**
 * ============================================================================
 * Historia AI
 * SVG Renderer
 * ============================================================================
 *
 * Root SVG used by the Rendering Engine.
 *
 * Uses world coordinates (Natural Earth / EPSG:4326).
 */

function SvgRenderer({
  children,
}) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="-180 -90 360 180"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform="scale(1,-1)">
        {children}
      </g>
    </svg>
  );
}

export default SvgRenderer;