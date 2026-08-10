import "./SettingsMenu.css";
import SettingsPanel from "./SettingsPanel";
import { DEFAULT_SETTINGS } from "./SettingsConfig";

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
        />
      )}
    </div>
  );
}

export default SettingsMenu;
