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

import {
  getCurrentDate,
  getTimeline,
  getPendingActions,
} from "../../state";

import { advanceWeek } from "../../systems/Action";

import {
  useDecisionEditor,
} from "../../hooks/useDecisionEditor";

function GameShell() {
  const [gameSession, setGameSession] =
    useState(() => getCurrentGame());

  const {
    editingAction,
    decisionText,
    setDecisionText,
    submitAction,
    startEditing,
    cancelEditing,
    deleteAction,
  } = useDecisionEditor(setGameSession);

  function handleAdvanceWeek() {
    setGameSession((previousSession) => {
      const nextSession =
        advanceWeek(previousSession);

      updateCurrentGame(nextSession);

      return nextSession;
    });
  }

  return (
    <Layout title="">
      <TopBar
        currentDate={getCurrentDate(
          gameSession
        )}
      />

      <NotificationToast />

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

      <MapView
        gameSession={gameSession}
      />

      <OverlayManager
        timeline={getTimeline(
          gameSession
        )}
        pendingActions={
          getPendingActions(
            gameSession
          )
        }
        editingAction={editingAction}
        decisionText={decisionText}
        onDecisionTextChange={
          setDecisionText
        }
        onSubmitAction={submitAction}
        onUpdateAction={startEditing}
        onRemoveAction={deleteAction}
        onCancelEditing={cancelEditing}
      />
    </Layout>
  );
}

export default GameShell;