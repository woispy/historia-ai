import {
  DecisionStatus,
} from "../DecisionTypes";

export function handleSystemDecision(
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