import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { safeFetchJson } from "../utils/apiHelper";

export interface PasskeyCredentialMetadata {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string | null;
  deviceType?: "singleDevice" | "multiDevice" | string;
  backedUp?: boolean;
  transports?: string[];
}

export function isPasskeySupportedInBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.credentials !== "undefined" &&
    typeof navigator.credentials.create === "function" &&
    typeof navigator.credentials.get === "function"
  );
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("pdfsun_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchUserPasskeys(): Promise<{
  success: boolean;
  credentials: PasskeyCredentialMetadata[];
  error?: string;
}> {
  const res = await safeFetchJson<{
    success?: boolean;
    credentials?: PasskeyCredentialMetadata[];
    error?: string;
  }>("/api/v1/auth/passkey/credentials", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok || !res.data?.success) {
    return {
      success: false,
      credentials: [],
      error: res.data?.error || res.error || "Unable to fetch registered passkeys.",
    };
  }

  return {
    success: true,
    credentials: Array.isArray(res.data.credentials) ? res.data.credentials : [],
  };
}

export async function registerPasskeyForCurrentUser(label?: string): Promise<{
  success: boolean;
  credential?: PasskeyCredentialMetadata;
  error?: string;
}> {
  if (!isPasskeySupportedInBrowser()) {
    return {
      success: false,
      error: "WebAuthn Passkeys are not supported in this browser.",
    };
  }

  const trimmedLabel = (label || "").trim().slice(0, 80) || "My Device Passkey";

  const optionsRes = await safeFetchJson<{
    success?: boolean;
    options?: PublicKeyCredentialCreationOptionsJSON;
    error?: string;
  }>("/api/v1/auth/passkey/register/options", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ label: trimmedLabel }),
  });

  if (!optionsRes.ok || !optionsRes.data?.success || !optionsRes.data.options) {
    return {
      success: false,
      error:
        optionsRes.data?.error ||
        optionsRes.error ||
        "Passkey registration is currently unavailable on this server.",
    };
  }

  try {
    const attestationResponse = await startRegistration({
      optionsJSON: optionsRes.data.options,
    });

    const verifyRes = await safeFetchJson<{
      success?: boolean;
      credential?: PasskeyCredentialMetadata;
      error?: string;
    }>("/api/v1/auth/passkey/register/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        label: trimmedLabel,
        response: attestationResponse,
      }),
    });

    if (!verifyRes.ok || !verifyRes.data?.success || !verifyRes.data.credential) {
      return {
        success: false,
        error: verifyRes.data?.error || verifyRes.error || "Passkey verification failed.",
      };
    }

    return {
      success: true,
      credential: verifyRes.data.credential,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "NotAllowedError"
        ? "Passkey registration was cancelled or timed out."
        : err instanceof Error
          ? err.message
          : "Passkey registration failed.";
    return { success: false, error: message };
  }
}

export async function revokeUserPasskey(credentialId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!credentialId) {
    return { success: false, error: "Invalid passkey identifier." };
  }

  const res = await safeFetchJson<{
    success?: boolean;
    error?: string;
  }>(`/api/v1/auth/passkey/credentials/${encodeURIComponent(credentialId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok || !res.data?.success) {
    return {
      success: false,
      error: res.data?.error || res.error || "Unable to revoke passkey.",
    };
  }

  return { success: true };
}
