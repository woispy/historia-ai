import "./RightOverlay.css";
import { useState } from "react";

import { PromptInput } from "../../../UI/PromptInput";

function RightOverlay({ isOpen }) {
  const [message, setMessage] = useState("");

  function handleSubmit() {
    const text = message.trim();

    if (!text) {
      return;
    }

    // Diplomasi sistemi Sprint 11'de eklenecek.

    console.log(text);

    setMessage("");
  }

  return (
    <aside className={`right-overlay ${isOpen ? "open" : ""}`}>
      <div className="advisor-header">
        <h2>🧙 Devlet Danışmanı</h2>
      </div>

      <div className="advisor-chat">
        <div className="advisor-message">
          Hoş geldiniz hükümdarım.
          <br />
          <br />
          Bugün ekonomi istikrarlı görünüyor.
        </div>
      </div>

      <PromptInput
        value={message}
        onChange={setMessage}
        onSubmit={handleSubmit}
        placeholder="Danışmana soru sorun..."
      />
    </aside>
  );
}

export default RightOverlay;