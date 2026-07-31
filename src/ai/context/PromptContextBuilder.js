import { buildContext } from "../../context";

/**
 * ============================================================================
 * Prompt Context Builder
 * ============================================================================
 *
 * Converts the game world into
 * an AI-ready context.
 */

export function buildPromptContext(
  world
) {
  return buildContext(world);
}