const STORAGE_KEY = "historia-ai:new-game";

const EMPTY_NEW_GAME = Object.freeze({
  scenarioId: null,
  countryId: null,
  character: null,
  settings: {},
});

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function cloneNewGame(value) {
  return {
    scenarioId: value?.scenarioId ?? null,
    countryId: value?.countryId ?? null,
    character: value?.character ?? null,
    settings: {
      ...(value?.settings ?? {}),
    },
  };
}

function readPersistedNewGame() {
  const storage = getStorage();
  if (!storage) return cloneNewGame(EMPTY_NEW_GAME);

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return cloneNewGame(EMPTY_NEW_GAME);

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return cloneNewGame(EMPTY_NEW_GAME);
    }

    return cloneNewGame(parsed);
  } catch {
    return cloneNewGame(EMPTY_NEW_GAME);
  }
}

function persistNewGame(value) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Session persistence is best-effort. The in-memory state remains valid.
  }
}

let newGame = readPersistedNewGame();

export function getNewGame() {
  return cloneNewGame(newGame);
}

export function updateNewGame(values = {}) {
  newGame = cloneNewGame({
    ...newGame,
    ...values,
  });

  persistNewGame(newGame);
}

export function resetNewGame() {
  newGame = cloneNewGame(EMPTY_NEW_GAME);

  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Session persistence is best-effort.
  }
}

export { STORAGE_KEY };
