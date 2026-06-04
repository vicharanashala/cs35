import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { userStatsApi } from "../services/api";
import { checkNewAchievements } from "../utils/gamification";

/**
 * Hook that watches user stats changes and surfaces new achievements.
 * Call checkAchievements() after a stats-changing action (answer, verify, etc.)
 * to trigger toast notifications for newly earned achievements.
 */
export function useAchievements() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const prevStatsRef = useRef(null);

  const { data: currentStats } = useQuery({
    queryKey: ["user-stats", user?._id],
    queryFn: () => userStatsApi.stats(user._id),
    enabled: !!user?._id,
    staleTime: 1000 * 30,
  });

  // Call this after any stats-changing action to trigger toast if achievement unlocked
  const checkAchievements = useCallback(
    (extraMeta = {}) => {
      if (!currentStats || !prevStatsRef.current) {
        if (currentStats) prevStatsRef.current = currentStats;
        return;
      }
      const newlyUnlocked = checkNewAchievements(
        prevStatsRef.current,
        currentStats,
        extraMeta
      );
      if (newlyUnlocked.length > 0) {
        setToasts((prev) => [...prev, ...newlyUnlocked]);
        prevStatsRef.current = currentStats;
      }
    },
    [currentStats]
  );

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, checkAchievements, dismissToast };
}