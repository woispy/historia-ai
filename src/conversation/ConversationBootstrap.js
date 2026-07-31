import {
  createConversationRepository,
} from "./ConversationRepository";

/**
 * ============================================================================
 * Conversation Bootstrap
 * ============================================================================
 */

export function bootstrapConversation() {
  return createConversationRepository();
}