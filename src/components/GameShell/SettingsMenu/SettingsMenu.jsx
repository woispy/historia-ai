import { useState } from "react";
import "./SettingsMenu.css";
import SettingsPanel from "./SettingsPanel";
import SaveRecordsPanel from "./SaveRecordsPanel";
import { DEFAULT_SETTINGS } from "./SettingsConfig";

function SettingsMenu({
  open = false,
  settings = DEFAULT_SETTINGS,
  onOpenChange,
  onSettingsChange,
  onSaveGame,
  onLoadGame,
  onDeleteSave,
  onMainMenu,
  onExitGame,
}) {
  const [view, setView] = useState("menu");

  function handleChange(key, value) {
    onSettingsChange?.((current) => ({ ...current, [key]: value }));
  }

  function toggleMenu() {
    if (open) {
      setView("menu");
      onOpenChange?.(false);
      return;
    }

    setView("menu");
    onOpenChange?.(true);
  }

  function closeMenu() {
    setView("menu");
    onOpenChange?.(false);
  }

  function handleSave() {
    onSaveGame?.();
    closeMenu();
  }

  function handleLoad() {
    const loaded = onLoadGame?.();
    if (loaded) closeMenu();
  }

  return (
    <div className="settings-menu-container">
      <button
        type="button"
        className={`menu-button${open ? " active" : ""}`}
        onClick={toggleMenu}
        aria-label="Oyun menüsü"
        aria-expanded={open}
      >
        ⚙
      </button>

      {open && view === "menu" && (
        <div className="game-menu-panel" role="menu" aria-label="Oyun menüsü">
          <button type="button" role="menuitem" onClick={handleSave}>Oyunu Kaydet</button>
          <button type="button" role="menuitem" onClick={handleLoad}>Kaydı Yükle</button>
          <button type="button" role="menuitem" onClick={() => setView("records")}>Kayıtlar</button>

          <div className="game-menu-separator" />

          <button type="button" role="menuitem" onClick={() => setView("settings")}>Ayarlar</button>
          <button type="button" role="menuitem" disabled>Oyun Günlüğü</button>
          <button type="button" role="menuitem" disabled>Ansiklopedi</button>

          <div className="game-menu-separator" />

          <button type="button" role="menuitem" onClick={onMainMenu}>Ana Menü</button>
          <button type="button" role="menuitem" onClick={onExitGame}>Oyundan Çık</button>
        </div>
      )}

      {open && view === "settings" && (
        <SettingsPanel
          settings={settings}
          onChange={handleChange}
          onBack={() => setView("menu")}
        />
      )}

      {open && view === "records" && (
        <SaveRecordsPanel
          onBack={() => setView("menu")}
          onDelete={onDeleteSave}
        />
      )}
    </div>
  );
}

export default SettingsMenu;
