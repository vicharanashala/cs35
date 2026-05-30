import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { hasPrivilege, PRIVILEGES } from "../utils/gamification";

/**
 * Hook to check if the current user has a specific privilege.
 * Usage: const { can, privileges } = useReputation();
 *        can("downvote") → boolean
 */
export function useReputation() {
  const { user } = useAuth();
  const reputation = user?.reputation ?? 0;

  const can = (action) => hasPrivilege(reputation, action);

  // Expose all thresholds for UI display
  const privileges = useMemo(
    () =>
      Object.entries(PRIVILEGES).map(([action, threshold]) => ({
        action,
        threshold,
        unlocked: reputation >= threshold,
      })),
    [reputation]
  );

  return { can, reputation, privileges };
}