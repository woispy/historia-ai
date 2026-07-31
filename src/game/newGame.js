let newGame = {
  scenarioId: null,
  countryId: null,
  character: null,
  settings: {},
};

/**
 * Returns the current new game configuration.
 */
export function getNewGame() {
  console.log("[newGame] get", newGame);

  return {
    ...newGame,
  };
}

/**
 * Updates one or more new game properties.
 */
export function updateNewGame(values) {
  console.log("[newGame] before", newGame);
  console.log("[newGame] update", values);

  newGame = {
    ...newGame,
    ...values,
  };

  console.log("[newGame] after", newGame);
}

/**
 * Clears the new game configuration.
 */
export function resetNewGame() {
  console.log("[newGame] reset");

  newGame = {
    scenarioId: null,
    countryId: null,
    character: null,
    settings: {},
  };
}