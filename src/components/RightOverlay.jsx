import "./RightOverlay.css";

function RightOverlay({ isOpen }) {
  return (
    <aside className={`right-overlay ${isOpen ? "open" : ""}`}>

      <div className="advisor-header">

        <h2>🧙 Devlet Danışmanı</h2>

      </div>

      <div className="advisor-chat">

        <div className="advisor-message">

          Hoş geldiniz hükümdarım.

          Bugün ekonomi istikrarlı görünüyor.

        </div>

      </div>

      <div className="advisor-input">

        <textarea
          placeholder="Danışmana soru sorun..."
        />

        <button>Gönder</button>

      </div>

    </aside>
  );
}

export default RightOverlay;