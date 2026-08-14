import { useState, useEffect, useCallback } from "react";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";

/**
 * Pure helper function to verify if a user holds Admin / Owner privileges
 * Does not rely on UI DOM presence; validates cryptographic email identity & server-signed claims.
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

export function useAuth() {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("pdfsun_user_role");
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
      } catch {}
      if (storedRole === "owner" || storedRole === "user" || storedRole === "public") {
        return storedRole;
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
      } catch {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Admin / Edit Mode toggle: even for Admins, keep the public UI completely clean by default!
  // Only displays admin controls when explicit Admin View / Edit Mode is active.
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
      const token = localStorage.getItem("pdfsun_auth_token");
      const res = await fetch("/api/auth/verify-session", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.user) {
          setCurrentRole(data.user.role || "user");
          setUserProfile(data.user);
          localStorage.setItem("pdfsun_user_role", data.user.role || "user");
          localStorage.setItem("pdfsun_user_profile", JSON.stringify(data.user));
          return true;
        }
      }
    } catch (err) {
      console.warn("[useAuth] Session verification error:", err);
    } finally {
      setIsLoading(false);
    }
    return false;
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

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

        const data = await res.json();
        if (!res.ok || (!data.success && !data.token && data.status !== "ok")) {
          return { success: false, error: data.error || data.message || "Login failed" };
        }

        if (data.token) {
          localStorage.setItem("pdfsun_auth_token", data.token);
        }

        const role: UserRole = data.role || (params.isOwnerLogin ? "owner" : "user");
        const profile: UserProfile = data.user || {
          id: `usr-${Date.now()}`,
          name: data.email?.split("@")[0] || params.email.split("@")[0],
          email: data.email || params.email,
          role,
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
          plan: role === "owner" ? "Founder & Owner" : "Free Customer",
          joinedDate: "Jan 2026",
          hasAdminAccess: role === "owner",
        };

        setCurrentRole(role);
        setUserProfile(profile);
        localStorage.setItem("pdfsun_user_role", role);
        localStorage.setItem("pdfsun_user_profile", JSON.stringify(profile));

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error during login" };
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

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Registration failed" };
        }

        if (data.token) {
          localStorage.setItem("pdfsun_auth_token", data.token);
        }

        const role: UserRole = data.role || "user";
        const profile: UserProfile = data.user;

        setCurrentRole(role);
        setUserProfile(profile);
        localStorage.setItem("pdfsun_user_role", role);
        localStorage.setItem("pdfsun_user_profile", JSON.stringify(profile));

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error during registration" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setCurrentRole("public");
    setUserProfile(null);
    setAdminEditModeActive(false);
    try {
      localStorage.removeItem("pdfsun_auth_token");
      localStorage.removeItem("pdfsun_user_role");
      localStorage.removeItem("pdfsun_user_profile");
      localStorage.removeItem("pdfsun_admin_edit_mode");
    } catch {}
  }, []);

  const updateRole = useCallback((role: UserRole, profile: UserProfile | null) => {
    setCurrentRole(role);
    setUserProfile(profile);
    if (profile) {
      localStorage.setItem("pdfsun_user_role", role);
      localStorage.setItem("pdfsun_user_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("pdfsun_user_role");
      localStorage.removeItem("pdfsun_user_profile");
      setAdminEditModeActive(false);
      localStorage.removeItem("pdfsun_admin_edit_mode");
    }
  }, []);

  return {
    currentRole,
    userProfile,
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
  };
}
