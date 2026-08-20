import "./RightOverlay.css";
import { useState } from "react";

import { askAdvisor } from "../../../../ai";
import { PromptInput } from "../../../UI/PromptInput";

function RightOverlay({ isOpen, world }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const text = message.trim();

    if (!text || loading) {
      return;
    }

    setMessage("");
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);

    try {
      const answer = await askAdvisor({ world, question: text });
      setMessages((current) => [...current, { role: "advisor", text: answer }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "advisor", text: `Danışman yanıt veremedi: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
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
        {messages.map((entry, index) => (
          <div className={`advisor-message ${entry.role}`} key={`${entry.role}-${index}`}>
            {entry.text}
          </div>
        ))}
        {loading && <div className="advisor-message">Danışman düşünüyor...</div>}
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