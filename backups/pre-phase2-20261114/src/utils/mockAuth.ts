import { UserProfile, UserRole, DUAL_OWNER_EMAILS } from "../types";

const LOCAL_USER_KEY = "user";
const LOCAL_PROFILE_KEY = "pdfsun_user_profile";
const LOCAL_ROLE_KEY = "pdfsun_user_role";
const LOCAL_TOKEN_KEY = "pdfsun_auth_token";

/**
 * Normalizes email and checks owner privileges
 */
export function isOwnerAccount(email: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    DUAL_OWNER_EMAILS.includes(clean) ||
    clean === "mukeshkalonia241@gmail.com" ||
    clean === "mukeshinland79@gmail.com"
  );
}

/**
 * Creates a normalized UserProfile object locally
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
  const isOwner = isOwnerAccount(cleanEmail) || params.role === "owner";
  const role: UserRole = isOwner ? "owner" : params.role || "user";
  const defaultName = isOwner
    ? cleanEmail.includes("inland")
      ? "Mukesh Inland"
      : "Mukesh Kalonia"
    : params.name?.trim() || cleanEmail.split("@")[0].replace(/[._]/g, " ") || "Customer";

  return {
    id: isOwner ? "owner-001" : `usr-${Date.now()}`,
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
 * Reads user from browser storage
 */
export function getLocalStoredUser(): { user: UserProfile | null; role: UserRole; token: string | null } {
  if (typeof window === "undefined") {
    return { user: null, role: "public", token: null };
  }

  try {
    const rawUser = localStorage.getItem(LOCAL_USER_KEY) || localStorage.getItem(LOCAL_PROFILE_KEY);
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    const rawRole = localStorage.getItem(LOCAL_ROLE_KEY) as UserRole | null;

    if (rawUser) {
      const user = JSON.parse(rawUser) as UserProfile;
      if (user && user.email) {
        if (isOwnerAccount(user.email)) {
          user.role = "owner";
          user.hasAdminAccess = true;
          user.isPro = true;
        }
        return {
          user,
          role: user.role || rawRole || "user",
          token: token || "local-jwt-token",
        };
      }
    }
  } catch (e) {
    console.warn("[mockAuth] Error reading local user storage:", e);
  }

  return { user: null, role: "public", token: null };
}

/**
 * Persists user to browser localStorage across all key names
 */
export function saveLocalStoredUser(user: UserProfile, token: string = `jwt-${Date.now()}`): void {
  if (typeof window === "undefined") return;

  try {
    const role = user.role || (isOwnerAccount(user.email) ? "owner" : "user");
    const json = JSON.stringify(user);
    localStorage.setItem(LOCAL_USER_KEY, json);
    localStorage.setItem(LOCAL_PROFILE_KEY, json);
    localStorage.setItem(LOCAL_ROLE_KEY, role);
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
  } catch (e) {
    console.warn("[mockAuth] Error saving local user storage:", e);
  }
}

/**
 * Clears user auth and OAuth tokens from browser storage & disables identity auto-select
 */
export function clearLocalStoredUser(): void {
  if (typeof window === "undefined") return;

  try {
    const authKeys = [
      LOCAL_USER_KEY,
      LOCAL_PROFILE_KEY,
      LOCAL_ROLE_KEY,
      LOCAL_TOKEN_KEY,
      "pdfsun_admin_edit_mode",
      "pdfsun_auth_token",
      "provider_access_token",
      "pdfsun_provider",
      "pdfsun_provider_token",
      "google_id_token",
      "fb_access_token",
      "pdfsun_oauth_state",
      "pdfsun_session_id",
      "pdfsun_last_active_time",
    ];

    for (const key of authKeys) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }

    // Explicitly disable Google Identity Services / One-Tap auto-selection
    if ((window as any).google?.accounts?.id?.disableAutoSelect) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch (err) {
        console.warn("[mockAuth] Google disableAutoSelect notice:", err);
      }
    }

    // Revoke Google OAuth token if window.google.accounts.oauth2.revoke exists
    const providerToken = localStorage.getItem("provider_access_token");
    if (providerToken && (window as any).google?.accounts?.oauth2?.revoke) {
      try {
        (window as any).google.accounts.oauth2.revoke(providerToken, () => {});
      } catch (err) {
        console.warn("[mockAuth] Google OAuth revoke notice:", err);
      }
    }

    // Explicitly disconnect Facebook session if SDK is loaded
    if ((window as any).FB?.logout) {
      try {
        (window as any).FB.logout(() => {});
      } catch (err) {
        console.warn("[mockAuth] Facebook logout notice:", err);
      }
    }
  } catch (e) {
    console.warn("[mockAuth] Error clearing local user storage:", e);
  }
}

/**
 * Mock async Login handler (100% client-side fallback)
 */
export async function mockLoginHandler(params: {
  email: string;
  password?: string;
  isOwnerLogin?: boolean;
  ownerSecretKey?: string;
}): Promise<{
  success: boolean;
  status: string;
  message: string;
  token: string;
  user: UserProfile;
  role: UserRole;
}> {
  // Simulate rapid async resolution (zero network delay)
  await new Promise((r) => setTimeout(r, 60));

  const cleanEmail = (params.email || "").toLowerCase().trim();
  const isOwner = isOwnerAccount(cleanEmail) || Boolean(params.isOwnerLogin);
  const profile = createMockUserProfile({
    email: cleanEmail,
    role: isOwner ? "owner" : "user",
    isPro: isOwner,
  });
  const token = `local-token-${Date.now()}`;

  saveLocalStoredUser(profile, token);

  return {
    success: true,
    status: "ok",
    message: isOwner ? "Owner authentication verified." : "Signed in successfully!",
    token,
    user: profile,
    role: profile.role,
  };
}

/**
 * Mock async Register handler (100% client-side fallback)
 */
export async function mockRegisterHandler(params: {
  name?: string;
  email: string;
  password?: string;
}): Promise<{
  success: boolean;
  status: string;
  message: string;
  token: string;
  user: UserProfile;
  role: UserRole;
}> {
  await new Promise((r) => setTimeout(r, 60));

  const cleanEmail = (params.email || "").toLowerCase().trim();
  const profile = createMockUserProfile({
    email: cleanEmail,
    name: params.name,
    role: isOwnerAccount(cleanEmail) ? "owner" : "user",
    isPro: isOwnerAccount(cleanEmail),
  });
  const token = `local-token-${Date.now()}`;

  saveLocalStoredUser(profile, token);

  return {
    success: true,
    status: "ok",
    message: "Free account activated! Welcome to PDFSun.",
    token,
    user: profile,
    role: profile.role,
  };
}

/**
 * Mock async MFA and Password Reset handlers
 */
export async function mockResetInitiationHandler(identifier: string) {
  await new Promise((r) => setTimeout(r, 50));
  const clean = identifier.toLowerCase().trim();
  return {
    success: true,
    status: "ok",
    message: `6-digit recovery OTP dispatched to ${clean}`,
    maskedTarget: clean,
    maskedEmail: clean.includes("@") ? clean : undefined,
    maskedPhone: !clean.includes("@") ? clean : "+91 9991659655",
    expiresInSeconds: 600,
    cooldownSeconds: 60,
    otp: "774921",
  };
}

export async function mockVerifyRecoveryOtpHandler(identifier: string, otp: string) {
  await new Promise((r) => setTimeout(r, 50));
  return {
    success: true,
    status: "ok",
    resetToken: `reset-token-${Date.now()}`,
    message: "OTP verified successfully! Please set your new password.",
  };
}

export async function mockNewPasswordHandler(identifier: string, newPassword: string) {
  await new Promise((r) => setTimeout(r, 60));
  const cleanEmail = identifier.toLowerCase().trim();
  const profile = createMockUserProfile({
    email: cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@pdfsun.in`,
  });
  const token = `local-token-${Date.now()}`;
  saveLocalStoredUser(profile, token);
  return {
    success: true,
    status: "ok",
    message: "Password Successfully Reset for PDFSun.in! Access is restored securely.",
    token,
    user: profile,
  };
}
