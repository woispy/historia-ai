import Layout from "../../layouts/Layout/Layout";

import TopBar from "../TopBar/TopBar";
import MapView from "../MapView/MapView";
import OverlayManager from "../OverlayManager/OverlayManager";

function GameShell() {
  return (
    <Layout title="">
      <TopBar />
      <MapView />
      <OverlayManager />
    </Layout>
  );
}

export default GameShell;