import "./App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const MainMenu = lazy(() => import("./pages/MainMenu"));
const NewGame = lazy(() => import("./pages/NewGame"));
const ScenarioSelect = lazy(() => import("./pages/ScenarioSelect"));
const Settings = lazy(() => import("./pages/Settings"));
const Game = lazy(() => import("./pages/Game"));
const CountrySelect = lazy(() => import("./pages/CountrySelect"));
const CharacterCreate = lazy(() => import("./pages/CharacterCreate"));

function RouteFallback() {
  return <div className="route-loading" role="status" aria-live="polite">Loading…</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/new-game" element={<NewGame />} />
          <Route path="/scenario" element={<ScenarioSelect />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/game" element={<Game />} />
          <Route path="/country" element={<CountrySelect />} />
          <Route path="/character" element={<CharacterCreate />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
