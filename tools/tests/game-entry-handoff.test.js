import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const characterCreate = readFileSync(
  new URL("../../src/pages/CharacterCreate.jsx", import.meta.url),
  "utf8",
);

const gamePage = readFileSync(
  new URL("../../src/pages/Game.jsx", import.meta.url),
  "utf8",
);

assert.match(
  characterCreate,
  /async function acceptCharacter\(\)/,
  "CharacterCreate must treat game startup as an asynchronous handoff.",
);

assert.match(
  characterCreate,
  /const session = await initializeGame\(\);/,
  "CharacterCreate must await the new game session before reading its id.",
);

assert.doesNotMatch(
  characterCreate,
  /const session = initializeGame\(\);/,
  "CharacterCreate must not treat the async initializer as a synchronous session.",
);

assert.match(
  characterCreate,
  /sessionId:\s*session\.id,/,
  "CharacterCreate must pass only the session id through router state.",
);

assert.doesNotMatch(
  characterCreate,
  /session:\s*session,/,
  "CharacterCreate must not put the complete GameSession into router state.",
);

assert.match(
  gamePage,
  /function ensureCurrentGame\(\)/,
  "Game must resolve the active session from runtime ownership or save fallback.",
);

assert.match(
  gamePage,
  /if \(hasCurrentGame\(\)\) \{[\s\S]*return getCurrentGame\(\);/,
  "Game must prefer the authoritative current-game runtime.",
);

assert.match(
  gamePage,
  /if \(hasGameSave\(\)\) \{[\s\S]*const session = loadGame\(\);[\s\S]*setCurrentGame\(session\);/,
  "Game must retain the persisted-save fallback.",
);

assert.match(
  gamePage,
  /<Navigate[\s\S]*to="\/new-game"[\s\S]*reason:\s*"missing-game-session"/,
  "Game must redirect instead of rendering an empty page when no session exists.",
);

console.log(
  "game-entry-handoff.test.js: awaited new-game session handoff contract passed",
);
