import {
  createGame,
} from "./GameBootstrap.js";

import {
  getNewGame,
} from "../game/newGame.js";

import {
  setCurrentGame,
} from "../game/currentGame.js";

import {
  saveGame,
} from "../save/index.js";

/**
 * ============================================================================
 * Historia AI
 * Game Initializer
 * ============================================================================
 *
 * Creates and initializes a brand new Game Session.
 *
 * Pipeline
 * --------
 * NewGame
 *      ↓
 * Validation
 *      ↓
 * Game Bootstrap
 *      ↓
 * Current Game
 *      ↓
 * Initial Save
 */

export function initializeGame() {
  const newGame =
    getNewGame();

  console.group(
    "[GameInitializer]"
  );

  console.log(
    "New Game:",
    newGame
  );

  if (!newGame) {
    console.groupEnd();

    throw new Error(
      "New Game configuration is missing."
    );
  }

  if (!newGame.scenarioId) {
    console.groupEnd();

    throw new Error(
      "Scenario id is missing from New Game configuration."
    );
  }

  if (!newGame.countryId) {
    console.groupEnd();

    throw new Error(
      "Country id is missing from New Game configuration."
    );
  }

  if (!newGame.character) {
    console.groupEnd();

    throw new Error(
      "Character is missing from New Game configuration."
    );
  }

  const session =
    createGame({
      scenarioId:
        newGame.scenarioId,

      player: {
        countryId:
          newGame.countryId,

        character:
          newGame.character,
      },

      settings:
        newGame.settings ??
        {},
    });

  console.log(
    "Game Session:",
    session
  );

  setCurrentGame(
    session
  );

  saveGame(
    session
  );

  console.groupEnd();

  return session;
}