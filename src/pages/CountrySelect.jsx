import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../layouts/Layout/Layout";
import { updateNewGame } from "../game/newGame";

function CountrySelect() {
  const navigate = useNavigate();

  const [selectedCountry, setSelectedCountry] = useState(null);

  function selectCountry(countryId) {
    setSelectedCountry(countryId);

    updateNewGame({
      countryId,
    });
  }

  function continueToCharacter() {
    if (!selectedCountry) {
      return;
    }

    navigate("/character");
  }

  return (
    <Layout title="Ülke Seç">
      <h3>Şimdilik örnek ülkeler</h3>

      <div className="menu">
        <button
          onClick={() => selectCountry("ottoman")}
        >
          🏛 Osmanlı Beyliği
        </button>

        <button
          onClick={() => selectCountry("byzantium")}
        >
          🦅 Bizans İmparatorluğu
        </button>

        <button
          onClick={() => selectCountry("england")}
        >
          👑 İngiltere Krallığı
        </button>

        <button
          onClick={() => selectCountry("france")}
        >
          ⚜ Fransa Krallığı
        </button>
      </div>

      <br />

      <button
        onClick={continueToCharacter}
        disabled={!selectedCountry}
      >
        Devam →
      </button>

      <br />
      <br />

      <button onClick={() => navigate("/scenario")}>
        ← Senaryolar
      </button>
    </Layout>
  );
}

export default CountrySelect;