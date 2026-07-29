import { useState } from "react";

import LeftOverlay from "./LeftOverlay/LeftOverlay";
import RightOverlay from "./RightOverlay/RightOverlay";
import OverlayButtons from "./OverlayButtons/OverlayButtons";
import OverlayHandles from "./OverlayHandles/OverlayHandles";

function OverlayManager() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("actions");

  const openActions = () => {
    setActiveTab("actions");
    setLeftOpen(true);
  };

  const openDiplomacy = () => {
    setActiveTab("diplomacy");
    setLeftOpen(true);
  };

  const openAdvisor = () => {
    setRightOpen(true);
  };

  return (
    <>
      <LeftOverlay
        isOpen={leftOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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