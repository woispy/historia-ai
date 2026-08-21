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
  /setGameEntryHandoff\(session\);/,
  "CharacterCreate must preserve a reload-safe browser handoff.",
);

assert.match(
  characterCreate,
  /navigate\("\/game",\s*\{[\s\S]*sessionId:\s*session\.id,/,
  "CharacterCreate must enter the game through the SPA router with the session id.",
);

assert.doesNotMatch(
  characterCreate,
  /window\.location\.replace\("\/game"\)/,
  "CharacterCreate must not force a full document navigation for normal game entry.",
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
  /const handoffSession = consumeGameEntryHandoff\(\);[\s\S]*setCurrentGame\(handoffSession\);/,
  "Game must recover a session after a document reload through the browser handoff.",
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
