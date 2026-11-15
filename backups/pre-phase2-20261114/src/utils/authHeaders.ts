/**
 * Client-side authentication header utility for authenticated PDFSun API calls.
 */
export function getClientAuthToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem("pdfsun_auth_token") ||
      localStorage.getItem("pdfsun_admin_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("pdfsun_admin_token") ||
      ""
    ).trim();
  } catch {
    return "";
  }
}

export function getClientAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getClientAuthToken();
  return token
    ? { ...extra, Authorization: `Bearer ${token}` }
    : { ...extra };
}
