export function getKnowledge(repository) {

  return repository.allIds.map(

    id => repository.byId[id]

  );

}

export function getKnowledgeByCharacter(

  repository,

  characterId

) {

  return getKnowledge(repository).filter(

    knowledge =>

      knowledge.ownerCharacterId === characterId

  );

}

export function getKnowledgeByType(

  repository,

  characterId,

  type

) {

  return getKnowledgeByCharacter(

    repository,

    characterId

  ).filter(

    knowledge =>

      knowledge.subjectType === type

  );

}

export function getReliableKnowledge(

  repository,

  characterId,

  minimumConfidence = 80

) {

  return getKnowledgeByCharacter(

    repository,

    characterId

  ).filter(

    knowledge =>

      knowledge.confidence >= minimumConfidence

  );

}

export function getRumors(

  repository,

  characterId

) {

  return getKnowledgeByCharacter(

    repository,

    characterId

  ).filter(

    knowledge =>

      knowledge.confidence < 50

  );

}