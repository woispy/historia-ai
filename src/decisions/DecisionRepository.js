/**
 * ============================================================================
 * Decision Repository
 * ============================================================================
 */

export function createDecisionRepository() {
  return {
    byId: {},

    allIds: [],
  };
}

export function addDecision(
  repository,
  decision
) {
  return {
    byId: {
      ...repository.byId,

      [decision.id]: decision,
    },

    allIds: [
      ...repository.allIds,
      decision.id,
    ],
  };
}

export function updateDecision(
  repository,
  decision
) {
  return {
    ...repository,

    byId: {
      ...repository.byId,

      [decision.id]: decision,
    },
  };
}

export function removeDecision(
  repository,
  id
) {
  const byId = {
    ...repository.byId,
  };

  delete byId[id];

  return {
    byId,

    allIds:
      repository.allIds.filter(
        (decisionId) =>
          decisionId !== id
      ),
  };
}

export function clearDecisions() {
  return createDecisionRepository();
}