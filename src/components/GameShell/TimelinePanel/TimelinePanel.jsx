function TimelinePanel({ timeline = [] }) {
  const latestEntry =
    timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <div
      style={{
        position: "fixed",
        top: 130,
        right: 20,
        width: 280,
        padding: 16,
        background: "#ffffff",
        border: "1px solid #ccc",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 9999,
      }}
    >
      <h3 style={{ marginTop: 0 }}>📜 Son Kayıt</h3>

      {latestEntry ? (
        <>
          <strong>{latestEntry.key}</strong>

          <p>{latestEntry.category}</p>

          <small>Turn: {latestEntry.id}</small>
        </>
      ) : (
        <p>Henüz kayıt yok.</p>
      )}
    </div>
  );
}

export default TimelinePanel;