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
  /const session = initializeGame\(\);/,
  "CharacterCreate must initialize the new game session.",
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
  "game-entry-handoff.test.js: new-game session handoff contract passed",
);
