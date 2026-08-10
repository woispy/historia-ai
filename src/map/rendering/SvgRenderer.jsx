/**
 * ============================================================================
 * Historia AI
 * SVG Renderer
 * ============================================================================
 *
 * One SVG root owns the map. The world is repeated horizontally so the camera
 * can cross the antimeridian without changing the underlying geometry.
 */

function SvgRenderer({ children, camera = {} }) {
  const zoom = Math.max(1, Number(camera.zoom ?? 1));
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const centerX = Number(camera.x ?? 0);
  const centerY = Number(camera.y ?? 0);
  const viewX = centerX - viewWidth / 2;
  const viewY = -centerY - viewHeight / 2;

  // Render only the copies that can intersect the viewport, with one safety
  // copy on either side. This avoids the fixed three-copy assumption at wide
  // zoom levels while keeping the DOM bounded at normal zoom.
  const firstCopy = Math.floor((viewX - 360) / 360);
  const lastCopy = Math.ceil((viewX + viewWidth + 360) / 360);
  const copies = [];

  for (let copy = firstCopy; copy <= lastCopy; copy += 1) {
    copies.push(copy);
  }

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
      <g transform="scale(1,-1)">
        {copies.map((copy) => (
          <g key={copy} transform={`translate(${copy * 360} 0)`}>
            {children}
          </g>
        ))}
      </g>
    </svg>
  );
}

export default SvgRenderer;
