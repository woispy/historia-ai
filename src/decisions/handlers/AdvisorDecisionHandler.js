import {
  DecisionStatus,
} from "../DecisionTypes";

export function handleAdvisorDecision(
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