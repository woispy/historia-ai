import { createConversationModel } from "./ConversationModel";

/**
 * ============================================================================
 * Conversation Factory
 * ============================================================================
 */

export function createConversation(data) {
  if (!data) {
    throw new Error(
      "Conversation data is required."
    );
  }

  if (!data.role) {
    throw new Error(
      "Conversation role is required."
    );
  }

  if (!data.message) {
    throw new Error(
      "Conversation message is required."
    );
  }

  return createConversationModel({
    id:
      data.id ??
      crypto.randomUUID(),

    createdAt:
      data.createdAt ??
      Date.now(),

    turn:
      data.turn ?? 0,

    context:
      data.context ?? null,

    ...data,
  });
}