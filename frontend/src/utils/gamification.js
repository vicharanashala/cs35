// ── Achievement definitions ───────────────────────────────────

export const ACHIEVEMENTS = [
  {
    id: "first_question",
    label: "First Question",
    description: "You asked your first question",
    icon: "❓",
    check: (stats) => stats.questionCount >= 1,
  },
  {
    id: "first_answer",
    label: "First Answer",
    description: "You answered a question",
    icon: "💬",
    check: (stats) => stats.answerCount >= 1,
  },
  {
    id: "first_verified",
    label: "Verified Answer",
    description: "Your answer was verified by an admin",
    icon: "✅",
    check: (stats) => stats.verifiedCount >= 1,
  },
  {
    id: "active_contributor",
    label: "Active Contributor",
    description: "Asked 5 questions",
    icon: "🔥",
    check: (stats) => stats.questionCount >= 5,
  },
  {
    id: "bookworm",
    label: "Bookworm",
    description: "Bookmarked 5 questions",
    icon: "🔖",
    check: (_stats, meta) => (meta?.bookmarkCount ?? 0) >= 5,
  },
];

export function checkNewAchievements(prevStats, nextStats, meta = {}) {
  return ACHIEVEMENTS.filter((a) => {
    const wasEarned = a.check(prevStats, meta);
    const isEarned = a.check(nextStats, meta);
    return !wasEarned && isEarned;
  });
}

// ── Activity heatmap color scale ─────────────────────────────

export function heatmapColor(contributions) {
  if (!contributions || contributions === 0) return "#E2E8DE";
  if (contributions === 1) return "#bbf7d0";
  if (contributions === 2) return "#6ee7b7";
  if (contributions === 3) return "#34d399";
  if (contributions <= 5) return "#059669";
  return "#047857";
}