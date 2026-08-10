/**
 * ============================================================================
 * Historia AI
 * SVG Renderer
 * ============================================================================
 *
 * Root SVG used by the Rendering Engine.
 * Camera movement is expressed through the SVG viewBox so geometry remains
 * vector-sharp at every zoom level and across the antimeridian.
 */

function SvgRenderer({ children, camera = {} }) {
  const zoom = Math.max(1, Number(camera.zoom ?? 1));
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const centerX = Number(camera.x ?? 0);
  const centerY = Number(camera.y ?? 0);
  const viewX = centerX - viewWidth / 2;
  const viewY = -centerY - viewHeight / 2;
  const copyCenter = Math.floor(centerX / 360);
  const copies = [copyCenter - 1, copyCenter, copyCenter + 1];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
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
