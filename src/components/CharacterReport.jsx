function CharacterReport({ character }) {
  if (!character) return null;

  const labels = {
    leadership: "Liderlik",
    diplomacy: "Diplomasi",
    warfare: "Komuta",
    economy: "Ekonomi",
    intelligence: "Zekâ",
    intrigue: "Entrika",
    charisma: "Karizma",
  };

  return (
    <div className="character-report">
      <h2>👑 Hükümdar Raporu</h2>

      <hr />

      <h3>Kimlik Bilgileri</h3>

      <div className="profile-row">
        <strong>İsim:</strong>
        <span>{character.profile.name}</span>
      </div>

      <div className="profile-row">
        <strong>Unvan:</strong>
        <span>{character.profile.title}</span>
      </div>

      <div className="profile-row">
        <strong>Hanedan:</strong>
        <span>{character.profile.dynasty}</span>
      </div>

      <div className="profile-row">
        <strong>Yaş:</strong>
        <span>{character.profile.age}</span>
      </div>

      <div className="profile-row">
        <strong>Ülke:</strong>
        <span>{character.profile.country}</span>
      </div>

      <div className="profile-row">
        <strong>Kültür:</strong>
        <span>{character.profile.culture}</span>
      </div>

      <div className="profile-row">
        <strong>Din:</strong>
        <span>{character.profile.religion}</span>
      </div>

      <hr />

      <h3>📊 Yetenekler</h3>

      {Object.entries(character.stats).map(([key, value]) => (
        <div
          key={key}
          style={{ marginBottom: "18px" }}
        >
          <strong>{labels[key]}</strong>

          <div
            style={{
              background: "#3a382f",
              borderRadius: "8px",
              overflow: "hidden",
              marginTop: "6px",
            }}
          >
            <div
              style={{
                width: `${value}%`,
                background: "#c8a54d",
                color: "#1c1b17",
                padding: "6px 10px",
                fontWeight: "bold",
                textAlign: "right",
              }}
            >
              {value}/100
            </div>
          </div>
        </div>
      ))}

      <hr />

      <h3>🧠 Kişilik Özellikleri</h3>

      {character.personality.length > 0 ? (
        <ul>
          {character.personality.map((trait) => (
            <li key={trait}>✔ {trait}</li>
          ))}
        </ul>
      ) : (
        <p>Henüz belirgin bir kişilik özelliği oluşmadı.</p>
      )}

      <hr />

      <h3>🤖 AI Analizi</h3>

      <p>{character.analysis.summary}</p>

      <h4>✅ Güçlü Yönler</h4>

      {character.analysis.strengths.length > 0 ? (
        <ul>
          {character.analysis.strengths.map((strength) => (
            <li key={strength}>{strength}</li>
          ))}
        </ul>
      ) : (
        <p>Belirgin güçlü yön bulunamadı.</p>
      )}

      <h4>⚠️ Geliştirilebilecek Alanlar</h4>

      {character.analysis.weaknesses.length > 0 ? (
        <ul>
          {character.analysis.weaknesses.map((weakness) => (
            <li key={weakness}>{weakness}</li>
          ))}
        </ul>
      ) : (
        <p>Belirgin zayıf yön bulunamadı.</p>
      )}

      <h4>💡 Danışman Tavsiyesi</h4>

      {character.analysis.recommendations.length > 0 ? (
        <ul>
          {character.analysis.recommendations.map((recommendation) => (
            <li key={recommendation}>{recommendation}</li>
          ))}
        </ul>
      ) : (
        <p>Şu an için özel bir tavsiye bulunmuyor.</p>
      )}
    </div>
  );
}

export default CharacterReport;