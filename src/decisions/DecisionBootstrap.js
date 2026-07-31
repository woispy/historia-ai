import {
  createDecisionRepository,
} from "./DecisionRepository";

/**
 * ============================================================================
 * Decision Bootstrap
 * ============================================================================
 */

export function bootstrapDecisions() {
  return createDecisionRepository();
}