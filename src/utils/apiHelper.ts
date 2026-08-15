/**
 * Safe API request utility for PDFSun
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * by safely reading raw text and handling empty or non-JSON server responses gracefully.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers || {}),
      },
    });

    const text = await res.text();
    let parsedData: any = null;

    if (text && text.trim().length > 0) {
      try {
        parsedData = JSON.parse(text);
      } catch (parseError) {
        console.warn("[safeFetchJson] Response is not valid JSON:", text.substring(0, 150));
        parsedData = {
          success: res.ok,
          message: text.substring(0, 200),
          error: res.ok ? "Invalid server response format." : `Server responded with HTTP ${res.status}`,
        };
      }
    } else {
      parsedData = {
        success: res.ok,
        message: res.ok ? "Success" : `Empty response from server (HTTP ${res.status})`,
      };
    }

    const hasError = !res.ok || (parsedData && parsedData.success === false && parsedData.error);
    const errorMessage = hasError
      ? parsedData?.error || parsedData?.message || `Request failed with status ${res.status}`
      : undefined;

    return {
      ok: res.ok && (!parsedData || parsedData.success !== false),
      status: res.status,
      data: parsedData as T,
      error: errorMessage,
    };
  } catch (networkError: any) {
    console.error("[safeFetchJson] Network exception:", networkError);
    return {
      ok: false,
      status: 0,
      data: { success: false, error: networkError?.message || "Network connection error. Please try again." } as any,
      error: networkError?.message || "Network connection error. Please check your internet connection.",
    };
  }
}
