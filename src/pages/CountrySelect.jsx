import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../layouts/Layout/Layout";
import { updateNewGame } from "../game/newGame";

const countries = [
  {
    id: "ottomans",
    icon: "🏛",
    name: "Osmanlı Beyliği",
    description: "Söğüt ve Bilecik çevresinde yükselen genç Türkmen beyliği.",
  },
  {
    id: "byzantium",
    icon: "🦅",
    name: "Bizans İmparatorluğu",
    description: "Konstantinopolis merkezli, büyük fakat baskı altındaki imparatorluk.",
  },
];

function CountrySelect() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState(null);

  function selectCountry(countryId) {
    setSelectedCountry(countryId);
    updateNewGame({ countryId });
  }

  return (
    <Layout title="Ülke Seç">
      <h3>1300 — Oynanabilir Devletler</h3>

      <div className="menu">
        {countries.map((country) => (
          <button
            key={country.id}
            className={selectedCountry === country.id ? "selected" : ""}
            onClick={() => selectCountry(country.id)}
          >
            {country.icon} {country.name}
            <small style={{ display: "block", opacity: 0.7 }}>
              {country.description}
            </small>
          </button>
        ))}
      </div>

      <br />
      <button onClick={() => navigate("/character")} disabled={!selectedCountry}>
        Devam →
      </button>
      <br />
      <br />
      <button onClick={() => navigate("/scenario")}>← Senaryolar</button>
    </Layout>
  );
}

export default CountrySelect;
