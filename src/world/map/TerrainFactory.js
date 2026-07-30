export function createTerrain(rawTerrain) {
  return {
    id: rawTerrain.id,

    name: rawTerrain.name,

    movementCost: rawTerrain.movementCost,

    combat: {
      attacker: rawTerrain.combat.attacker,
      defender: rawTerrain.combat.defender,
    },

    supplyModifier: rawTerrain.supplyModifier,

    developmentModifier: rawTerrain.developmentModifier,

    canBuildRoad: rawTerrain.canBuildRoad,
  };
}