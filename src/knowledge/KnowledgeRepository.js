/**
 * ============================================================================
 * Knowledge Repository
 * ============================================================================
 */

export function createKnowledgeRepository() {

  return {

    byId: {},

    allIds: [],

  };

}

export function addKnowledge(repository, knowledge) {

  if (repository.byId[knowledge.id]) {
    throw new Error(
      `Knowledge "${knowledge.id}" already exists.`
    );
  }

  return {

    byId: {

      ...repository.byId,

      [knowledge.id]: knowledge,

    },

    allIds: [

      ...repository.allIds,

      knowledge.id,

    ],

  };

}

export function updateKnowledge(repository, knowledge) {

  return {

    byId: {

      ...repository.byId,

      [knowledge.id]: knowledge,

    },

    allIds: repository.allIds,

  };

}

export function removeKnowledge(repository, knowledgeId) {

  if (!repository.byId[knowledgeId]) {

    return repository;

  }

  const nextById = {

    ...repository.byId,

  };

  delete nextById[knowledgeId];

  return {

    byId: nextById,

    allIds: repository.allIds.filter(

      id => id !== knowledgeId

    ),

  };

}