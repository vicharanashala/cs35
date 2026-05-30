// ── User Titles (reputation-gated) ───────────────────────────

export function getUserTitle(reputation = 0) {
  if (reputation < 50) return { title: "Novice", color: "#6B7280", bg: "#F3F4F6" };
  if (reputation < 200) return { title: "Helper", color: "#3B82F6", bg: "#EFF6FF" };
  if (reputation < 500) return { title: "Expert", color: "#059669", bg: "#ECFDF5" };
  if (reputation < 1000) return { title: "Mentor", color: "#7C3AED", bg: "#F5F3FF" };
  return { title: "Sage", color: "#D97706", bg: "#FFFBEB" };
}

// ── Privilege thresholds ──────────────────────────────────────

export const PRIVILEGES = {
  ask:              0,
  answer:           0,
  upvote:           0,
  bookmark:         0,
  follow:           0,
  downvote:        50,   // needs Helper title
  verifiedAnswer:  50,   // needs Helper title
  convertToFaq:   200,   // needs Expert title
  closeQuestion:  200,
  manageCategories: 500, // needs Mentor
  manageUsers:     500,
};

export function hasPrivilege(reputation, action) {
  return (reputation ?? 0) >= (PRIVILEGES[action] ?? 0);
}

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
    id: "helper",
    label: "Helper",
    description: "Reached 50 reputation points",
    icon: "🌟",
    check: (stats) => stats.reputation >= 50,
  },
  {
    id: "expert",
    label: "Expert",
    description: "Reached 200 reputation points",
    icon: "🏆",
    check: (stats) => stats.reputation >= 200,
  },
  {
    id: "mentor",
    label: "Mentor",
    description: "Reached 500 reputation points",
    icon: "🎓",
    check: (stats) => stats.reputation >= 500,
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