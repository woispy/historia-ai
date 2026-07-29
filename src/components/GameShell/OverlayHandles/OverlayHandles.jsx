function OverlayHandles({
  leftOpen,
  rightOpen,
  onCloseLeft,
  onCloseRight,
}) {
  return (
    <>
      {leftOpen && (
        <button
          className="overlay-handle left"
          onClick={onCloseLeft}
          aria-label="Sol paneli kapat"
        >
          ◀
        </button>
      )}

      {rightOpen && (
        <button
          className="overlay-handle right"
          onClick={onCloseRight}
          aria-label="Sağ paneli kapat"
        >
          ▶
        </button>
      )}
    </>
  );
}

export default OverlayHandles;