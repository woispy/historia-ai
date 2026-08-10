/**
 * ============================================================================
 * Historia AI
 * ID Candidate Normalizer
 * ============================================================================
 *
 * Converts provider values into stable
 * Historia Asset ID fragments.
 */

export function normalizeIdCandidate(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    value
      .toString()
      .trim()
      .toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  return normalized
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}