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

const handoff = readFileSync(
  new URL("../../src/game/gameEntryHandoff.js", import.meta.url),
  "utf8",
);

assert.match(
  characterCreate,
  /setGameEntryHandoff\(session\)/,
  "CharacterCreate must stage the runtime session for a browser-safe handoff.",
);

assert.match(
  characterCreate,
  /window\.location\.replace\("\/game"\)/,
  "CharacterCreate must use deterministic document navigation when the handoff is available.",
);

assert.match(
  handoff,
  /sessionStorage/,
  "The browser handoff must use sessionStorage.",
);

assert.match(
  handoff,
  /JSON\.stringify\(session\)/,
  "The browser handoff must serialize the runtime session.",
);

assert.match(
  gamePage,
  /consumeGameEntryHandoff\(\)/,
  "Game must consume the transient browser handoff.",
);

assert.match(
  gamePage,
  /const handoffSession = consumeGameEntryHandoff\(\);[\s\S]*setCurrentGame\(handoffSession\);/,
  "Game must restore the transient handoff before persistent save fallback.",
);

assert.match(
  gamePage,
  /if \(hasGameSave\(\) \{[\s\S]*const session = loadGame\(\);[\s\S]*setCurrentGame\(session\);/,
  "Game must retain the persisted-save fallback.",
);

console.log(
  "browser-game-entry-handoff.test.js: deterministic browser entry contract passed",
);
