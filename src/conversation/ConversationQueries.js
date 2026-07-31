/**
 * ============================================================================
 * Conversation Queries
 * ============================================================================
 */

export function getConversationMessages(
  repository
) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

export function getLastMessage(
  repository
) {
  if (
    repository.allIds.length === 0
  ) {
    return null;
  }

  const id =
    repository.allIds[
      repository.allIds.length - 1
    ];

  return repository.byId[id];
}

export function getMessagesByRole(
  repository,
  role
) {
  return getConversationMessages(
    repository
  ).filter(
    (message) =>
      message.role === role
  );
}