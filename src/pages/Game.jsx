import { useState } from "react";

import Layout from "../components/Layout";
import TopBar from "../components/TopBar/TopBar";
import MapView from "../components/MapView/MapView";
import LeftOverlay from "../components/LeftOverlay/LeftOverlay";
import RightOverlay from "../components/RightOverlay";

function Game() {
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

      {/* Sol Panel Açma Butonları */}
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

      {/* Sağ Panel Açma Butonu */}
      <button
        className={`right-toggle ${rightOpen ? "hidden-toggle" : ""}`}
        onClick={() => setRightOpen(true)}
      >
        🧙 Danışman
      </button>

      {/* Sol Panel Kapatma Butonu */}
      {leftOpen && (
        <button
          className="overlay-handle left"
          onClick={() => setLeftOpen(false)}
          aria-label="Sol paneli kapat"
        >
          ◀
        </button>
      )}

      {/* Sağ Panel Kapatma Butonu */}
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

export default Game;