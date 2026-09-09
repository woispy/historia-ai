import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../layouts/Layout/Layout";
import SaveRecordsPanel from "../components/GameShell/SettingsMenu/SaveRecordsPanel";
import { getCurrentGame, hasCurrentGame, setCurrentGame } from "../game/currentGame";
import { getGameSaveInfo, hasGameSave, loadGame } from "../save";

function formatSaveDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function readSaveState() {
  try {
    return { available: hasCurrentGame() || hasGameSave(), info: getGameSaveInfo() };
  } catch {
    return { available: hasCurrentGame(), info: null };
  }
}

function MainMenu() {
  const navigate = useNavigate();
  const [saveState, setSaveState] = useState(readSaveState);
  const [showRecords, setShowRecords] = useState(false);
  const [continueError, setContinueError] = useState("");

  function refreshSaveState() { setSaveState(readSaveState()); }

  function handleContinue() {
    setContinueError("");
    try {
      if (hasCurrentGame()) {
        const session = getCurrentGame();
        navigate("/game", { replace: true, state: { handoff: "main-menu-current-game", sessionId: session.id } });
        return;
      }
      if (!hasGameSave()) {
        setContinueError("Devam edilecek bir kayıt bulunamadı.");
        refreshSaveState();
        return;
      }
      const session = loadGame();
      if (!session?.id) throw new Error("Kayıt okunamadı veya kayıt bozuk.");
      setCurrentGame(session);
      navigate("/game", { replace: true, state: { handoff: "main-menu-save", sessionId: session.id } });
    } catch (error) {
      setContinueError(error instanceof Error ? error.message : "Kayıt yüklenemedi.");
      refreshSaveState();
    }
  }

  function handleRecordLoad(session) {
    setCurrentGame(session);
    setShowRecords(false);
    navigate("/game", { replace: true, state: { handoff: "main-menu-save-slot", sessionId: session.id } });
  }

  const saveDate = formatSaveDate(saveState.info?.lastPlayed);

  return (
    <Layout title="A Living Grand Strategy">
      <div className="menu">
        <button type="button" onClick={() => navigate("/scenario")}>🗡 Yeni Oyun</button>
        <button type="button" onClick={handleContinue} disabled={!saveState.available} title={saveState.available ? "Kayıtlı oyuna devam et" : "Kayıt bulunamadı"}>💾 Devam Et</button>
        <button type="button" onClick={() => setShowRecords(true)}>📚 Kayıtlar</button>
        <button type="button" onClick={() => navigate("/settings")}>⚙ Ayarlar</button>
        <button type="button" disabled>🚪 Çıkış</button>
        {saveState.available && saveDate && <p aria-live="polite">Son kayıt: {saveDate}</p>}
        {continueError && <p role="alert" style={{ color: "#d66" }}>{continueError}</p>}
      </div>

      {showRecords && (
        <SaveRecordsPanel allowSave={false} onBack={() => { setShowRecords(false); refreshSaveState(); }} onLoad={handleRecordLoad} onDelete={() => refreshSaveState()} />
      )}
    </Layout>
  );
}

export default MainMenu;
