/**
 * ============================================================================
 * Historia AI
 * Map Province
 * ============================================================================
 *
 * Visual representation of a province on the world map.
 *
 * This component contains no game logic.
 */

function MapProvince({
  id,

  selected = false,

  onClick,

  children,
}) {
  return (
    <div
      className={`province ${selected ? "selected" : ""}`}
      onClick={() => onClick?.(id)}
    >
      {children}

      <div className="province-box" />
    </div>
  );
}

export default MapProvince;