/**
 * ============================================================================
 * Historia AI
 * Country Model
 * ============================================================================
 *
 * Immutable runtime country model.
 */

export function createCountryModel(data) {
  return Object.freeze({
    ...data,
  });
}