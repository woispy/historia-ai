import { createPrompt } from "./PromptBuilder";

/**
 * ============================================================================
 * Simulation Prompt Builder
 * ============================================================================
 */

export function buildSimulationPrompt(
  context,
  actions
) {
  const lines = [];

  lines.push(
    "You are responsible for simulating the game world."
  );

  lines.push("");

  lines.push(
    JSON.stringify(context, null, 2)
  );

  lines.push("");

  lines.push("Actions:");

  lines.push(
    JSON.stringify(actions, null, 2)
  );

  return createPrompt(
    lines.join("\n")
  );
}