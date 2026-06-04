import { useState, useEffect } from "react";

const CHAR_SPEED = 45;
const HOLD_DURATION = 2800;

export default function FloatingBubbles({ questions = [] }) {
  const [idx, setIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const total = questions.length;
  const current = questions[idx] || {};
  const text = current.question || "";

  useEffect(() => {
    if (total === 0) return;

    setCharCount(0);
    setVisible(true);

    const typeInterval = setInterval(() => {
      setCharCount((c) => {
        if (c >= text.length) {
          clearInterval(typeInterval);
          return text.length;
        }
        return c + 1;
      });
    }, CHAR_SPEED);

    const holdTimer = setTimeout(() => {
      setVisible(false);
    }, text.length * CHAR_SPEED + HOLD_DURATION);

    const nextTimer = setTimeout(() => {
      setIdx((i) => (i + 1) % total);
    }, text.length * CHAR_SPEED + HOLD_DURATION + 400);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(holdTimer);
      clearTimeout(nextTimer);
    };
  }, [idx, total]);

  if (total === 0) return null;

  const positions = [
    { top: "6%", left: "-2%" },
    { top: "44%", left: "56%" },
    { top: "70%", left: "0%" },
  ];
  const pos = positions[idx % 3];

  const typedText = text.slice(0, charCount);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ borderRadius: "1rem" }}
    >
      <div
        className="absolute"
        style={{
          ...pos,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          background: "rgba(255,255,255,0.92)",
          borderRadius: "18px",
          padding: "10px 16px",
          fontSize: "12px",
          fontWeight: 500,
          lineHeight: 1.5,
          maxWidth: "175px",
          color: "#286321",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {typedText}
        {charCount < text.length && (
          <span style={{ display: "inline-block", width: "1.5px", height: "12px", background: "#286321", marginLeft: "1px", verticalAlign: "middle", animation: "blink-caret 0.8s step-end infinite" }} />
        )}
      </div>
    </div>
  );
}