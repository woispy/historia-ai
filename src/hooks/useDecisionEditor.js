import { useState } from "react";

import {
  queueAction,
  updateAction,
  removeAction,
} from "../systems/Action";

import { updateCurrentState } from "../game/currentGame";

export function useDecisionEditor(setGameState) {
  const [editingAction, setEditingAction] = useState(null);
  const [decisionText, setDecisionText] = useState("");

  function submitAction() {
    const text = decisionText.trim();

    if (!text) {
      return;
    }

    setGameState((previousState) => {
      let nextState;

      if (editingAction) {
        nextState = updateAction(previousState, editingAction.id, {
          text,
        });
      } else {
        nextState = queueAction(previousState, text);
      }

      updateCurrentState(nextState);

      return nextState;
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
    setGameState((previousState) => {
      const nextState = removeAction(previousState, actionId);

      updateCurrentState(nextState);

      return nextState;
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