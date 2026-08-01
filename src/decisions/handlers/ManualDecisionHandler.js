import {
  DecisionStatus,
} from "../DecisionTypes";

export function handleManualDecision(
  decision
) {
  return {
    ...decision,

    status:
      DecisionStatus.PROCESSED,

    updatedAt:
      Date.now(),
  };
}