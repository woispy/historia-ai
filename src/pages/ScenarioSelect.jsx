import { useNavigate } from "react-router-dom";

import Layout from "../layouts/Layout/Layout";

import {
  resetNewGame,
  updateNewGame,
} from "../game/newGame";

function ScenarioSelect() {
  const navigate = useNavigate();

  function selectScenario(scenarioId) {
    console.log("=== SCENARIO SELECT ===");
    console.log("Scenario selected:", scenarioId);

    // Yeni oyuna her zaman temiz başla.
    resetNewGame();

    updateNewGame({
      scenarioId,
    });

    console.log("Scenario stored:", scenarioId);
    console.log("=======================");

    navigate("/country");
  }

  return (
    <Layout title="Senaryo Seç">
      <div className="menu">
        <button onClick={() => selectScenario("1300")}>
          🛡 1300 - Osmanlı Kuruluş Dönemi
        </button>

        <button disabled>
          🔒 1453 - Yakında
        </button>

        <button disabled>
          🔒 1789 - Yakında
        </button>
      </div>

      <br />

      <button onClick={() => navigate("/")}>
        ← Ana Menü
      </button>
    </Layout>
  );
}

export default ScenarioSelect;