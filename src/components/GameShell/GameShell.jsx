import { useState } from "react";

import Layout from "../../layouts/Layout/Layout";
import TopBar from "../TopBar/TopBar";
import MapView from "../MapView/MapView";
import LeftOverlay from "../LeftOverlay/LeftOverlay";
import RightOverlay from "../RightOverlay/RightOverlay";

function GameShell() {
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

  return (
    <Layout title="">
      <TopBar />

      <MapView />

      <LeftOverlay
        isOpen={leftOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <RightOverlay isOpen={rightOpen} />

      <button
        className={`left-toggle ${leftOpen ? "hidden-toggle" : ""}`}
        onClick={openActions}
      >
        📜 Eylemler
      </button>

      <button
        className={`left-toggle diplomacy-toggle ${
          leftOpen ? "hidden-toggle" : ""
        }`}
        onClick={openDiplomacy}
      >
        🤝 Diplomasi
      </button>

      <button
        className={`right-toggle ${rightOpen ? "hidden-toggle" : ""}`}
        onClick={() => setRightOpen(true)}
      >
        🧙 Danışman
      </button>

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
    </Layout>
  );
}

export default GameShell;