/**
 * ============================================================================
 * Historia AI
 * Province SVG
 * ============================================================================
 */

function ProvinceSvg({
  children,
}) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="-50 -50 300 300"
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}

export default ProvinceSvg;