/**
 * Historia AI — SVG Renderer
 *
 * One SVG root owns the map and renders exactly one finite world copy. The
 * camera is clamped to that world, so physical geography, political fills and
 * interaction geometry always occupy the same coordinate space.
 *
 * The global land geometry is intentionally not referenced here. It is a
 * map-time resource owned by WorldPhysicalLayer, which keeps Natural Earth
 * geometry out of the renderer/bootstrap dependency graph.
 */
function SvgRenderer({ children, camera = {} }) {
  const zoom = Math.max(1, Number(camera.zoom ?? 1));
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const centerX = Number(camera.x ?? 0);
  const centerY = Number(camera.y ?? 0);
  const viewX = centerX - viewWidth / 2;
  const viewY = -centerY - viewHeight / 2;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      style={{ display: "block" }}
    >
      <defs>
        <filter id="map-label-halo" x="-30%" y="-45%" width="160%" height="190%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.15" result="blur" />
          <feFlood floodColor="#071011" floodOpacity="0.82" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="halo" />
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="scale(1,-1)">
        {children}
      </g>
    </svg>
  );
}

export default SvgRenderer;
