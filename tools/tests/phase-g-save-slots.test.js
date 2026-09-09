import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};

const { createGame } = await import("../../src/bootstrap/GameBootstrap.js");
const { saveGameToSlot, loadGameFromSlot, listSaveSlots, deleteGameSlot } = await import("../../src/save/index.js");

const firstSession = createGame({
  scenarioId: "1300",
  player: { countryId: "ottomans", character: { name: "Slot One" } },
});
const secondSession = createGame({
  scenarioId: "1300",
  player: { countryId: "ottomans", character: { name: "Slot Two" } },
});

saveGameToSlot(firstSession, "1");
saveGameToSlot(secondSession, "2");

const records = listSaveSlots();
assert.equal(records.length, 2);
assert.ok(records.some((record) => record.slotId === "1" && record.characterName === "Slot One"));
assert.ok(records.some((record) => record.slotId === "2" && record.characterName === "Slot Two"));

const loadedOne = loadGameFromSlot("1");
const loadedTwo = loadGameFromSlot("2");
assert.equal(loadedOne.player.character.name, "Slot One");
assert.equal(loadedTwo.player.character.name, "Slot Two");
assert.notEqual(loadedOne.id, loadedTwo.id);

saveGameToSlot(secondSession, "1");
assert.equal(loadGameFromSlot("1").player.character.name, "Slot Two");
assert.equal(listSaveSlots().length, 2);

deleteGameSlot("1");
assert.equal(loadGameFromSlot("1"), null);
assert.equal(listSaveSlots().length, 1);
assert.equal(listSaveSlots()[0].slotId, "2");

console.log("phase-g-save-slots.test.js: all assertions passed");
