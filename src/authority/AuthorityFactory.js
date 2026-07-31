import { AuthorityRegistry } from "./AuthorityRegistry";

/**
 * ============================================================================
 * Authority Factory
 * ============================================================================
 *
 * Returns a frozen authority definition.
 */

export function createAuthority(authorityId) {
  const authority = AuthorityRegistry[authorityId];

  if (!authority) {
    throw new Error(
      `Unknown authority "${authorityId}".`
    );
  }

  return Object.freeze({
    ...authority,
    permissions: [...authority.permissions],
  });
}