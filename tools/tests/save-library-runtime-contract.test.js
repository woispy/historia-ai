import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};

const { createGame } = await import("../../src/bootstrap/GameBootstrap.js");
const {
  saveGameToSlot,
  listSaveSlots,
  loadGameFromSlot,
  deleteGameSlot,
} = await import("../../src/save/index.js");
const {
  getCurrentGame,
  setCurrentGame,
  clearCurrentGame,
} = await import("../../src/game/currentGame.js");

function makeSession(characterName, countryId) {
  return createGame({
    scenarioId: "1300",
    player: { countryId, character: { name: characterName } },
  });
}

clearCurrentGame();
const slot1 = makeSession("Slot One", "ottomans");
const slot2 = makeSession("Slot Two", "byzantines");

saveGameToSlot(slot1, "1");
saveGameToSlot(slot2, "2");

const listed = listSaveSlots();
assert.ok(listed.some((record) => record.slotId === "1"));
assert.ok(listed.some((record) => record.slotId === "2"));

const loaded2 = loadGameFromSlot("2");
assert.equal(loaded2.player.character.name, "Slot Two");
assert.equal(loaded2.player.countryId, "byzantines");

setCurrentGame(loaded2);
assert.equal(getCurrentGame().id, loaded2.id);
assert.equal(getCurrentGame().player.countryId, "byzantines");

const loaded1 = loadGameFromSlot("1");
setCurrentGame(loaded1);
assert.equal(getCurrentGame().id, loaded1.id);
assert.equal(getCurrentGame().player.countryId, "ottomans");
assert.equal(getCurrentGame().player.character.name, "Slot One");

saveGameToSlot(makeSession("Slot One Overwritten", "ottomans"), "1");
const slot2AfterOverwrite = loadGameFromSlot("2");
assert.equal(slot2AfterOverwrite.player.character.name, "Slot Two");
assert.equal(slot2AfterOverwrite.player.countryId, "byzantines");

const slot1AfterOverwrite = loadGameFromSlot("1");
assert.equal(slot1AfterOverwrite.player.character.name, "Slot One Overwritten");

setCurrentGame(slot2AfterOverwrite);
deleteGameSlot("1");
assert.equal(getCurrentGame().player.character.name, "Slot Two");
assert.equal(loadGameFromSlot("1"), null);
assert.equal(loadGameFromSlot("2").player.character.name, "Slot Two");

clearCurrentGame();
console.log("save-library-runtime-contract.test.js: all assertions passed");
