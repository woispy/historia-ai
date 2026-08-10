import { useState } from "react";

import LeftOverlay from "./LeftOverlay/LeftOverlay";
import RightOverlay from "./RightOverlay/RightOverlay";
import OverlayButtons from "./OverlayButtons/OverlayButtons";
import OverlayHandles from "./OverlayHandles/OverlayHandles";

function OverlayManager({
  timeline = [],
  pendingActions = [],
  editingAction,
  decisionText,
  onDecisionTextChange,
  onSubmitAction,
  onUpdateAction,
  onRemoveAction,
  onCancelEditing,
  advisorOpen = false,
  onAdvisorOpenChange,
  settingsOpen = false,
  settings = {},
}) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("actions");

  const openActions = () => {
    if (settingsOpen) return;
    setActiveTab("actions");
    setLeftOpen(true);
  };

  const openDiplomacy = () => {
    if (settingsOpen) return;
    setActiveTab("diplomacy");
    setLeftOpen(true);
  };

  const openAdvisor = () => {
    if (settingsOpen) return;
    onAdvisorOpenChange?.(true);
  };

  return (
    <>
      <LeftOverlay
        isOpen={leftOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        timeline={timeline}
        pendingActions={pendingActions}
        editingAction={editingAction}
        decisionText={decisionText}
        onDecisionTextChange={onDecisionTextChange}
        onSubmitAction={onSubmitAction}
        onUpdateAction={onUpdateAction}
        onRemoveAction={onRemoveAction}
        onCancelEditing={onCancelEditing}
      />

      <RightOverlay isOpen={advisorOpen} />

      <OverlayButtons
        leftOpen={leftOpen}
        rightOpen={advisorOpen}
        onOpenActions={openActions}
        onOpenDiplomacy={openDiplomacy}
        onOpenAdvisor={openAdvisor}
      />

      <OverlayHandles
        leftOpen={leftOpen}
        rightOpen={advisorOpen}
        onCloseLeft={() => setLeftOpen(false)}
        onCloseRight={() => onAdvisorOpenChange?.(false)}
      />
    </>
  );
}

export default OverlayManager;
