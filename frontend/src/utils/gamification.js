export function getUserTitle(reputation = 0) {
  if (reputation < 50) return { title: "Novice", color: "#6B7280", bg: "#F3F4F6" };
  if (reputation < 200) return { title: "Helper", color: "#3B82F6", bg: "#EFF6FF" };
  return { title: "Expert", color: "#059669", bg: "#ECFDF5" };
}
