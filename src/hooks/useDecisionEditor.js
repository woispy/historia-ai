import { useState } from "react";

import {
  GameEngine,
} from "../engine/index.js";

import {
  updateCurrentGame,
} from "../game/currentGame";

export function useDecisionEditor(setGameSession) {
  const [editingAction, setEditingAction] = useState(null);
  const [decisionText, setDecisionText] = useState("");

  function submitAction() {
    const text = decisionText.trim();

    if (!text) {
      return;
    }

    setGameSession((previousSession) => {
      const nextSession = editingAction
        ? GameEngine.updateAction(
            previousSession,
            editingAction.id,
            { text }
          )
        : GameEngine.queueAction(previousSession, text);

      updateCurrentGame(nextSession);
      return nextSession;
    });

    setEditingAction(null);
    setDecisionText("");
  }

  function startEditing(action) {
    setEditingAction(action);
    setDecisionText(action.text);
  }

  function cancelEditing() {
    setEditingAction(null);
    setDecisionText("");
  }

  function deleteAction(actionId) {
    setGameSession((previousSession) => {
      const nextSession = GameEngine.removeAction(
        previousSession,
        actionId
      );

      updateCurrentGame(nextSession);
      return nextSession;
    });

    if (editingAction?.id === actionId) {
      setEditingAction(null);
      setDecisionText("");
    }
  }

  return {
    editingAction,
    decisionText,
    setDecisionText,
    submitAction,
    startEditing,
    cancelEditing,
    deleteAction,
  };
}
