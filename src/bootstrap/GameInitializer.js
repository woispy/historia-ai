import {
  createGame,
} from "./GameBootstrap.js";

import {
  getNewGame,
  resetNewGame,
} from "../game/newGame.js";

import {
  setCurrentGame,
} from "../game/currentGame.js";

import {
  saveGame,
} from "../save/index.js";

/**
 * Creates and initializes a brand new Game Session.
 *
 * New-game selection is treated as a transactional input: it must contain
 * the selected scenario, country and character before the runtime is created.
 */
export function initializeGame() {
  const newGame = getNewGame();

  console.group("[GameInitializer]");
  console.log("New Game:", newGame);

  if (!newGame) {
    console.groupEnd();
    throw new Error("New Game configuration is missing.");
  }

  if (!newGame.scenarioId) {
    console.groupEnd();
    throw new Error("Scenario id is missing from New Game configuration.");
  }

  if (!newGame.countryId) {
    console.groupEnd();
    throw new Error("Country id is missing from New Game configuration.");
  }

  if (!newGame.character) {
    console.groupEnd();
    throw new Error("Character is missing from New Game configuration.");
  }

  try {
    const session = createGame({
      scenarioId: newGame.scenarioId,
      player: {
        countryId: newGame.countryId,
        character: newGame.character,
      },
      settings: newGame.settings ?? {},
    });

    console.log("Game Session:", session);

    setCurrentGame(session);
    saveGame(session);

    // The pending setup has been consumed successfully. Keep the new-game
    // buffer clean so a later game cannot inherit stale scenario data.
    resetNewGame();

    return session;
  } finally {
    console.groupEnd();
  }
}
