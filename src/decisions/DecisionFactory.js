import { createDecisionModel } from "./DecisionModel";

import {
  DecisionTypes,
  DecisionStatus,
} from "./DecisionTypes";

/**
 * ============================================================================
 * Decision Factory
 * ============================================================================
 */

export function createDecision(data) {
  if (!data) {
    throw new Error(
      "Decision data is required."
    );
  }

  if (!data.text) {
    throw new Error(
      "Decision text is required."
    );
  }

  return createDecisionModel({
    id:
      data.id ??
      crypto.randomUUID(),

    type:
      data.type ??
      DecisionTypes.MANUAL,

    status:
      data.status ??
      DecisionStatus.DRAFT,

    createdAt:
      data.createdAt ??
      Date.now(),

    updatedAt:
      data.updatedAt ??
      Date.now(),

    turn:
      data.turn ?? 0,

    metadata:
      data.metadata ?? {},

    ...data,
  });
}