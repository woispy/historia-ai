import {
  DecisionTypes,
} from "./DecisionTypes";

import {
  getDraftDecisions,
} from "./DecisionQueries";

import {
  updateDecision,
} from "./DecisionRepository";

import {
  handleManualDecision,
  handleAdvisorDecision,
  handleSystemDecision,
} from "./handlers";

/**
 * ============================================================================
 * Historia AI
 * Decision Executor
 * ============================================================================
 *
 * Executes every pending decision.
 *
 * This layer does not contain game rules.
 * It only dispatches decisions to the appropriate handler.
 */

function executeDecision(
  decision
) {
  switch (decision.type) {
    case DecisionTypes.MANUAL:
      return handleManualDecision(
        decision
      );

    case DecisionTypes.ADVISOR_DRAFT:
      return handleAdvisorDecision(
        decision
      );

    case DecisionTypes.SYSTEM:
      return handleSystemDecision(
        decision
      );

    default:
      return decision;
  }
}

export function executeDecisions(
  repository
) {
  let nextRepository =
    repository;

  const decisions =
    getDraftDecisions(
      repository
    );

  for (const decision of decisions) {
    const processedDecision =
      executeDecision(
        decision
      );

    nextRepository =
      updateDecision(
        nextRepository,
        processedDecision
      );
  }

  return nextRepository;
}