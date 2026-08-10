import "./SettingsMenu.css";
import SettingsPanel from "./SettingsPanel";

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

function SettingsMenu({ open = false, settings = DEFAULT_SETTINGS, onOpenChange, onSettingsChange }) {
  function handleChange(key, value) {
    onSettingsChange?.((current) => ({ ...current, [key]: value }));
  }

  function toggleMenu() {
    onOpenChange?.(!open);
  }

  return (
    <div className="settings-menu-container">
      <button
        type="button"
        className={`menu-button${open ? " active" : ""}`}
        onClick={toggleMenu}
        aria-label="Ayarlar"
        aria-expanded={open}
      >
        ⚙
      </button>

      {open && (
        <SettingsPanel
          settings={settings}
          onChange={handleChange}
          onClose={() => onOpenChange?.(false)}
        />
      )}
    </div>
  );
}

export default SettingsMenu;
