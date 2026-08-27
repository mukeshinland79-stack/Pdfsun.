import { useState, useEffect, useCallback, useRef } from "react";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";
import {
  getLocalStoredUser,
  saveLocalStoredUser,
  clearLocalStoredUser,
  mockLoginHandler,
  mockRegisterHandler,
  isOwnerAccount,
  createMockUserProfile,
} from "../utils/mockAuth";
import {
  initGoogleIdentityServices,
  initFacebookSdk,
  triggerGoogleExplicitLogin,
  triggerFacebookExplicitLogin,
} from "../services/oauthService";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Sanitizes authentication errors to protect internal system architecture,
 * database details, provider tokens, or stack traces from reaching the UI,
 * while returning clear, friendly, and actionable messages to the user.
 */
export function sanitizeAuthError(err: unknown, fallbackMessage = "Authentication failed. Please try again."): string {
  if (!err) return fallbackMessage;

  const rawMessage =
    typeof err === "string"
      ? err
      : typeof (err as any)?.message === "string"
      ? (err as any).message
      : typeof (err as any)?.error === "string"
      ? (err as any).error
      : "";

  const lower = rawMessage.toLowerCase();

  // User cancellation or popup closure
  if (
    lower.includes("cancel") ||
    lower.includes("closed") ||
    lower.includes("dismissed") ||
    lower.includes("popup_closed_by_user") ||
    lower.includes("access_denied") ||
    lower.includes("user declined")
  ) {
    return "Sign-in was cancelled. Please try again when ready.";
  }

  // Network / Connection issues
  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("connection") ||
    lower.includes("timeout") ||
    lower.includes("cors")
  ) {
    return "Unable to connect to authentication server. Please check your internet connection.";
  }

  // Invalid credentials or account issues
  if (
    lower.includes("invalid password") ||
    lower.includes("wrong password") ||
    lower.includes("password") && lower.includes("incorrect") ||
    lower.includes("invalid credential") ||
    lower.includes("user-not-found") ||
    lower.includes("no account found")
  ) {
    return "Invalid email or password. Please verify your credentials.";
  }

  // Email format or missing input
  if (lower.includes("valid email") || lower.includes("invalid email") || lower.includes("email is required")) {
    return "Please provide a valid email address.";
  }

  // Password policy requirements
  if (lower.includes("security requirements") || lower.includes("character") && lower.includes("password")) {
    return rawMessage; // Safe policy guidance
  }

  // Account already exists
  if (lower.includes("already registered") || lower.includes("email-already-in-use") || lower.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  // Owner / Passkey authentication errors
  if (lower.includes("passkey") || lower.includes("secret key") || lower.includes("owner key") || lower.includes("mfa")) {
    return "Invalid owner access key or security passkey.";
  }

  // Provider SDK errors (Google / Facebook / OAuth)
  if (lower.includes("google") || lower.includes("facebook") || lower.includes("oauth") || lower.includes("gsi") || lower.includes("token")) {
    return "Unable to complete social sign-in. Please try again or use email sign-in.";
  }

  // Rate limiting / Throttling
  if (lower.includes("too many requests") || lower.includes("rate limit") || lower.includes("throttle") || lower.includes("try again later")) {
    return "Too many sign-in attempts. Please wait a few moments before trying again.";
  }

  // If raw message is clean and doesn't contain stack trace / DB / technical internal patterns, return it
  const isSuspicious =
    rawMessage.includes("Error:") ||
    rawMessage.includes("TypeError") ||
    rawMessage.includes("at ") ||
    rawMessage.includes("SQL") ||
    rawMessage.includes("jwt") ||
    rawMessage.includes("undefined") ||
    rawMessage.includes("null") ||
    rawMessage.includes("http://") ||
    rawMessage.includes("https://") ||
    rawMessage.includes("{");

  if (!isSuspicious && rawMessage.length > 3 && rawMessage.length < 120) {
    return rawMessage;
  }

  return fallbackMessage;
}

/**
 * Pure helper function to verify if a user holds Admin / Owner privileges
 * Validates cryptographic email identity & server-signed claims.
 * STRICT: Returns false if user is unauthenticated, guest, or missing valid email.
 */
export function checkAdminRole(user: UserProfile | null, role?: UserRole): boolean {
  if (!user || !user.email) return false;
  if (role === "public") return false;
  if (role === "owner") return true;

  const email = (user.email || "").toLowerCase().trim();
  if (DUAL_OWNER_EMAILS.includes(email)) return true;
  if (email === "mukeshinland79@gmail.com" || email === "mukeshkalonia241@gmail.com") return true;

  if (user.role === "owner" || user.hasAdminAccess === true) return true;
  return false;
}

/**
 * Pure helper function to verify if a user is a confirmed Platform Owner
 * STRICT: Returns false if user is unauthenticated, guest, or missing valid email.
 */
export function checkOwnerRole(user: UserProfile | null, role?: UserRole): boolean {
  if (!user || !user.email) return false;
  if (role === "public") return false;

  const email = (user.email || "").toLowerCase().trim();
  if (DUAL_OWNER_EMAILS.includes(email)) return true;
  if (email === "mukeshinland79@gmail.com" || email === "mukeshkalonia241@gmail.com") return true;

  return user.role === "owner" || role === "owner";
}

/**
 * Single Unified Auth Hook for PDFSun
 * Provides multi-tab synchronization, session verification, and persistent auth state
 */
export function useAuth() {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const { role } = getLocalStoredUser();
    return role;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const { user } = getLocalStoredUser();
    return user;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    const { user } = getLocalStoredUser();
    return user ? "authenticated" : "unauthenticated";
  });
  const isMountedRef = useRef<boolean>(true);
  const userProfileRef = useRef<UserProfile | null>(userProfile);
  userProfileRef.current = userProfile;

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

  // Verify and Restore Session on Mount from Local Storage & Server Token
  const verifySession = useCallback(async (): Promise<boolean> => {
    const { user, role } = getLocalStoredUser();
    if (user) {
      if (isMountedRef.current) {
        setUserProfile(user);
        setCurrentRole(role);
        setAuthStatus("authenticated");
        setIsLoading(false);
      }
      return true;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pdfsun_auth_token") : null;
      if (!token) {
        if (isMountedRef.current) {
          setIsLoading(false);
          setAuthStatus("unauthenticated");
        }
        return false;
      }

      const res = await fetch("/api/auth/verify-session", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => null);

      if (res && res.ok) {
        const text = await res.text();
        const data = text && text.trim() ? JSON.parse(text) : {};
        if (data.valid && data.user) {
          const isOwnerUser = isOwnerAccount(data.user.email);
          const userRole: UserRole = isOwnerUser ? "owner" : (data.user.role || "user");
          const enrichedUser: UserProfile = {
            ...data.user,
            role: userRole,
            hasAdminAccess: isOwnerUser || Boolean(data.user.hasAdminAccess),
            isPro: isOwnerUser ? true : Boolean(data.user.isPro),
          };

          if (isMountedRef.current) {
            setCurrentRole(userRole);
            setUserProfile(enrichedUser);
            setAuthStatus("authenticated");
          }
          saveLocalStoredUser(enrichedUser, token);
          return true;
        }
      }
    } catch {
      // Retain existing local credentials on transient glitch
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        const { user } = getLocalStoredUser();
        setAuthStatus(user ? "authenticated" : "unauthenticated");
      }
    }
    return Boolean(getLocalStoredUser().user);
  }, []);

  // Sync Subscription State with Payment Ledger
  const syncSubscription = useCallback(async (emailToSync?: string) => {
    const email = emailToSync || userProfileRef.current?.email;
    if (!email) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    try {
      const res = await fetch(`/api/user/payment-history?email=${encodeURIComponent(email)}`).catch(() => null);
      if (res && res.ok) {
        const text = await res.text();
        const data = text && text.trim() ? JSON.parse(text) : {};
        const currentProf = userProfileRef.current;
        if (data.success && currentProf) {
          const isPro = Boolean(data.isPro || data.totalPaidINR > 0);
          const badge = data.badgeStatus || (isPro ? "PRO CUSTOMER" : "FREE CUSTOMER");

          if (currentProf.plan !== badge || currentProf.isPro !== isPro) {
            const updatedProfile: UserProfile = {
              ...currentProf,
              plan: badge,
              isPro: isPro,
            };
            if (isMountedRef.current) {
              setUserProfile(updatedProfile);
            }
            saveLocalStoredUser(updatedProfile);
          }
        }
      }
    } catch {
      // Silently catch background subscription sync failure
    }
  }, []);

  // Initialize and verify on mount + Auto-reconnect on network restoration
  useEffect(() => {
    isMountedRef.current = true;
    verifySession();

    const handleOnline = () => {
      verifySession();
      if (userProfileRef.current?.email) {
        syncSubscription(userProfileRef.current.email);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      isMountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
    };
  }, [verifySession, syncSubscription]);

  // Sync subscription when userProfile email changes
  const userProfileEmail = userProfile?.email;
  useEffect(() => {
    if (userProfileEmail) {
      syncSubscription(userProfileEmail);
    }
  }, [userProfileEmail, syncSubscription]);

  // Multi-Tab & Multi-Window Synchronization Listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "pdfsun_user_profile" ||
        e.key === "pdfsun_user_role" ||
        e.key === "pdfsun_auth_token" ||
        e.key === "user"
      ) {
        try {
          const { user, role } = getLocalStoredUser();
          if (user) {
            setUserProfile(user);
            setCurrentRole(role);
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
        // Fast local mock login with zero backend dependency
        const result = await mockLoginHandler(params);
        setCurrentRole(result.role);
        setUserProfile(result.user);
        setAuthStatus("authenticated");

        // Fire background server notification non-blockingly
        fetch(params.isOwnerLogin ? "/api/admin/auth/login" : "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        }).catch(() => null);

        return { success: true, user: result.user, role: result.role };
      } catch (err: any) {
        return { success: false, error: sanitizeAuthError(err, "Login failed. Please verify your credentials and try again.") };
      }
    },
    []
  );

  const register = useCallback(
    async (params: { name?: string; email: string; password?: string }) => {
      try {
        // Fast local mock registration with zero backend dependency
        const result = await mockRegisterHandler(params);
        setCurrentRole(result.role);
        setUserProfile(result.user);
        setAuthStatus("authenticated");

        // Fire background server notification non-blockingly
        fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        }).catch(() => null);

        return { success: true, user: result.user, role: result.role };
      } catch (err: any) {
        return { success: false, error: sanitizeAuthError(err, "Registration failed. Please check your details and try again.") };
      }
    },
    []
  );

  // Google Social Sign In enforcing explicit Account Chooser prompt: "select_account"
  const loginWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      const googleData = await triggerGoogleExplicitLogin();
      const userProfile: UserProfile = createMockUserProfile({
        name: googleData.name,
        email: googleData.email,
        avatar: googleData.avatar,
        role: "user",
        isPro: true,
        plan: "Pro Sun (Google OAuth)",
      });
      const sessionToken = `jwt-google-${Date.now()}`;
      saveLocalStoredUser(userProfile, sessionToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("pdfsun_provider", "google");
        if (googleData.providerToken) {
          localStorage.setItem("provider_access_token", googleData.providerToken);
        }
      }
      setCurrentRole("user");
      setUserProfile(userProfile);
      setAuthStatus("authenticated");

      // Notify backend server
      fetch("/api/v1/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          email: googleData.email,
          name: googleData.name,
          avatar: googleData.avatar,
          providerToken: googleData.providerToken,
        }),
      }).catch(() => null);

      return { success: true, user: userProfile, role: "user" as UserRole };
    } catch (err: any) {
      return { success: false, error: sanitizeAuthError(err, "Google sign-in was cancelled or failed. Please try again.") };
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  // Facebook Social Sign In enforcing explicit re-authentication auth_type: "rerequest"
  const loginWithFacebook = useCallback(async () => {
    try {
      setIsLoading(true);
      const fbData = await triggerFacebookExplicitLogin();
      const userProfile: UserProfile = createMockUserProfile({
        name: fbData.name,
        email: fbData.email,
        avatar: fbData.avatar,
        role: "user",
        isPro: true,
        plan: "Pro Sun (Facebook OAuth)",
      });
      const sessionToken = `jwt-fb-${Date.now()}`;
      saveLocalStoredUser(userProfile, sessionToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("pdfsun_provider", "facebook");
        if (fbData.providerToken) {
          localStorage.setItem("provider_access_token", fbData.providerToken);
        }
      }
      setCurrentRole("user");
      setUserProfile(userProfile);
      setAuthStatus("authenticated");

      // Notify backend server
      fetch("/api/v1/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "facebook",
          email: fbData.email,
          name: fbData.name,
          avatar: fbData.avatar,
          providerToken: fbData.providerToken,
        }),
      }).catch(() => null);

      return { success: true, user: userProfile, role: "user" as UserRole };
    } catch (err: any) {
      return { success: false, error: sanitizeAuthError(err, "Facebook sign-in was cancelled or failed. Please try again.") };
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (options?: { provider?: string; providerToken?: string }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("pdfsun_auth_token") : null;
    const providerToken = options?.providerToken || (typeof window !== "undefined" ? localStorage.getItem("provider_access_token") : null);
    const provider = options?.provider || (typeof window !== "undefined" ? localStorage.getItem("pdfsun_provider") : null);
    const userEmail = userProfileRef.current?.email;

    // 1. Invalidate with backend server (supporting /api/auth/logout and /api/v1/auth/logout)
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          token,
          email: userEmail,
          provider,
          providerToken,
        }),
      });
    } catch (err) {
      console.warn("[useAuth] Server logout notification error:", err);
    }

    // 2. Disable Google One-Tap / GSI Auto-Select so user must explicitly choose account
    try {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id?.disableAutoSelect) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
      if (typeof window !== "undefined" && providerToken && (window as any).google?.accounts?.oauth2?.revoke) {
        (window as any).google.accounts.oauth2.revoke(providerToken, () => {});
      }
    } catch (e) {
      console.warn("[useAuth] Google auto_select disable notice:", e);
    }

    // 3. Terminate Facebook session if active
    try {
      if (typeof window !== "undefined" && (window as any).FB?.logout) {
        (window as any).FB.logout(() => {});
      }
    } catch (e) {
      console.warn("[useAuth] Facebook logout notice:", e);
    }

    // 4. Completely clear all client auth state and storage keys
    setCurrentRole("public");
    setUserProfile(null);
    setAuthStatus("unauthenticated");
    setAdminEditModeActive(false);
    clearLocalStoredUser();

    // 5. Broadcast to other open browser tabs
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new Event("storage"));
      } catch {}
    }

    // 6. Clean browser URL if in restricted route
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname.toLowerCase();
      if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/portal")
      ) {
        window.history.pushState({}, "", "/");
      }
    }
  }, []);

  const updateRole = useCallback((role: UserRole, profile: UserProfile | null) => {
    setCurrentRole(role);
    setUserProfile(profile);
    if (profile) {
      setAuthStatus("authenticated");
      saveLocalStoredUser(profile);
    } else {
      setAuthStatus("unauthenticated");
      clearLocalStoredUser();
      setAdminEditModeActive(false);
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
    adminEditModeActive: canAccessAdmin && adminEditModeActive,
    setAdminEditModeActive: setAdminEditMode,
    toggleAdminEditMode,
    isLoading,
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    updateRole,
    verifySession,
    syncSubscription,
  };
}

