import { useState } from "react";

import "./SettingsMenu.css";

import { saveCurrentGame } from "../../../game/GameCommands";

function SettingsMenu() {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMenu() {
    setMenuOpen((open) => !open);
  }

  return (
    <div className="settings-menu-container">
      <button
        className="menu-button"
        onClick={toggleMenu}
      >
        ⚙
      </button>

      {menuOpen && (
        <div className="settings-menu">
          <button onClick={saveCurrentGame}>
            💾 Oyunu Kaydet
          </button>

          <button>
            📂 Kaydı Yükle
          </button>

          <button>
            🗂 Kayıtlar
          </button>

          <hr />

          <button>
            ⚙ Ayarlar
          </button>

          <button>
            📖 Oyun Günlüğü
          </button>

          <button>
            📚 Ansiklopedi
          </button>

          <hr />

          <button>
            🏠 Ana Menü
          </button>

          <button>
            🚪 Oyundan Çık
          </button>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;