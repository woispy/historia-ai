import { useState } from "react";
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

function GameShell() {
  const [gameSession, setGameSession] = useState(() => getCurrentGame());
  const [busy, setBusy] = useState(false);
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);

  const {
    editingAction,
    decisionText,
    setDecisionText,
    submitAction,
    startEditing,
    cancelEditing,
    deleteAction,
  } = useDecisionEditor(setGameSession);

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

  const simulation = gameSession.runtime?.simulation ?? {};

  return (
    <Layout title="">
      <TopBar
        currentDate={getCurrentDate(gameSession)}
        simulation={simulation}
        timeMenuOpen={timeMenuOpen}
        onToggleTimeMenu={() => setTimeMenuOpen((open) => !open)}
        timeControls={<TimeControls busy={busy} onAdvance={advanceBy} />}
      />
      <NotificationToast />
      <MapView gameSession={gameSession} />
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
      />
    </Layout>
  );
}

export default GameShell;
