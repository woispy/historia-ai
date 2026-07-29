import Layout from "../components/Layout";

import TopBar from "../components/TopBar";
import MapView from "../components/MapView";

function Game() {

  return (

    <Layout title="">

      <TopBar />

      <MapView />

      <button className="left-toggle">

        📜 Eylemler

      </button>

      <button className="left-toggle diplomacy-toggle">

        🤝 Diplomasi

      </button>

      <button className="right-toggle">

        🧙 Danışman

      </button>

    </Layout>

  );

}

export default Game;