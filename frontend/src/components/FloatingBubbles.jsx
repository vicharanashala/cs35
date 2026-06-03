import { useState, useEffect, useRef } from "react";

const TYPE_DURATION = 1200;
const DISPLAY_DURATION = 2500;
const CYCLE_DELAY = 300;

export default function FloatingBubbles({ questions = [] }) {
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [phase, setPhase] = useState("idle");
  const timerRef = useRef(null);

  const total = questions.length;
  const current = questions[visibleIdx] || {};

  useEffect(() => {
    if (total === 0) return;

    setPhase("idle");
    timerRef.current = setTimeout(() => setPhase("pop"), 50);

    const cycleTimeout = TYPE_DURATION + DISPLAY_DURATION + 400;
    const nextIdx = (visibleIdx + 1) % total;

    const cycleTimer = setTimeout(() => {
      setVisibleIdx(nextIdx);
    }, cycleTimeout);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(cycleTimer);
    };
  }, [visibleIdx, total]);

  if (total === 0) return null;

  const positions = [
    { top: "5%", left: "-2%", textAlign: "left" },
    { top: "45%", left: "58%", textAlign: "right" },
    { top: "72%", left: "0%", textAlign: "left" },
  ];
  const pos = positions[visibleIdx % 3];

  return (
    <div
      className="hidden lg:flex items-center justify-center relative"
      style={{ width: "100%", height: "100%" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bubble-anim"
          style={{
            opacity: 0,
            ...pos,
            background: "rgba(255,255,255,0.92)",
            borderRadius: "16px",
            padding: "8px 14px",
            fontSize: "11px",
            fontWeight: 500,
            lineHeight: 1.45,
            maxWidth: "165px",
            color: "#286321",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            transition: "none",
            animationDuration: `${TYPE_DURATION + DISPLAY_DURATION + 400}ms`,
          }}
        >
          <span
            className="typewriter"
            style={{
              "--type-dur": `${TYPE_DURATION}ms`,
              display: "inline-block",
            }}
          >
            {current.question || ""}
          </span>
        </div>
      </div>
    </div>
  );
}