/**
 * ============================================================================
 * Historia AI
 * Date Presentation
 * ============================================================================
 *
 * Formats dates for the player.
 */

export function formatGameDate(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}