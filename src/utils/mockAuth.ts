import { UserProfile, UserRole, DUAL_OWNER_EMAILS } from "../types";

const LOCAL_USER_KEY = "user";
const LOCAL_PROFILE_KEY = "pdfsun_user_profile";
const LOCAL_ROLE_KEY = "pdfsun_user_role";
const LOCAL_TOKEN_KEY = "pdfsun_auth_token";

/**
 * Normalizes email and checks owner allowlist
 */
export function isOwnerAccount(email: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    DUAL_OWNER_EMAILS.includes(clean) ||
    clean === "mukeshinland79@gmail.com"
  );
}

/**
 * Normalizes a server-verified UserProfile object
 */
export function createMockUserProfile(params: {
  email: string;
  name?: string;
  role?: UserRole;
  isPro?: boolean;
  avatar?: string;
  plan?: string;
}): UserProfile {
  const cleanEmail = params.email.toLowerCase().trim();
  const isOwner = isOwnerAccount(cleanEmail) && params.role === "owner";
  const role: UserRole = isOwner ? "owner" : params.role === "admin" ? "admin" : "user";
  const defaultName = isOwner
    ? "Mukesh Inland"
    : params.name?.trim() || cleanEmail.split("@")[0].replace(/[._]/g, " ") || "Customer";

  const canonicalOwnerId =
    cleanEmail === "mukeshinland79@gmail.com"
      ? "owner-002"
      : "owner-002";

  return {
    id: isOwner ? canonicalOwnerId : `usr-${Date.now()}`,
    name: defaultName,
    email: cleanEmail,
    role,
    avatar:
      params.avatar ||
      (isOwner
        ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"),
    plan: params.plan || (isOwner ? "Founder & Owner - Unlimited" : params.isPro ? "Pro Sun (Active)" : "Free Plan (Active)"),
    joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    hasAdminAccess: isOwner,
    isPro: isOwner ? true : Boolean(params.isPro),
  };
}

/**
 * Reads cached user hint & token from browser storage.
 * Note: Caller MUST verify token via /api/v1/auth/verify-session before trusting role or PRO status.
 */
export function getLocalStoredUser(): { user: UserProfile | null; role: UserRole; token: string | null } {
  if (typeof window === "undefined") {
    return { user: null, role: "public", token: null };
  }

  try {
    const rawUser = localStorage.getItem(LOCAL_USER_KEY) || localStorage.getItem(LOCAL_PROFILE_KEY);
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    const rawRole = localStorage.getItem(LOCAL_ROLE_KEY) as UserRole | null;

    if (rawUser && token) {
      const user = JSON.parse(rawUser) as UserProfile;
      if (user && user.email) {
        return {
          user,
          role: user.role || rawRole || "user",
          token,
        };
      }
    }
  } catch (e) {
    console.warn("[authStorage] Error reading local user storage:", e);
  }

  return { user: null, role: "public", token: null };
}

/**
 * Persists verified user session info to browser storage
 */
export function saveLocalStoredUser(user: UserProfile, token?: string): void {
  if (typeof window === "undefined") return;

  try {
    const role: UserRole = user.role || "user";
    const json = JSON.stringify(user);
    localStorage.setItem(LOCAL_USER_KEY, json);
    localStorage.setItem(LOCAL_PROFILE_KEY, json);
    localStorage.setItem(LOCAL_ROLE_KEY, role);
    if (token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, token);
    }
  } catch (e) {
    console.warn("[authStorage] Error saving local user storage:", e);
  }
}

/**
 * Clears all auth tokens, OAuth state, admin tokens, and ephemeral AI/document workspace keys from browser storage.
 */
export function clearLocalStoredUser(): void {
  if (typeof window === "undefined") return;

  try {
    const providerToken = localStorage.getItem("provider_access_token");
    if (providerToken && (window as any).google?.accounts?.oauth2?.revoke) {
      try {
        (window as any).google.accounts.oauth2.revoke(providerToken, () => {});
      } catch (err) {
        console.warn("[authStorage] Google OAuth revoke notice:", err);
      }
    }

    const keysToPurge = [
      LOCAL_USER_KEY,
      LOCAL_PROFILE_KEY,
      LOCAL_ROLE_KEY,
      LOCAL_TOKEN_KEY,
      "pdfsun_admin_edit_mode",
      "pdfsun_admin_token",
      "pdfsun_auth_token",
      "token",
      "provider_access_token",
      "pdfsun_provider",
      "pdfsun_provider_token",
      "google_id_token",
      "fb_access_token",
      "pdfsun_oauth_state",
      "pdfsun_session_id",
      "pdfsun_last_active_time",
      "pdfsun_user_is_pro",
      "pdfsun_pro_plan",
      "pdfsun_user_plan_v1",
      "pdfsun_ai_document_text",
      "pdfsun_ai_chat_history",
      "pdfsun_ai_outputs",
    ];

    for (const key of keysToPurge) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }

    if ((window as any).google?.accounts?.id?.disableAutoSelect) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch (err) {
        console.warn("[authStorage] Google disableAutoSelect notice:", err);
      }
    }

    if ((window as any).FB?.logout) {
      try {
        (window as any).FB.logout(() => {});
      } catch (err) {
        console.warn("[authStorage] Facebook logout notice:", err);
      }
    }
  } catch (e) {
    console.warn("[authStorage] Error clearing local user storage:", e);
  }
}
