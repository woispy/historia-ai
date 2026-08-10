/**
 * ============================================================================
 * Historia AI
 * Asset Builder
 * Logger
 * ============================================================================
 *
 * Console output helper used by every
 * Asset Builder module.
 */

export function log(
  message
) {
  console.log(
    `[Asset Builder] ${message}`
  );
}

export function success(
  message
) {
  console.log(
    `✓ ${message}`
  );
}

export function warning(
  message
) {
  console.warn(
    `⚠ ${message}`
  );
}

export function error(
  message
) {
  console.error(
    `✖ ${message}`
  );
}