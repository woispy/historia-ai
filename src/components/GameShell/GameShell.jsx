import { useEffect } from "react";

import Layout from "../../layouts/Layout/Layout";

import TopBar from "./TopBar/TopBar";
import MapView from "./MapView/MapView";
import OverlayManager from "./OverlayManager/OverlayManager";

import {
  createGameTime,
  advanceWeeks,
  advanceMonths,
  advanceYears,
  formatDate,
} from "../../systems/Time";

function GameShell() {
  useEffect(() => {
    const game = createGameTime();

    console.log("Başlangıç:", formatDate(game.currentDate));

    const afterWeek = advanceWeeks(game.currentDate, 1);
    console.log("+1 Hafta:", formatDate(afterWeek));

    const afterMonth = advanceMonths(afterWeek, 1);
    console.log("+1 Ay:", formatDate(afterMonth));

    const afterYear = advanceYears(afterMonth, 1);
    console.log("+1 Yıl:", formatDate(afterYear));
  }, []);

  return (
    <Layout title="">
      <TopBar />
      <MapView />
      <OverlayManager />
    </Layout>
  );
}

export default GameShell;