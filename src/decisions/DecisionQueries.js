import {
  DecisionStatus,
} from "./DecisionTypes";

/**
 * ============================================================================
 * Decision Queries
 * ============================================================================
 */

export function getDecision(
  repository,
  id
) {
  return repository.byId[id] ?? null;
}

export function getDecisions(
  repository
) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

export function getDraftDecisions(
  repository
) {
  return getDecisions(
    repository
  ).filter(
    (decision) =>
      decision.status ===
      DecisionStatus.DRAFT
  );
}

export function getProcessedDecisions(
  repository
) {
  return getDecisions(
    repository
  ).filter(
    (decision) =>
      decision.status ===
      DecisionStatus.PROCESSED
  );
}