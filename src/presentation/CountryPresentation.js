/**
 * ============================================================================
 * Historia AI
 * Country Presentation
 * ============================================================================
 *
 * Converts internal country data into player-facing names.
 */

export function getCountryDisplayName(country) {
  if (!country) {
    return "";
  }

  return country.name;
}

export function getCountryFormalName(country) {
  if (!country) {
    return "";
  }

  return country.name;
}