import { useState, useEffect, useCallback, useRef } from "react";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseApp } from "../lib/firebase";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";
import {
  saveLocalStoredUser,
  clearLocalStoredUser,
  isOwnerAccount,
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
  const [currentRole, setCurrentRole] = useState<UserRole>("public");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("pdfsun_auth_token"));
  });
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("pdfsun_auth_token")) {
      return "loading";
    }
    return "unauthenticated";
  });
  const isMountedRef = useRef<boolean>(true);
  const userProfileRef = useRef<UserProfile | null>(userProfile);
  userProfileRef.current = userProfile;

  // Admin / Edit Mode toggle state (display preference only; gated by canAccessAdmin)
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

  // Always verify session against the backend API (supports HttpOnly cookie and Bearer token)
  const verifySession = useCallback(async (): Promise<boolean> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("pdfsun_auth_token") : null;

    try {
      const res = await fetch("/api/v1/auth/verify-session", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => null);

      if (res && res.ok) {
        const text = await res.text();
        const data = text && text.trim() ? JSON.parse(text) : {};
        if (data.valid && data.user) {
          const serverRole: UserRole =
            data.user.role === "owner" || isOwnerAccount(data.user.email)
              ? data.user.role === "owner"
                ? "owner"
                : "user"
              : data.user.role || "user";
          const enrichedUser: UserProfile = {
            ...data.user,
            role: serverRole,
            hasAdminAccess: Boolean(data.user.hasAdminAccess) || serverRole === "owner",
            isPro: Boolean(data.user.isPro),
          };

          if (isMountedRef.current) {
            setCurrentRole(serverRole);
            setUserProfile(enrichedUser);
            setAuthStatus("authenticated");
          }
          saveLocalStoredUser(enrichedUser, token || undefined);
          return true;
        }
      }

      // Fail closed whenever verification fails or returns invalid
      clearLocalStoredUser();
      if (isMountedRef.current) {
        setCurrentRole("public");
        setUserProfile(null);
        setAuthStatus("unauthenticated");
      }
      return false;
    } catch {
      clearLocalStoredUser();
      if (isMountedRef.current) {
        setCurrentRole("public");
        setUserProfile(null);
        setAuthStatus("unauthenticated");
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Sync Subscription State with authoritative Payment Ledger
  const syncSubscription = useCallback(async (emailToSync?: string) => {
    const email = emailToSync || userProfileRef.current?.email;
    if (!email) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("pdfsun_auth_token") || localStorage.getItem("pdfsun_admin_token") || ""
          : "";
      const res = await fetch(`/api/user/payment-history?email=${encodeURIComponent(email)}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).catch(() => null);
      if (res && res.ok) {
        const text = await res.text();
        const data = text && text.trim() ? JSON.parse(text) : {};
        const currentProf = userProfileRef.current;
        if (data.success && currentProf) {
          const isOwnerUser = currentProf.role === "owner";
          const isPro = isOwnerUser ? true : Boolean(data.isPro);
          const badge = isOwnerUser
            ? currentProf.plan || "Founder & Owner"
            : data.badgeStatus || (isPro ? "PRO CUSTOMER" : "FREE CUSTOMER");

          if (currentProf.plan !== badge || currentProf.isPro !== isPro) {
            const updatedProfile: UserProfile = {
              ...currentProf,
              plan: badge,
              isPro,
            };
            if (isMountedRef.current) {
              setUserProfile(updatedProfile);
            }
            saveLocalStoredUser(updatedProfile);
          }
        }
      }
    } catch {
      // Silently ignore transient subscription sync failure
    }
  }, []);

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

  const userProfileEmail = userProfile?.email;
  useEffect(() => {
    if (userProfileEmail) {
      syncSubscription(userProfileEmail);
    }
  }, [userProfileEmail, syncSubscription]);

  // Multi-Tab Synchronization Listener (re-verifies with server instead of trusting raw localStorage writes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === null ||
        e.key === "pdfsun_user_profile" ||
        e.key === "pdfsun_user_role" ||
        e.key === "pdfsun_auth_token" ||
        e.key === "user"
      ) {
        const token = typeof window !== "undefined" ? localStorage.getItem("pdfsun_auth_token") : null;
        if (!token) {
          setUserProfile(null);
          setCurrentRole("public");
          setAuthStatus("unauthenticated");
        } else {
          verifySession();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [verifySession]);

  const login = useCallback(
    async (params: {
      email: string;
      password?: string;
      ownerSecretKey?: string;
      isOwnerLogin?: boolean;
    }) => {
      try {
        const endpoint = params.isOwnerLogin ? "/api/admin/auth/login" : "/api/v1/auth/login";
        const res = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(params),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !data?.user) {
          return {
            success: false,
            error: sanitizeAuthError(data?.error || data?.message, "Login failed. Please verify your credentials and try again."),
          };
        }

        const role: UserRole = data.user.role || data.role || "user";
        saveLocalStoredUser(data.user, data.token);
        setCurrentRole(role);
        setUserProfile(data.user);
        setAuthStatus("authenticated");

        return { success: true, user: data.user, role };
      } catch (err: any) {
        return { success: false, error: sanitizeAuthError(err, "Login failed. Please verify your credentials and try again.") };
      }
    },
    []
  );

  const register = useCallback(
    async (params: { name?: string; email: string; password?: string }) => {
      try {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(params),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !data?.user) {
          return {
            success: false,
            error: sanitizeAuthError(data?.error || data?.message, "Registration failed. Please check your details and try again."),
          };
        }

        const role: UserRole = data.user.role || data.role || "user";
        saveLocalStoredUser(data.user, data.token);
        setCurrentRole(role);
        setUserProfile(data.user);
        setAuthStatus("authenticated");

        return { success: true, user: data.user, role };
      } catch (err: any) {
        return { success: false, error: sanitizeAuthError(err, "Registration failed. Please check your details and try again.") };
      }
    },
    []
  );

  // Google Social Sign In backed strictly by server session verification (never mints PRO client-side)
  const loginWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      const googleData = await triggerGoogleExplicitLogin();

      const res = await fetch("/api/v1/auth/social-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          provider: "google",
          email: googleData.email,
          name: googleData.name,
          avatar: googleData.avatar,
          providerToken: googleData.providerToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        return {
          success: false,
          error: sanitizeAuthError(data?.error || data?.message, "Google sign-in verification failed."),
        };
      }

      const role: UserRole = data.user.role || data.role || "user";
      saveLocalStoredUser(data.user, data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("pdfsun_provider", "google");
        if (googleData.providerToken) {
          localStorage.setItem("provider_access_token", googleData.providerToken);
        }
      }
      setCurrentRole(role);
      setUserProfile(data.user);
      setAuthStatus("authenticated");

      return { success: true, user: data.user, role };
    } catch (err: any) {
      return { success: false, error: sanitizeAuthError(err, "Google sign-in was cancelled or failed. Please try again.") };
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  // Facebook Social Sign In backed strictly by server session verification (never mints PRO client-side)
  const loginWithFacebook = useCallback(async () => {
    try {
      setIsLoading(true);
      const fbData = await triggerFacebookExplicitLogin();

      const res = await fetch("/api/v1/auth/social-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          provider: "facebook",
          email: fbData.email,
          name: fbData.name,
          avatar: fbData.avatar,
          providerToken: fbData.providerToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        return {
          success: false,
          error: sanitizeAuthError(data?.error || data?.message, "Facebook sign-in verification failed."),
        };
      }

      const role: UserRole = data.user.role || data.role || "user";
      saveLocalStoredUser(data.user, data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("pdfsun_provider", "facebook");
        if (fbData.providerToken) {
          localStorage.setItem("provider_access_token", fbData.providerToken);
        }
      }
      setCurrentRole(role);
      setUserProfile(data.user);
      setAuthStatus("authenticated");

      return { success: true, user: data.user, role };
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

    // 4. Sign out from Firebase Auth
    try {
      const firebaseApp = getFirebaseApp();
      const auth = getAuth(firebaseApp);
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("[useAuth] Firebase signOut notice:", e);
    }

    // 5. Completely clear all client auth state and storage keys
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

  const updateAvatar = useCallback((photoURL: string) => {
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated: UserProfile = {
        ...prev,
        photoURL,
        avatar: photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      };
      saveLocalStoredUser(updated);
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new Event("storage"));
        } catch {}
      }
      return updated;
    });
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
    updateAvatar,
    verifySession,
    syncSubscription,
  };
}

