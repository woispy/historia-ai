import {
  buildPromptContext,
} from "../context";

import {
  buildAdvisorPrompt,
} from "../prompts";

import {
  requestAI,
} from "../providers";

/**
 * ============================================================================
 * Advisor Engine
 * ============================================================================
 */

export async function askAdvisor({
  world,

  question,
}) {
  const context =
    buildPromptContext(world);

  const prompt =
    buildAdvisorPrompt(
      context,
      question
    );

  return requestAI({
    prompt,
  });
}