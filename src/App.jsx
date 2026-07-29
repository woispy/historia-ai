import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainMenu from "./pages/MainMenu";
import NewGame from "./pages/NewGame";
import Settings from "./pages/Settings";
import Game from "./pages/Game";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<MainMenu />} />

        <Route path="/new-game" element={<NewGame />} />

        <Route path="/settings" element={<Settings />} />

        <Route path="/game" element={<Game />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;