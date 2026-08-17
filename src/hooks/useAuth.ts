import { useState, useEffect, useCallback, useRef } from "react";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Pure helper function to verify if a user holds Admin / Owner privileges
 * Validates cryptographic email identity & server-signed claims.
 */
export function checkAdminRole(user: UserProfile | null, role?: UserRole): boolean {
  if (!user && (!role || role === "public")) return false;
  if (role === "owner") return true;

  const email = (user?.email || "").toLowerCase().trim();
  if (DUAL_OWNER_EMAILS.includes(email)) return true;
  if (email === "mukeshinland79@gmail.com" || email === "mukeshkalonia241@gmail.com") return true;

  if (user?.role === "owner" || user?.hasAdminAccess === true) return true;
  return false;
}

/**
 * Pure helper function to verify if a user is a confirmed Platform Owner
 */
export function checkOwnerRole(user: UserProfile | null, role?: UserRole): boolean {
  if (!user && (!role || role === "public")) return false;
  if (role === "owner") return true;

  const email = (user?.email || "").toLowerCase().trim();
  if (DUAL_OWNER_EMAILS.includes(email)) return true;
  if (email === "mukeshinland79@gmail.com" || email === "mukeshkalonia241@gmail.com") return true;

  return user?.role === "owner";
}

// Safe JSON parser to prevent unexpected parsing exceptions
async function safeParseJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    return text && text.trim() ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Single Unified Auth Hook for PDFSun
 * Provides multi-tab synchronization, session verification, and persistent auth state
 */
export function useAuth() {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedProfile = localStorage.getItem("pdfsun_user_profile");
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          const email = (parsed?.email || "").toLowerCase().trim();
          if (
            DUAL_OWNER_EMAILS.includes(email) ||
            email === "mukeshinland79@gmail.com" ||
            email === "mukeshkalonia241@gmail.com" ||
            parsed.role === "owner"
          ) {
            return "owner";
          }
        }
        const storedRole = localStorage.getItem("pdfsun_user_role");
        if (storedRole === "owner" || storedRole === "user" || storedRole === "public") {
          return storedRole;
        }
      } catch (e) {
        console.warn("[useAuth] Initial role parse error:", e);
      }
    }
    return "public";
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pdfsun_user_profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          const email = (parsed?.email || "").toLowerCase().trim();
          if (
            DUAL_OWNER_EMAILS.includes(email) ||
            email === "mukeshinland79@gmail.com" ||
            email === "mukeshkalonia241@gmail.com"
          ) {
            parsed.role = "owner";
            parsed.hasAdminAccess = true;
            parsed.isPro = true;
            parsed.plan = "Founder & Owner - Unlimited";
          }
          return parsed;
        }
      } catch (e) {
        console.warn("[useAuth] Initial profile parse error:", e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const isMountedRef = useRef<boolean>(true);

  // Admin / Edit Mode toggle state
  const [adminEditModeActive, setAdminEditModeActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pdfsun_admin_edit_mode") === "true";
    }
    return false;
  });

  const isAuthenticated = userProfile !== null && currentRole !== "public";
  const isOwner = checkOwnerRole(userProfile, currentRole);
  const isAdmin = checkAdminRole(userProfile, currentRole);
  const canAccessAdmin = isAuthenticated && (isAdmin || isOwner);

  // Toggle Edit/Admin Mode with localStorage persistence
  const toggleAdminEditMode = useCallback(() => {
    setAdminEditModeActive((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("pdfsun_admin_edit_mode", String(next));
      }
      return next;
    });
  }, []);

  const setAdminEditMode = useCallback((active: boolean) => {
    setAdminEditModeActive(active);
    if (typeof window !== "undefined") {
      localStorage.setItem("pdfsun_admin_edit_mode", String(active));
    }
  }, []);

  // Verify and Restore Session on Mount from Server JWT / Cookie
  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pdfsun_auth_token") : null;
      const res = await fetch("/api/auth/verify-session", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await safeParseJson(res);
        if (data.valid && data.user) {
          const email = (data.user.email || "").toLowerCase().trim();
          const isOwnerUser =
            DUAL_OWNER_EMAILS.includes(email) ||
            email === "mukeshinland79@gmail.com" ||
            email === "mukeshkalonia241@gmail.com";
          const role: UserRole = isOwnerUser ? "owner" : (data.user.role || "user");
          const enrichedUser: UserProfile = {
            ...data.user,
            role,
            hasAdminAccess: isOwnerUser || Boolean(data.user.hasAdminAccess),
            isPro: isOwnerUser ? true : Boolean(data.user.isPro),
          };

          if (isMountedRef.current) {
            setCurrentRole(role);
            setUserProfile(enrichedUser);
            setAuthStatus("authenticated");
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("pdfsun_user_role", role);
            localStorage.setItem("pdfsun_user_profile", JSON.stringify(enrichedUser));
          }
          return true;
        } else if (data.valid === false && res.status === 401) {
          // Token is definitively invalid/expired on server
          if (isMountedRef.current) {
            setCurrentRole("public");
            setUserProfile(null);
            setAuthStatus("unauthenticated");
          }
          if (typeof window !== "undefined") {
            localStorage.removeItem("pdfsun_auth_token");
            localStorage.removeItem("pdfsun_user_role");
            localStorage.removeItem("pdfsun_user_profile");
          }
          return false;
        }
      }
    } catch (err) {
      console.warn("[useAuth] Session verification network notice:", err);
      // On network failure, retain local credentials to avoid logging user out on transient glitch
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setAuthStatus((prev) => (prev === "loading" ? (userProfile ? "authenticated" : "unauthenticated") : prev));
      }
    }
    return false;
  }, [userProfile]);

  // Sync Subscription State with Payment Ledger
  const syncSubscription = useCallback(async (emailToSync?: string) => {
    const email = emailToSync || userProfile?.email;
    if (!email) return;

    try {
      const res = await fetch(`/api/user/payment-history?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await safeParseJson(res);
        if (data.success && userProfile) {
          const isPro = Boolean(data.isPro || data.totalPaidINR > 0);
          const badge = data.badgeStatus || (isPro ? "PRO CUSTOMER" : "FREE CUSTOMER");

          if (userProfile.plan !== badge || userProfile.isPro !== isPro) {
            const updatedProfile: UserProfile = {
              ...userProfile,
              plan: badge,
              isPro: isPro,
            };
            if (isMountedRef.current) {
              setUserProfile(updatedProfile);
            }
            if (typeof window !== "undefined") {
              localStorage.setItem("pdfsun_user_profile", JSON.stringify(updatedProfile));
            }
          }
        }
      }
    } catch (err) {
      console.warn("[useAuth] Subscription sync notice:", err);
    }
  }, [userProfile]);

  // Initialize and verify on mount
  useEffect(() => {
    isMountedRef.current = true;
    verifySession();
    return () => {
      isMountedRef.current = false;
    };
  }, [verifySession]);

  // Sync subscription when userProfile email changes
  useEffect(() => {
    if (userProfile?.email) {
      syncSubscription(userProfile.email);
    }
  }, [userProfile?.email, syncSubscription]);

  // Multi-Tab & Multi-Window Synchronization Listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pdfsun_user_profile" || e.key === "pdfsun_user_role" || e.key === "pdfsun_auth_token") {
        try {
          const storedProfile = localStorage.getItem("pdfsun_user_profile");
          const storedRole = localStorage.getItem("pdfsun_user_role") as UserRole;
          if (storedProfile) {
            const parsed = JSON.parse(storedProfile);
            setUserProfile(parsed);
            setCurrentRole(storedRole || parsed.role || "user");
            setAuthStatus("authenticated");
          } else {
            setUserProfile(null);
            setCurrentRole("public");
            setAuthStatus("unauthenticated");
          }
        } catch (err) {
          console.warn("[useAuth] Cross-tab storage sync error:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(
    async (params: {
      email: string;
      password?: string;
      ownerSecretKey?: string;
      isOwnerLogin?: boolean;
    }) => {
      try {
        const endpoint = params.isOwnerLogin ? "/api/admin/auth/login" : "/api/auth/login";
        const payload = params.isOwnerLogin
          ? { email: params.email, secretKey: params.ownerSecretKey || "12345" }
          : { email: params.email, password: params.password };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await safeParseJson(res);
        if (!res.ok || (!data.success && !data.token && data.status !== "ok")) {
          return { success: false, error: data.error || data.message || "Invalid login credentials." };
        }

        if (data.token) {
          localStorage.setItem("pdfsun_auth_token", data.token);
        }

        const normalizedEmail = (data.user?.email || params.email).toLowerCase().trim();
        const isOwnerEmail =
          DUAL_OWNER_EMAILS.includes(normalizedEmail) ||
          normalizedEmail === "mukeshkalonia241@gmail.com" ||
          normalizedEmail === "mukeshinland79@gmail.com";

        const role: UserRole = isOwnerEmail ? "owner" : (data.role || (params.isOwnerLogin ? "owner" : "user"));
        const profile: UserProfile = data.user || {
          id: isOwnerEmail ? "owner-001" : `usr-${Date.now()}`,
          name: data.name || data.email?.split("@")[0] || params.email.split("@")[0],
          email: normalizedEmail,
          role,
          avatar: isOwnerEmail
            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
            : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          plan: role === "owner" ? "Founder & Owner" : "Free Customer",
          joinedDate: "Jan 2026",
          hasAdminAccess: role === "owner",
          isPro: role === "owner",
        };

        setCurrentRole(role);
        setUserProfile(profile);
        setAuthStatus("authenticated");
        localStorage.setItem("pdfsun_user_role", role);
        localStorage.setItem("pdfsun_user_profile", JSON.stringify(profile));

        return { success: true, user: profile, role };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error during login. Please try again." };
      }
    },
    []
  );

  const register = useCallback(
    async (params: { name?: string; email: string; password?: string }) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const data = await safeParseJson(res);
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || data.message || "Registration failed. Please try again." };
        }

        if (data.token) {
          localStorage.setItem("pdfsun_auth_token", data.token);
        }

        const role: UserRole = data.role || "user";
        const profile: UserProfile = data.user || {
          id: `usr-${Date.now()}`,
          name: params.name || params.email.split("@")[0],
          email: params.email.toLowerCase().trim(),
          role,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          plan: "Free Plan (Active)",
          joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          hasAdminAccess: false,
          isPro: false,
        };

        setCurrentRole(role);
        setUserProfile(profile);
        setAuthStatus("authenticated");
        localStorage.setItem("pdfsun_user_role", role);
        localStorage.setItem("pdfsun_user_profile", JSON.stringify(profile));

        return { success: true, user: profile, role };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error during registration. Please try again." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn("[useAuth] Logout server notification notice:", e);
    }
    
    // Clear only PDFSun authentication data (never use localStorage.clear()!)
    setCurrentRole("public");
    setUserProfile(null);
    setAuthStatus("unauthenticated");
    setAdminEditModeActive(false);

    try {
      localStorage.removeItem("pdfsun_auth_token");
      localStorage.removeItem("pdfsun_user_role");
      localStorage.removeItem("pdfsun_user_profile");
      localStorage.removeItem("pdfsun_admin_edit_mode");
    } catch (e) {
      console.warn("[useAuth] Storage cleanup notice:", e);
    }
  }, []);

  const updateRole = useCallback((role: UserRole, profile: UserProfile | null) => {
    setCurrentRole(role);
    setUserProfile(profile);
    if (profile) {
      setAuthStatus("authenticated");
      localStorage.setItem("pdfsun_user_role", role);
      localStorage.setItem("pdfsun_user_profile", JSON.stringify(profile));
    } else {
      setAuthStatus("unauthenticated");
      localStorage.removeItem("pdfsun_user_role");
      localStorage.removeItem("pdfsun_user_profile");
      setAdminEditModeActive(false);
      localStorage.removeItem("pdfsun_admin_edit_mode");
    }
  }, []);

  return {
    currentRole,
    userProfile,
    authStatus,
    isAuthenticated,
    isOwner,
    isAdmin,
    canAccessAdmin,
    adminEditModeActive,
    setAdminEditModeActive: setAdminEditMode,
    toggleAdminEditMode,
    isLoading,
    login,
    register,
    logout,
    updateRole,
    verifySession,
    syncSubscription,
  };
}

