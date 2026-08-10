import "./TopBar.css";

import { formatDate } from "../../../systems/Time";
import SettingsMenu from "../SettingsMenu/SettingsMenu";

function formatNumber(value) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function TopBar({ currentDate, simulation = {} }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <span className="logo-icon">👑</span>
          <span className="logo-text">HISTORIA AI</span>
        </div>
      </div>

      <div className="topbar-center">
        <button className="date-button">
          📅 {formatDate(currentDate)} ▼
        </button>

        <div className="resource"><span>💰</span><div><strong>{formatNumber(simulation.treasury)}</strong><small>Altın</small></div></div>
        <div className="resource"><span>⭐</span><div><strong>{formatNumber(simulation.prestige)}</strong><small>Prestij</small></div></div>
        <div className="resource"><span>😊</span><div><strong>{formatNumber(simulation.stability)}</strong><small>İstikrar</small></div></div>
        <div className="resource"><span>👥</span><div><strong>{formatNumber(simulation.population)}</strong><small>Nüfus</small></div></div>
        <div className="resource"><span>⚔</span><div><strong>{formatNumber(simulation.militaryPower)}</strong><small>Askerî Güç</small></div></div>
        <div className="resource"><span>📈</span><div><strong>{formatNumber(simulation.income)}</strong><small>Dönem Geliri</small></div></div>
        <div className="resource"><span>📚</span><div><strong>{formatNumber(simulation.technology)}</strong><small>Teknoloji</small></div></div>
      </div>

      <div className="topbar-right">
        <SettingsMenu />
      </div>
    </header>
  );
}

export default TopBar;
