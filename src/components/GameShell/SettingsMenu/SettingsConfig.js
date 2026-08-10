export const STORAGE_KEY = "historia-ai.settings";

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "dark",
  mapStyle: "detailed",
  uiScale: "100",
  effects: true,
  smoothCamera: true,
  mapShadows: true,
  notifications: true,
  advisorAutoOpen: false,
  tips: true,
  autosave: "6m",
  language: "tr",
});

export function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return { ...DEFAULT_SETTINGS, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
