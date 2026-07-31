/**
 * ============================================================================
 * Historia AI
 * Knowledge Model
 * ============================================================================
 *
 * Represents one piece of information owned by one character.
 */

export function createKnowledgeModel({

  id,

  ownerCharacterId,

  subjectId,

  subjectType,

  confidence,

  source,

  discoveredDate,

  expiresDate = null,

  lastVerifiedDate = null,

}) {

  return Object.freeze({

    id,

    ownerCharacterId,

    subjectId,

    subjectType,

    confidence,

    source,

    discoveredDate,

    expiresDate,

    lastVerifiedDate,

  });

}