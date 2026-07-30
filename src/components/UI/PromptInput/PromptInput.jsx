import "./PromptInput.css";
import { useEffect, useRef } from "react";

function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "",
  submitLabel = "Gönder",
  submitIcon = "➤",
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";

    const nextHeight = Math.min(textarea.scrollHeight, 180);

    textarea.style.height = `${nextHeight}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (value.trim()) {
        onSubmit?.();
      }
    }
  }

  const isDisabled = value.trim().length === 0;

  return (
    <div className="prompt-input">
      <div className="prompt-card">
        <textarea
          ref={textareaRef}
          className="prompt-input-field"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
        />

        <div className="prompt-footer">
          <div className="prompt-left-actions">
            {/* Mikrofon ve diğer araçlar ileride buraya gelecek */}
          </div>

          <div className="prompt-right-actions">
            <button
              className="prompt-send-button"
              type="button"
              onClick={onSubmit}
              disabled={isDisabled}
              aria-label={submitLabel}
              title={submitLabel}
            >
              {submitIcon}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromptInput;