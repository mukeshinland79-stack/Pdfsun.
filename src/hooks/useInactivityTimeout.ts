import { useState, useEffect, useRef, useCallback } from "react";
import { UserRole, UserProfile } from "../types";

const INACTIVITY_WARN_MS = 9 * 60 * 1000; // 9 minutes = 540,000 ms
const INACTIVITY_MAX_MS = 10 * 60 * 1000; // 10 minutes = 600,000 ms
const COUNTDOWN_SECONDS = 60; // 60s countdown from 9m to 10m

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

export function useInactivityTimeout({
  currentRole,
  userProfile,
  activeToolId,
  onLogout,
}: UseInactivityTimeoutOptions) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(COUNTDOWN_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isLoggedIn = currentRole !== "public" || userProfile !== null;

  // 1. Save Auto-Draft State
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

  // 2. Perform Secure Logout Execution
  const executeSecureLogout = useCallback(
    async (reason = "inactivity_timeout") => {
      saveAutoDraft();

      try {
        localStorage.setItem("pdfsun_redirect_url", window.location.href);
        localStorage.setItem("pdfsun_logout_reason", reason);
      } catch (e) {
        console.warn("[Session] Error setting redirect URL:", e);
      }

      // Invalidate session on server-side
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.warn("[Session] Failed to notify server of logout:", err);
      }

      setShowWarningModal(false);
      onLogout();

      // Broadcast to all active open tabs
      if (channelRef.current) {
        try {
          channelRef.current.postMessage({ type: "SECURE_LOGOUT", reason });
        } catch (e) {
          console.warn("[BroadcastChannel] Error sending logout message:", e);
        }
      }
    },
    [saveAutoDraft, onLogout]
  );

  // 3. Reset Inactivity Timer
  const resetInactivityTimer = useCallback(async (isExplicitClick = false) => {
    lastActivityRef.current = Date.now();
    setShowWarningModal(false);
    setRemainingSeconds(COUNTDOWN_SECONDS);

    if (isExplicitClick) {
      try {
        await fetch("/api/auth/refresh-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        console.warn("[Session] Refresh error:", e);
      }
    }

    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: "RESET_INACTIVITY", timestamp: Date.now() });
      } catch (e) {
        console.warn("[BroadcastChannel] Error sending reset message:", e);
      }
    }
  }, []);

  // 4. Multi-Tab Sync via BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const bc = new BroadcastChannel("pdfsun_session_channel");
    channelRef.current = bc;

    bc.onmessage = (event) => {
      if (!event.data) return;

      if (event.data.type === "SECURE_LOGOUT") {
        setShowWarningModal(false);
        onLogout();
      } else if (event.data.type === "RESET_INACTIVITY") {
        lastActivityRef.current = event.data.timestamp || Date.now();
        setShowWarningModal(false);
        setRemainingSeconds(COUNTDOWN_SECONDS);
      }
    };

    return () => {
      bc.close();
      channelRef.current = null;
    };
  }, [onLogout]);

  // 5. Throttled User Activity Listener
  useEffect(() => {
    if (!isLoggedIn) return;

    let throttleTimer: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          if (!showWarningModal) {
            lastActivityRef.current = Date.now();
          }
        }, 1000);
      }
    };

    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click"];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isLoggedIn, showWarningModal]);

  // 6. Master Interval Loop (Checks every second)
  useEffect(() => {
    if (!isLoggedIn) {
      setShowWarningModal(false);
      return;
    }

    checkTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= INACTIVITY_MAX_MS) {
        executeSecureLogout("inactivity_timeout");
      } else if (elapsed >= INACTIVITY_WARN_MS) {
        if (!showWarningModal) {
          setShowWarningModal(true);
        }
        const secondsLeft = Math.max(0, Math.ceil((INACTIVITY_MAX_MS - elapsed) / 1000));
        setRemainingSeconds(secondsLeft);
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 1000);

    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, [isLoggedIn, showWarningModal, executeSecureLogout]);

  return {
    showWarningModal,
    remainingSeconds,
    resetInactivityTimer,
    executeSecureLogout,
  };
}
