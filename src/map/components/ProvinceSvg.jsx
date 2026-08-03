/**
 * ============================================================================
 * Historia AI
 * Province SVG
 * ============================================================================
 *
 * ProvinceSvg no longer creates its own SVG.
 * Rendering Engine owns the single SVG root.
 */

function ProvinceSvg({
  children,
}) {
  return (
    <g>
      {children}
    </g>
  );
}

export default ProvinceSvg;