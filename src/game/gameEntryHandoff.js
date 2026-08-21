const STORAGE_KEY = "historia-ai:game-entry-handoff";

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function setGameEntryHandoff(session) {
  if (!session) return false;

  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function consumeGameEntryHandoff() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    storage.removeItem(STORAGE_KEY);

    const session = JSON.parse(raw);
    if (!session || typeof session !== "object" || !session.id) {
      return null;
    }

    return session;
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Best-effort cleanup only.
    }

    return null;
  }
}

export { STORAGE_KEY };
