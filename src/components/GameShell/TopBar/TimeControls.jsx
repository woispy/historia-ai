import "./TimeControls.css";

function TimeControls({ busy, onAdvance }) {
  const controls = [
    ["week", 1, "+1 Hafta"],
    ["month", 1, "+1 Ay"],
    ["month", 6, "+6 Ay"],
    ["year", 1, "+1 Yıl"],
  ];

  return (
    <div className="time-controls">
      {controls.map(([unit, amount, label]) => (
        <button key={label} type="button" disabled={busy} onClick={() => onAdvance(unit, amount)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default TimeControls;
