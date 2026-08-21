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
  "CharacterCreate must retain the newly-created session.",
);

assert.match(
  characterCreate,
  /state:\s*\{[\s\S]*handoff:\s*[\"']new-game[\"'][\s\S]*session,/,
  "CharacterCreate must pass the new session through router state.",
);

assert.match(
  gamePage,
  /function ensureCurrentGame\(handoffSession\)/,
  "Game must accept the route handoff session.",
);

assert.match(
  gamePage,
  /if \(handoffSession\) \{[\s\S]*setCurrentGame\(handoffSession\);[\s\S]*return handoffSession;/,
  "Game must promote the handoff session to the authoritative current game.",
);

assert.match(
  gamePage,
  /ensureCurrentGame\(location\.state\?\.session\)/,
  "Game must consume the router session state.",
);

console.log(
  "game-entry-handoff.test.js: new-game session handoff contract passed",
);
