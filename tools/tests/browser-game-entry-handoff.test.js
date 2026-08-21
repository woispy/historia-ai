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
  "CharacterCreate must use deterministic document navigation after staging the handoff.",
);

assert.doesNotMatch(
  characterCreate,
  /navigate\("\/game"[\s\S]*sessionId:\s*session\.id,/,
  "CharacterCreate must not depend on SPA navigation for the final game entry.",
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
  "browser-game-entry-handoff.test.js: deterministic document entry contract passed",
);
