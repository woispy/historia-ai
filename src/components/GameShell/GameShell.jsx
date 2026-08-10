import { useEffect, useState } from "react";
import Layout from "../../layouts/Layout/Layout";
import TopBar from "./TopBar/TopBar";
import TimeControls from "./TopBar/TimeControls";
import MapView from "./MapView/MapView";
import OverlayManager from "./OverlayManager/OverlayManager";
import NotificationToast from "../NotificationToast/NotificationToast";
import { getCurrentGame, updateCurrentGame } from "../../game/currentGame";
import { getCurrentDate, getTimeline, getPendingActions } from "../../state";
import { advanceWeek, advanceMonth, advanceSixMonths, advanceYear } from "../../systems/Action";
import { saveGame } from "../../save";
import { useDecisionEditor } from "../../hooks/useDecisionEditor";
import { readSettings, STORAGE_KEY } from "./SettingsMenu/SettingsConfig";

function GameShell() {
  const [gameSession, setGameSession] = useState(() => getCurrentGame());
  const [busy, setBusy] = useState(false);
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(() => readSettings().advisorAutoOpen);
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
      saveGame(nextSession);
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
