import { useState } from "react";

import Layout from "../../layouts/Layout/Layout";
import TopBar from "./TopBar/TopBar";
import MapView from "./MapView/MapView";
import OverlayManager from "./OverlayManager/OverlayManager";
import NotificationToast from "../NotificationToast/NotificationToast";

import {
  getCurrentGame,
  updateCurrentGame,
} from "../../game/currentGame";
import { saveGame } from "../../save";
import { getCurrentDate, getTimeline, getPendingActions } from "../../state";
import {
  advanceWeek,
  advanceMonth,
  advanceSixMonths,
  advanceYear,
} from "../../systems/Action";
import { useDecisionEditor } from "../../hooks/useDecisionEditor";

function GameShell() {
  const [gameSession, setGameSession] = useState(() => getCurrentGame());
  const [busy, setBusy] = useState(false);

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

  const simulation = gameSession.runtime?.simulation ?? {};
  const lastSummary = simulation.lastTurnSummary ?? "Dönem özeti yok.";

  return (
    <Layout title="">
      <TopBar
        currentDate={getCurrentDate(gameSession)}
        simulation={simulation}
      />

      <NotificationToast />

      <div
        style={{
          position: "fixed",
          top: 78,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: 8,
          borderRadius: 10,
          background: "rgba(15,15,18,.92)",
          boxShadow: "0 8px 24px rgba(0,0,0,.25)",
        }}
      >
        <button disabled={busy} onClick={() => advance(advanceWeek)}>+1 Hafta</button>
        <button disabled={busy} onClick={() => advance(advanceMonth)}>+1 Ay</button>
        <button disabled={busy} onClick={() => advance(advanceSixMonths)}>+6 Ay</button>
        <button disabled={busy} onClick={() => advance(advanceYear)}>+1 Yıl</button>
        <span style={{ marginLeft: 8, color: "#ddd", fontSize: 12 }}>{lastSummary}</span>
      </div>

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
