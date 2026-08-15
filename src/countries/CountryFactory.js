import { createCountryModel } from "./CountryModel.js";

/**
 * ============================================================================
 * Historia AI
 * Country Factory
 * ============================================================================
 */

export function createCountry(data) {
  if (!data) {
    throw new Error(
      "Country data is required."
    );
  }

  if (!data.id) {
    throw new Error(
      "Country id is required."
    );
  }

  return createCountryModel(data);
}
