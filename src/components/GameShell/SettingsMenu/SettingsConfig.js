export const STORAGE_KEY = "historia-ai.settings";

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "dark",
  mapStyle: "detailed",
  uiScale: "100",
  effects: true,
  smoothCamera: true,
  mapShadows: true,
  notifications: true,
  tips: true,
  autosave: "6m",
  language: "tr",
});

export function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");

    if (!saved || typeof saved !== "object") {
      return { ...DEFAULT_SETTINGS };
    }

    const settings = { ...DEFAULT_SETTINGS, ...saved };
    // Remove the retired advisorAutoOpen option from older local saves so the
    // setting cannot silently return after a UI upgrade.
    delete settings.advisorAutoOpen;
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
