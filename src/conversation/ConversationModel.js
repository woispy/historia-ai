/**
 * ============================================================================
 * Historia AI
 * Conversation Model
 * ============================================================================
 *
 * Represents a single conversation message.
 */

export function createConversationModel({
  id,

  role,

  message,

  createdAt,

  turn,

  context = null,
}) {
  return Object.freeze({
    id,

    role,

    message,

    createdAt,

    turn,

    context,
  });
}