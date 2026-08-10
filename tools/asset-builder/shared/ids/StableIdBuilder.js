import {
  normalizeIdCandidate,
} from "./IdCandidateNormalizer.js";

import {
  isReservedId,
} from "./ReservedIdChecker.js";

/**
 * ============================================================================
 * Historia AI
 * Stable ID Builder
 * ============================================================================
 *
 * Builds deterministic asset IDs.
 */

export function buildStableId({
  prefix,
  candidates,
  fallback,
}) {
  for (const value of candidates) {
    if (
      value === null ||
      value === undefined
    ) {
      continue;
    }

    if (
      isReservedId(value)
    ) {
      continue;
    }

    const normalized =
      normalizeIdCandidate(
        value
      );

    if (normalized) {
      return `${prefix}_${normalized}`;
    }
  }

  return `${prefix}_${fallback()}`;
}