/**
 * ============================================================================
 * Province Presentation
 * ============================================================================
 *
 * Converts Province data into player-facing text.
 */

function isKnownNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

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
  if (!isKnownNumber(province?.population)) return "—";
  return new Intl.NumberFormat("tr-TR").format(
    Number(province.population),
  );
}

export function getProvinceDevelopmentText(
  province
) {
  if (!isKnownNumber(province?.development)) return "—";
  return String(Number(province.development));
}
