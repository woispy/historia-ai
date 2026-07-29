import { useState } from "react";

import LeftOverlay from "../LeftOverlay/LeftOverlay";
import RightOverlay from "../RightOverlay/RightOverlay";
import OverlayButtons from "../OverlayButtons/OverlayButtons";

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

      {leftOpen && (
        <button
          className="overlay-handle left"
          onClick={() => setLeftOpen(false)}
          aria-label="Sol paneli kapat"
        >
          ◀
        </button>
      )}

      {rightOpen && (
        <button
          className="overlay-handle right"
          onClick={() => setRightOpen(false)}
          aria-label="Sağ paneli kapat"
        >
          ▶
        </button>
      )}
    </>
  );
}

export default OverlayManager;