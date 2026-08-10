function OverlayButtons({
  leftOpen,
  rightOpen,
  onOpenActions,
  onOpenDiplomacy,
  onOpenAdvisor,
}) {
  return (
    <>
      <button
        type="button"
        className={`left-toggle ${leftOpen ? "hidden-toggle" : ""}`}
        onClick={onOpenActions}
      >
        Eylemler
      </button>

      <button
        type="button"
        className={`left-toggle diplomacy-toggle ${leftOpen ? "hidden-toggle" : ""}`}
        onClick={onOpenDiplomacy}
      >
        Diplomasi
      </button>

      <button
        type="button"
        className={`right-toggle ${rightOpen ? "hidden-toggle" : ""}`}
        onClick={onOpenAdvisor}
      >
        Danışman
      </button>
    </>
  );
}

export default OverlayButtons;
