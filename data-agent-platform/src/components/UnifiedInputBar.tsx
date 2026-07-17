"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
}

export default function UnifiedInputBar({
  value,
  onChange,
  onSend,
  placeholder = "输入消息...",
  disabled = false,
  sending = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => setIsExpanded(true);
  const handleBlur = () => setIsExpanded(false);

  return (
    <div className={`unifiedInputBar ${isExpanded ? "expanded" : ""}`}>
      <div className="unifiedInputArea">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || sending}
          className="unifiedInputTextarea"
          rows={1}
        />
        <button
          className="unifiedSendBtn"
          onClick={onSend}
          disabled={disabled || sending || !value.trim()}
        >
          {sending ? (
            <span className="sendLoading">⏳</span>
          ) : (
            <span className="sendArrow">↑</span>
          )}
        </button>
      </div>

      <div className="unifiedInputFooter">
        <div className="inputFooterLeft">
          <button className="inputFooterBtn">
            <span className="inputFooterIcon">☁️</span>
            <span className="inputFooterText">云端</span>
            <span className="inputFooterArrow">▼</span>
          </button>
          <div className="inputFooterDivider" />
          <button className="inputFooterBtn">
            <span className="inputFooterIcon">📂</span>
            <span className="inputFooterText">arode/DATA-Agent</span>
            <span className="inputFooterArrow">▼</span>
          </button>
          <div className="inputFooterDivider" />
          <button className="inputFooterBtn">
            <span className="inputFooterIcon">🌿</span>
            <span className="inputFooterText">master</span>
            <span className="inputFooterArrow">▼</span>
          </button>
        </div>
      </div>
    </div>
  );
}