import "./TopBar.css";

function TopBar() {
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

          📅 1 Ocak 1444 ▼

        </button>

        <div className="resource">
          <span>💰</span>
          <div>
            <strong>2500</strong>
            <small>Altın</small>
          </div>
        </div>

        <div className="resource">
          <span>⭐</span>
          <div>
            <strong>40</strong>
            <small>Prestij</small>
          </div>
        </div>

        <div className="resource">
          <span>😊</span>
          <div>
            <strong>82</strong>
            <small>İstikrar</small>
          </div>
        </div>

        <div className="resource">
          <span>👥</span>
          <div>
            <strong>11.2M</strong>
            <small>Nüfus</small>
          </div>
        </div>

        <div className="resource">
          <span>⚔</span>
          <div>
            <strong>78.000</strong>
            <small>Ordu</small>
          </div>
        </div>

        <div className="resource">
          <span>🏛</span>
          <div>
            <strong>3 / 6</strong>
            <small>Yasalar</small>
          </div>
        </div>

        <div className="resource">
          <span>📚</span>
          <div>
            <strong>65</strong>
            <small>Teknoloji</small>
          </div>
        </div>

      </div>

      <div className="topbar-right">

        <button className="menu-button">
          ⚙
        </button>

      </div>

    </header>
  );
}

export default TopBar;