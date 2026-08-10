/**
 * ============================================================================
 * Historia AI
 * Reserved ID Checker
 * ============================================================================
 *
 * Filters invalid provider IDs.
 */

const RESERVED_VALUES =
  new Set([
    "-99",
    "99",
    "null",
    "undefined",
    "",
  ]);

export function isReservedId(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return true;
  }

  return RESERVED_VALUES.has(
    value
      .toString()
      .trim()
      .toLowerCase()
  );
}