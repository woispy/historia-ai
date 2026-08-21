import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../layouts/Layout/Layout";
import SettingsPanel from "../components/GameShell/SettingsMenu/SettingsPanel";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  readSettings,
} from "../components/GameShell/SettingsMenu/SettingsConfig";

function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => readSettings());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Settings are best-effort when browser storage is unavailable.
    }

    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.mapStyle = settings.mapStyle;
    document.documentElement.dataset.mapShadows = String(settings.mapShadows);
    document.documentElement.dataset.effects = String(settings.effects);
    document.documentElement.dataset.tips = String(settings.tips);
    document.body.style.zoom = `${Number(settings.uiScale) / 100}`;

    return () => {
      document.body.style.zoom = "1";
    };
  }, [settings]);

  function handleChange(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetToDefaults() {
    setSettings({ ...DEFAULT_SETTINGS });
  }

  return (
    <Layout title="Ayarlar">
      <SettingsPanel
        settings={settings}
        onChange={handleChange}
        onBack={() => navigate("/")}
      />

      <button type="button" onClick={resetToDefaults}>
        Varsayılanlara Dön
      </button>
    </Layout>
  );
}

export default Settings;
