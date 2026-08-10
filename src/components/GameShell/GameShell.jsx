import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../layouts/Layout/Layout";
import TopBar from "./TopBar/TopBar";
import TimeControls from "./TopBar/TimeControls";
import MapView from "./MapView/MapView";
import OverlayManager from "./OverlayManager/OverlayManager";
import NotificationToast from "../NotificationToast/NotificationToast";
import { getCurrentGame, updateCurrentGame, setCurrentGame, clearCurrentGame } from "../../game/currentGame";
import { getCurrentDate, getTimeline, getPendingActions } from "../../state";
import { advanceWeek, advanceMonth, advanceSixMonths, advanceYear } from "../../systems/Action";
import {
  saveGame,
  loadGame,
  deleteGame,
} from "../../save";
import { useDecisionEditor } from "../../hooks/useDecisionEditor";
import { readSettings, STORAGE_KEY } from "./SettingsMenu/SettingsConfig";

function monthIndex(date) {
  return Number(date?.year ?? 0) * 12 + Number(date?.month ?? 0);
}

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
  const [busy, setBusy] = useState(false);
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [settings, setSettings] = useState(readSettings);

  const {
    editingAction,
    decisionText,
    setDecisionText,
    submitAction,
    startEditing,
    cancelEditing,
    deleteAction,
  } = useDecisionEditor(setGameSession);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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

  function advance(simulator) {
    if (busy) return;
    setBusy(true);

    setGameSession((previousSession) => {
      const nextSession = simulator(previousSession);
      updateCurrentGame(nextSession);

      if (shouldAutoSave(previousSession, nextSession, settings.autosave)) {
        saveGame(nextSession);
      }

      return nextSession;
    });

    setBusy(false);
  }

  function advanceBy(unit, amount) {
    if (unit === "week" && amount === 1) return advance(advanceWeek);
    if (unit === "month" && amount === 1) return advance(advanceMonth);
    if (unit === "month" && amount === 6) return advance(advanceSixMonths);
    if (unit === "year" && amount === 1) return advance(advanceYear);
  }

  function toggleSettings(nextOpen) {
    const open = Boolean(nextOpen);
    setSettingsOpen(open);
    if (open) {
      setAdvisorOpen(false);
      setTimeMenuOpen(false);
    }
  }

  function handleManualSave() {
    saveGame(gameSession);
  }

  function handleLoadGame() {
    try {
      const loaded = loadGame();
      if (!loaded) return false;

      setGameSession(loaded);
      setCurrentGame(loaded);
      setAdvisorOpen(false);
      setTimeMenuOpen(false);
      return true;
    } catch {
      return false;
    }
  }

  function handleDeleteSave() {
    deleteGame();
  }

  function leaveToMainMenu() {
    clearCurrentGame();
    setSettingsOpen(false);
    navigate("/");
  }

  const simulation = gameSession.runtime?.simulation ?? {};

  return (
    <Layout title="">
      <TopBar
        currentDate={getCurrentDate(gameSession)}
        simulation={simulation}
        timeMenuOpen={timeMenuOpen}
        onToggleTimeMenu={() => {
          if (!settingsOpen) setTimeMenuOpen((open) => !open);
        }}
        timeControls={<TimeControls busy={busy} onAdvance={advanceBy} />}
        settingsOpen={settingsOpen}
        onToggleSettings={toggleSettings}
        settings={settings}
        onSettingsChange={setSettings}
        onSaveGame={handleManualSave}
        onLoadGame={handleLoadGame}
        onDeleteSave={handleDeleteSave}
        onMainMenu={leaveToMainMenu}
        onExitGame={leaveToMainMenu}
      />
      {settings.notifications && <NotificationToast />}
      <MapView gameSession={gameSession} settings={settings} />
      <OverlayManager
        timeline={getTimeline(gameSession)}
        pendingActions={getPendingActions(gameSession)}
        editingAction={editingAction}
        decisionText={decisionText}
        onDecisionTextChange={setDecisionText}
        onSubmitAction={submitAction}
        onUpdateAction={startEditing}
        onRemoveAction={deleteAction}
        onCancelEditing={cancelEditing}
        advisorOpen={advisorOpen}
        onAdvisorOpenChange={setAdvisorOpen}
        settingsOpen={settingsOpen}
      />
    </Layout>
  );
}

export default GameShell;
