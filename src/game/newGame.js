let newGame = {
  scenarioId: null,
  countryId: null,
  character: null,
  settings: {},
};

export function getNewGame() {
  console.log("[newGame] get", newGame);

  return {
    ...newGame,
  };
}

export function updateNewGame(values) {
  console.group("[newGame] update");

  console.log("Before:", newGame);
  console.log("Patch :", values);

  console.trace("Called from");

  newGame = {
    ...newGame,
    ...values,
  };

  console.log("After :", newGame);

  console.groupEnd();
}

export function resetNewGame() {
  console.group("[newGame] reset");

  console.trace("Called from");

  newGame = {
    scenarioId: null,
    countryId: null,
    character: null,
    settings: {},
  };

  console.log("After reset:", newGame);

  console.groupEnd();
}