/**
 * ============================================================================
 * Historia AI
 * SVG Renderer
 * ============================================================================
 *
 * One SVG root owns the map. The world is repeated horizontally so the camera
 * can cross the antimeridian continuously without changing the geometry data.
 */

function SvgRenderer({ children, camera = {} }) {
  const zoom = Math.max(1, Number(camera.zoom ?? 1));
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const centerX = Number(camera.x ?? 0);
  const centerY = Number(camera.y ?? 0);
  const viewX = centerX - viewWidth / 2;
  const viewY = -centerY - viewHeight / 2;

  // minZoom is 1, so the viewport never shows more than one full world width.
  // Three copies are therefore sufficient: previous, current and next world.
  // Keeping the copy count fixed is important for map FPS at low zoom levels.
  const copyCenter = Math.floor(centerX / 360);
  const copies = [copyCenter - 1, copyCenter, copyCenter + 1];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="auto"
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
