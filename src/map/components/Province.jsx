function Province({
  id,
  name,
  selected,
  onSelect,
  children,
}) {
  return (
    <div
      className={`province ${selected ? "selected" : ""}`}
      onClick={() => onSelect(id)}
    >
      {children}

      <div className="province-box" />

    </div>
  );
}

export default Province;