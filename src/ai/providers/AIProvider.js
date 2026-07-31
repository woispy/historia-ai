/**
 * ============================================================================
 * Historia AI
 * AI Provider
 * ============================================================================
 *
 * Single entry point for every AI request.
 *
 * OpenAI, Local LLM or any future provider
 * will be implemented here.
 */

export async function requestAI() {
  throw new Error(
    "AI Provider is not configured."
  );
}