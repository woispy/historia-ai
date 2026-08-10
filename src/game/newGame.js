let newGame = {
  scenarioId: null,
  countryId: null,
  character: null,
  settings: {},
};

export function getNewGame() {
  return { ...newGame };
}

export function updateNewGame(values = {}) {
  newGame = {
    ...newGame,
    ...values,
  };
}

export function resetNewGame() {
  newGame = {
    scenarioId: null,
    countryId: null,
    character: null,
    settings: {},
  };
}
