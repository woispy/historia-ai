import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainMenu from "./pages/MainMenu";
import NewGame from "./pages/NewGame";
import ScenarioSelect from "./pages/ScenarioSelect";
import Settings from "./pages/Settings";
import Game from "./pages/Game";
import CountrySelect from "./pages/CountrySelect";
import CharacterCreate from "./pages/CharacterCreate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new-game" element={<NewGame />} />
        <Route path="/scenario" element={<ScenarioSelect />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/game" element={<Game />} />
        <Route path="/country" element={<CountrySelect />} />
        <Route path="/character" element={<CharacterCreate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;