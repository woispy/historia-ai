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
  /navigate\("\/game",\s*\{[\s\S]*sessionId:\s*session\.id,/,
  "CharacterCreate must use the SPA router for normal game entry.",
);

assert.doesNotMatch(
  characterCreate,
  /window\.location\.replace\("\/game"\)/,
  "CharacterCreate must not force a full document reload for normal game entry.",
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
  /handoffSession/,
  "Game must restore the transient browser handoff.",
);

assert.match(
  gamePage,
  /hasGameSave\(\)/,
  "Game must retain the persisted-save fallback.",
);

assert.match(
  gamePage,
  /loadGame\(\)/,
  "Game must load the persisted session when needed.",
);

assert.match(
  gamePage,
  /setCurrentGame\(session\)/,
  "Game must restore a persisted session into the authoritative runtime store.",
);

console.log(
  "browser-game-entry-handoff.test.js: SPA and reload-safe browser entry contract passed",
);
