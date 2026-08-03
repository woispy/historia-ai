/**
 * ============================================================================
 * Historia AI
 * SVG Renderer
 * ============================================================================
 */

function SvgRenderer({
  children,
}) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 20000 20000"
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}

export default SvgRenderer;