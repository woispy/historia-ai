import { useState } from "react";

import Layout from "../../layouts/Layout/Layout";

import TopBar from "./TopBar/TopBar";
import MapView from "./MapView/MapView";
import OverlayManager from "./OverlayManager/OverlayManager";
import NotificationToast from "../NotificationToast/NotificationToast";

import {
  getCurrentState,
  updateCurrentState,
} from "../../game/currentGame";

import {
  getCurrentDate,
  getTimeline,
  getPendingActions,
} from "../../state";

import { advanceWeek } from "../../systems/Action";
import { useDecisionEditor } from "../../hooks/useDecisionEditor";

function GameShell() {
  const [gameState, setGameState] = useState(() =>
    getCurrentState()
  );

  const {
    editingAction,
    decisionText,
    setDecisionText,
    submitAction,
    startEditing,
    cancelEditing,
    deleteAction,
  } = useDecisionEditor(setGameState);

  function handleAdvanceWeek() {
    setGameState((previousState) => {
      const nextState = advanceWeek(previousState);

      updateCurrentState(nextState);

      return nextState;
    });
  }

  return (
    <Layout title="">
      <TopBar currentDate={getCurrentDate(gameState)} />

      <NotificationToast />

      {/* Geçici test butonu (ileride kaldırılacak) */}
      <div
        style={{
          position: "fixed",
          top: 80,
          right: 20,
          zIndex: 9999,
        }}
      >
        <button onClick={handleAdvanceWeek}>
          +1 Hafta
        </button>
      </div>

      <MapView gameState={gameState} />

      <OverlayManager
        timeline={getTimeline(gameState)}
        pendingActions={getPendingActions(gameState)}
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