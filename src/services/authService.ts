import { safeFetchJson, SafeApiResponse } from "../utils/apiHelper";
import { UserProfile, UserRole } from "../types";

/**
 * PDFSun Frontend Authentication Client
 * - Enforces clean endpoint URLs (strictly NO trailing slashes)
 * - Explicit Content-Type: application/json and Accept: application/json headers
 * - Strict POST method with JSON serialized payloads
 */

export interface AuthApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  role?: UserRole;
  user?: UserProfile;
  requiresMfa?: boolean;
  maskedTarget?: string;
  maskedEmail?: string;
  maskedPhone?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  resetToken?: string;
  data?: T;
}

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/**
 * Clean URL builder ensuring no trailing slashes
 */
function cleanUrl(path: string): string {
  const trimmed = path.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

/**
 * 1. User / Customer Login
 */
export async function loginUser(
  identifier: string,
  password: string,
  options?: { isOwnerLogin?: boolean; otp?: string }
): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/login");
  const payload = {
    identifier: identifier.trim(),
    email: identifier.trim(),
    password,
    isOwnerLogin: options?.isOwnerLogin || false,
    otp: options?.otp,
  };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 2. User / Customer Registration
 */
export async function registerUser(
  name: string,
  identifier: string,
  password: string,
  phone?: string
): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/register");
  const payload = {
    name: name.trim(),
    identifier: identifier.trim(),
    email: identifier.trim(),
    password,
    phone,
  };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 3. Initiate Password Reset (Send OTP)
 */
export async function requestPasswordReset(identifier: string): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/reset-initiation");
  const payload = { identifier: identifier.trim() };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 4. Verify Recovery OTP & Get Reset Token
 */
export async function verifyRecoveryOtp(
  identifier: string,
  otp: string
): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/reset-verify");
  const payload = {
    identifier: identifier.trim(),
    otp: otp.trim(),
  };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 5. Submit New Password with Reset Token
 */
export async function setNewPassword(
  resetToken: string,
  newPassword: string,
  identifier?: string
): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/new-password");
  const payload = {
    resetToken,
    newPassword,
    identifier: identifier?.trim(),
  };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 6. Initiate Owner MFA Step 1
 */
export async function initiateOwnerMfa(
  identifier: string,
  secretKey: string
): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/login-step1");
  const payload = {
    identifier: identifier.trim(),
    email: identifier.trim(),
    secretKey,
    password: secretKey,
    isOwnerLogin: true,
  };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 7. Verify Owner MFA Step 2 OTP
 */
export async function verifyOwnerMfaOtp(
  identifier: string,
  otp: string
): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/verify-otp");
  const payload = {
    identifier: identifier.trim(),
    otp: otp.trim(),
  };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 8. Resend Banking / Recovery OTP
 */
export async function resendOtp(identifier: string): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/resend-otp");
  const payload = { identifier: identifier.trim() };

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
}

/**
 * 9. Verify Current Session Token
 */
export async function verifySession(token?: string): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/verify-session");
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };

  const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("pdfsun_auth_token") : null);
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: activeToken }),
  });
}

/**
 * 10. Logout & Clear Session
 */
export async function logoutUser(): Promise<SafeApiResponse<AuthApiResponse>> {
  const url = cleanUrl("/api/auth/logout");
  return safeFetchJson<AuthApiResponse>(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({}),
  });
}
