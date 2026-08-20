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

export async function requestAI({ prompt, signal } = {}) {
  const response = await fetch(
    import.meta.env.VITE_AI_API_URL || "/api/ai",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "AI request failed.");
  }

  return payload.text;
}