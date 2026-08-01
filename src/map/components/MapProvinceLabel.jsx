/**
 * ============================================================================
 * Historia AI
 * Map Province Label
 * ============================================================================
 *
 * Displays the province name on the map.
 */

function MapProvinceLabel({
  name,
}) {
  return (
    <div className="province-label">
      {name}
    </div>
  );
}

export default MapProvinceLabel;