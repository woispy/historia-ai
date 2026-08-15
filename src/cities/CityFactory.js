import { createCityModel } from "./CityModel.js";

/**
 * ============================================================================
 * Historia AI
 * City Factory
 * ============================================================================
 */

export function createCity(data) {
  if (!data) {
    throw new Error("City data is required.");
  }

  if (!data.id) {
    throw new Error("City id is required.");
  }

  return createCityModel(data);
}
