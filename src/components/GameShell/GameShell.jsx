import { useState } from "react";

import Layout from "../../layouts/Layout/Layout";

import TopBar from "./TopBar/TopBar";
import MapView from "./MapView/MapView";
import OverlayManager from "./OverlayManager/OverlayManager";

import { createInitialGameState } from "../../state";
import { advanceWeek } from "../../actions";

function GameShell() {
  const [gameState, setGameState] = useState(() => createInitialGameState());

  function handleAdvanceWeek() {
    setGameState((previousState) => advanceWeek(previousState));
  }

  return (
    <Layout title="">
      <TopBar currentDate={gameState.time.currentDate} />

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

      <MapView />
      <OverlayManager />
    </Layout>
  );
}

export default GameShell;