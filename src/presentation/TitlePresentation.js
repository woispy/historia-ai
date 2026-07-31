/**
 * ============================================================================
 * Historia AI
 * Title Presentation
 * ============================================================================
 *
 * Resolves the correct visible title for a character.
 *
 * Future:
 * - Culture
 * - Government
 * - Era
 * - Religion
 */

export function getTitleName(character) {
  if (!character) {
    return "";
  }

  switch (character.authorityId) {
    case "RULER":
      return "Bey";

    case "HEIR":
      return "Şehzade";

    case "GENERAL":
      return "Paşa";

    case "GOVERNOR":
      return "Beylerbeyi";

    case "DIPLOMAT":
      return "Elçi";

    case "SPYMASTER":
      return "Casusbaşı";

    case "RELIGIOUS_LEADER":
      return "Şeyh";

    default:
      return "";
  }
}