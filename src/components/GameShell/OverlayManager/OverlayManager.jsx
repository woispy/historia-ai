import { useEffect, useState } from "react";

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
  closeAdvisorKey = 0,
  settingsOpen = false,
  settings = {},
}) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(Boolean(settings.advisorAutoOpen));
  const [activeTab, setActiveTab] = useState("actions");

  useEffect(() => {
    if (closeAdvisorKey > 0) setRightOpen(false);
  }, [closeAdvisorKey]);

  useEffect(() => {
    if (settings.advisorAutoOpen) setRightOpen(true);
  }, [settings.advisorAutoOpen]);

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
    setRightOpen(true);
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

      <RightOverlay isOpen={rightOpen} />

      <OverlayButtons
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onOpenActions={openActions}
        onOpenDiplomacy={openDiplomacy}
        onOpenAdvisor={openAdvisor}
      />

      <OverlayHandles
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onCloseLeft={() => setLeftOpen(false)}
        onCloseRight={() => setRightOpen(false)}
      />
    </>
  );
}

export default OverlayManager;
