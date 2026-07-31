/**
 * ============================================================================
 * Province Presentation
 * ============================================================================
 *
 * Converts Province data into player-facing text.
 */

export function getProvinceDisplayName(
  province
) {
  if (!province) {
    return "";
  }

  return province.name;
}

export function getProvincePopulationText(
  province
) {
  return new Intl.NumberFormat("tr-TR").format(
    province.population
  );
}

export function getProvinceDevelopmentText(
  province
) {
  return province.development.toString();
}