/**
 * ============================================================================
 * Historia AI
 * Decision Types
 * ============================================================================
 */

export const DecisionTypes = Object.freeze({
  MANUAL: "manual",

  ADVISOR_DRAFT: "advisor-draft",

  SYSTEM: "system",
});

export const DecisionStatus = Object.freeze({
  DRAFT: "draft",

  PROCESSING: "processing",

  PROCESSED: "processed",

  CANCELLED: "cancelled",

  FAILED: "failed",
});