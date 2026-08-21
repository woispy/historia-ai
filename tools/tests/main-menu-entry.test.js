import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainMenu = readFileSync(
  new URL("../../src/pages/MainMenu.jsx", import.meta.url),
  "utf8",
);

const settings = readFileSync(
  new URL("../../src/pages/Settings.jsx", import.meta.url),
  "utf8",
);

assert.match(
  mainMenu,
  /hasCurrentGame\(\)/,
  "Main menu must recognize an active runtime session.",
);

assert.match(
  mainMenu,
  /hasGameSave\(\)/,
  "Main menu must recognize persisted saves.",
);

assert.match(
  mainMenu,
  /const session = loadGame\(\);[\s\S]*setCurrentGame\(session\);/,
  "Continue must restore the persisted session into the runtime store.",
);

assert.match(
  mainMenu,
  /navigate\("\/game"[\s\S]*handoff:\s*"main-menu-save"/,
  "Continue must enter the game route after loading a save.",
);

assert.match(
  mainMenu,
  /disabled=\{!saveState\.available\}/,
  "Continue must be disabled when there is no active game or save.",
);

assert.match(
  settings,
  /readSettings\(\)/,
  "Main menu settings must read the shared game settings.",
);

assert.match(
  settings,
  /STORAGE_KEY/,
  "Main menu settings must use the shared settings storage key.",
);

assert.match(
  settings,
  /<SettingsPanel[\s\S]*settings=\{settings\}/,
  "Main menu settings must reuse the in-game settings panel.",
);

console.log(
  "main-menu-entry.test.js: continue and settings integration contract passed",
);
