/**
 * ============================================================================
 * Conversation Repository
 * ============================================================================
 */

export function createConversationRepository() {
  return {
    allIds: [],

    byId: {},
  };
}

export function addConversation(
  repository,
  conversation
) {
  return {
    allIds: [
      ...repository.allIds,
      conversation.id,
    ],

    byId: {
      ...repository.byId,

      [conversation.id]:
        conversation,
    },
  };
}

export function clearConversation(
  repository
) {
  return createConversationRepository();
}