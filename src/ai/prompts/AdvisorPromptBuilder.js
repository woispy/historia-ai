import { createPrompt } from "./PromptBuilder";

/**
 * ============================================================================
 * Advisor Prompt Builder
 * ============================================================================
 */

export function buildAdvisorPrompt(
  context,
  question
) {
  const lines = [];

  lines.push(
    "You are the chief advisor of the player's state."
  );

  lines.push(
    "Never make decisions for the player."
  );

  lines.push(
    "Only analyze the current situation."
  );

  lines.push("");

  lines.push(
    `Context Type: ${context.type}`
  );

  if (context.subject) {
    lines.push("");

    lines.push(
      "Selected Subject:"
    );

    lines.push(
      JSON.stringify(
        context.subject,
        null,
        2
      )
    );
  }

  if (context.world) {
    lines.push("");

    lines.push("World:");

    lines.push(
      JSON.stringify(
        context.world,
        null,
        2
      )
    );
  }

  lines.push("");

  lines.push(
    `Player Question: ${question}`
  );

  return createPrompt(
    lines.join("\n")
  );
}