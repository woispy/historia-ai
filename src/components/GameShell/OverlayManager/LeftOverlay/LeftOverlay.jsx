import "./LeftOverlay.css";

function LeftOverlay({ isOpen, activeTab, onTabChange }) {
  return (
    <aside className={`left-overlay ${isOpen ? "open" : ""}`}>

      <div className="overlay-tabs">

        <button
          className={activeTab === "actions" ? "active" : ""}
          onClick={() => onTabChange("actions")}
        >
          📜 Eylemler
        </button>

        <button
          className={activeTab === "diplomacy" ? "active" : ""}
          onClick={() => onTabChange("diplomacy")}
        >
          🤝 Diplomasi
        </button>

      </div>

      {activeTab === "actions" && (
        <>

          <div className="overlay-content">

            <h3>Son Gelişmeler</h3>

            <ul>

              <li>Macaristan sınırında hareketlilik.</li>

              <li>Bursa'da ticaret büyüyor.</li>

              <li>Halkın memnuniyeti arttı.</li>

            </ul>

          </div>

          <div className="decision-box">

            <h3>Alınacak Kararlar</h3>

            <textarea
              placeholder="Kararlarınızı doğal dille yazın..."
            />

            <button>Kararları Uygula</button>

          </div>

        </>
      )}

      {activeTab === "diplomacy" && (
        <div className="overlay-content">

          <h3>Diplomasi</h3>

          <p>Yakında devletlerle yazışmalar burada yapılacak.</p>

        </div>
      )}

    </aside>
  );
}

export default LeftOverlay;