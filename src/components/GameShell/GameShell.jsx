import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../layouts/Layout/Layout";
import TopBar from "./TopBar/TopBar";
import TimeControls from "./TopBar/TimeControls";
import MapView from "./MapView/MapView";
import OverlayManager from "./OverlayManager/OverlayManager";
import NotificationToast from "../NotificationToast/NotificationToast";
import { getCurrentGame, updateCurrentGame, setCurrentGame, clearCurrentGame } from "../../game/currentGame";
import { getCurrentDate, getTimeline, getPendingActions } from "../../state/index.js";
import { GameEngine } from "../../engine/index.js";
import { saveGameToSlot, loadGame, deleteGame } from "../../save/index.js";
import { useDecisionEditor } from "../../hooks/useDecisionEditor";
import { readSettings, STORAGE_KEY } from "./SettingsMenu/SettingsConfig";

function monthIndex(date) { return Number(date?.year ?? 0) * 12 + Number(date?.month ?? 0); }
function shouldAutoSave(previousSession, nextSession, autosave) {
  if (autosave === "off") return false;
  const previousDate = getCurrentDate(previousSession);
  const nextDate = getCurrentDate(nextSession);
  const elapsedMonths = monthIndex(nextDate) - monthIndex(previousDate);
  if (autosave === "6m") return elapsedMonths >= 6;
  if (autosave === "1y") return Number(nextDate?.year) > Number(previousDate?.year);
  return false;
}

function GameShell() {
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState(() => getCurrentGame());
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [settings, setSettings] = useState(readSettings);
  const { editingAction, decisionText, setDecisionText, submitAction, startEditing, cancelEditing, deleteAction } = useDecisionEditor(setGameSession);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.mapStyle = settings.mapStyle;
    document.documentElement.dataset.mapShadows = String(settings.mapShadows);
    document.documentElement.dataset.effects = String(settings.effects);
    document.documentElement.dataset.tips = String(settings.tips);
    document.body.style.zoom = `${Number(settings.uiScale) / 100}`;
    return () => { document.body.style.zoom = "1"; };
  }, [settings]);

  function advanceBy(unit, amount) {
    if (busy) return;
    setBusy(true);
    setGameSession((previousSession) => {
      const nextSession = GameEngine.advance(previousSession, unit, amount);
      updateCurrentGame(nextSession);
      if (shouldAutoSave(previousSession, nextSession, settings.autosave)) saveGameToSlot(nextSession, "autosave");
      return nextSession;
    });
    setBusy(false);
  }

  function toggleSettings(nextOpen) {
    const open = Boolean(nextOpen);
    setSettingsOpen(open);
    if (open) { setAdvisorOpen(false); setTimeMenuOpen(false); }
  }

  function handleManualSave() { saveGameToSlot(gameSession, "1"); }
  function handleLoadGame(session = null) {
    try {
      const loaded = session ?? loadGame();
      if (!loaded) return false;
      setGameSession(loaded); setCurrentGame(loaded); setSelectedProvinceId(null); setAdvisorOpen(false); setTimeMenuOpen(false);
      return true;
    } catch { return false; }
  }
  function handleDeleteSave() { deleteGame(); }
  function handleProvinceClick(provinceId) { setSelectedProvinceId((currentId) => currentId === provinceId ? null : provinceId); }
  function leaveToMainMenu() { clearCurrentGame(); setSelectedProvinceId(null); setSettingsOpen(false); navigate("/"); }

  const simulation = gameSession.state?.simulation ?? {};
  return (
    <Layout title="">
      <TopBar currentDate={getCurrentDate(gameSession)} simulation={simulation} timeMenuOpen={timeMenuOpen} onToggleTimeMenu={() => { if (!settingsOpen) setTimeMenuOpen((open) => !open); }} timeControls={<TimeControls busy={busy} onAdvance={advanceBy} />} settingsOpen={settingsOpen} onToggleSettings={toggleSettings} settings={settings} onSettingsChange={setSettings} onSaveGame={handleManualSave} onLoadGame={handleLoadGame} onDeleteSave={handleDeleteSave} onMainMenu={leaveToMainMenu} onExitGame={leaveToMainMenu} />
      {settings.notifications && <NotificationToast />}
      <MapView gameSession={gameSession} settings={settings} selectedProvinceId={selectedProvinceId} onProvinceClick={handleProvinceClick} onProvinceClose={() => setSelectedProvinceId(null)} />
      <OverlayManager timeline={getTimeline(gameSession)} pendingActions={getPendingActions(gameSession)} editingAction={editingAction} decisionText={decisionText} onDecisionTextChange={setDecisionText} onSubmitAction={submitAction} onUpdateAction={startEditing} onRemoveAction={deleteAction} onCancelEditing={cancelEditing} advisorOpen={advisorOpen} onAdvisorOpenChange={setAdvisorOpen} world={gameSession} settingsOpen={settingsOpen} />
    </Layout>
  );
}

export default GameShell;
