import { useCallback } from "react";
import { UserRole, UserProfile } from "../types";

export interface AutoDraftState {
  activeToolId?: string;
  savedAt: string;
  url: string;
}

interface UseInactivityTimeoutOptions {
  currentRole: UserRole;
  userProfile: UserProfile | null;
  activeToolId?: string;
  onLogout: () => void;
}

/**
 * Inactivity timeout and 10-minute lock have been permanently disabled.
 * Sessions remain active without any 10-minute forced logouts or interruptions.
 */
export function useInactivityTimeout({
  activeToolId,
  onLogout,
}: UseInactivityTimeoutOptions) {
  // Save Auto-Draft State safely without forcing logouts
  const saveAutoDraft = useCallback(() => {
    try {
      const draft: AutoDraftState = {
        activeToolId: activeToolId,
        savedAt: new Date().toISOString(),
        url: window.location.href,
      };
      sessionStorage.setItem("pdfsun_auto_draft", JSON.stringify(draft));
      localStorage.setItem("pdfsun_auto_draft", JSON.stringify(draft));
    } catch (e) {
      console.warn("[Auto-Draft] Error saving draft state:", e);
    }
  }, [activeToolId]);

  const executeSecureLogout = useCallback(
    async (reason = "manual_logout") => {
      saveAutoDraft();
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.warn("[Session] Failed to notify server of logout:", err);
      }
      onLogout();
    },
    [saveAutoDraft, onLogout]
  );

  const resetInactivityTimer = useCallback(async (_isExplicitClick?: boolean) => {
    // No-op: No timeout or lock active
  }, []);

  return {
    showWarningModal: false,
    remainingSeconds: 0,
    resetInactivityTimer,
    executeSecureLogout,
  };
}
