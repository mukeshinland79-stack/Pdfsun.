/**
 * Safe API Client & Robust Response Parser for PDFSun
 * Prevents "SyntaxError: Unexpected token 'T', 'The page c...' is not valid JSON"
 * by safely inspecting Content-Type, validating HTTP statuses, and extracting
 * user-friendly error messages when HTML error pages (404/500) are returned.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isHtmlFallback?: boolean;
}

/**
 * Safely parses any Response object into either typed JSON or a graceful error string.
 * Never throws "Unexpected token" errors on HTML/plain text error pages.
 */
export async function parseSafeResponse<T = any>(response: Response): Promise<SafeApiResponse<T>> {
  const status = response.status;
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  // 1. If response is JSON
  if (contentType.includes("application/json")) {
    try {
      const json = await response.json();
      if (!response.ok) {
        const errorMsg =
          json?.error ||
          json?.message ||
          json?.detail ||
          `Server request failed with HTTP ${status} (${response.statusText || "Error"})`;
        return { ok: false, status, error: errorMsg, data: json };
      }
      return { ok: true, status, data: json };
    } catch (parseErr: any) {
      return {
        ok: false,
        status,
        error: `Failed to parse server JSON response: ${parseErr?.message || "Invalid JSON"}`,
      };
    }
  }

  // 2. If response is NOT JSON (e.g., text/html, text/plain, 404/500 proxy error page)
  try {
    const rawText = await response.text();
    const cleanText = (rawText || "").trim();

    // Check if it's an HTML error page (e.g. "The page cannot be found...", "<!DOCTYPE html>", etc.)
    const isHtml =
      cleanText.startsWith("<") ||
      cleanText.toLowerCase().includes("<!doctype") ||
      cleanText.toLowerCase().includes("<html") ||
      cleanText.toLowerCase().includes("the page cannot be found") ||
      cleanText.toLowerCase().includes("page not found") ||
      cleanText.toLowerCase().includes("cannot get") ||
      cleanText.toLowerCase().includes("cannot post");

    let cleanErrorMessage = "";
    if (isHtml) {
      if (status === 404) {
        cleanErrorMessage = `API endpoint not found (HTTP 404). Please ensure the backend server is running and the route is active.`;
      } else if (status === 500) {
        cleanErrorMessage = `Internal server error (HTTP 500). Please try again or check server logs.`;
      } else if (status === 502 || status === 503 || status === 504) {
        cleanErrorMessage = `Service temporarily unavailable (HTTP ${status}). Please check your connection and retry.`;
      } else {
        cleanErrorMessage = `Server returned an unexpected HTML response (HTTP ${status} ${response.statusText || ""}).`;
      }
    } else {
      cleanErrorMessage = cleanText.slice(0, 300) || `Server returned HTTP ${status} (${response.statusText || "Error"})`;
    }

    return {
      ok: false,
      status,
      error: cleanErrorMessage,
      isHtmlFallback: isHtml,
    };
  } catch (textErr: any) {
    return {
      ok: false,
      status,
      error: `Server returned HTTP ${status} and could not read response body: ${textErr?.message || "Unknown error"}`,
    };
  }
}

/**
 * Robust fetch wrapper that always returns safe structured data and never throws JSON syntax errors.
 */
export async function safeFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers || {}),
      },
    });
    return await parseSafeResponse<T>(response);
  } catch (networkErr: any) {
    console.error("[safeFetch Network Error]:", networkErr);
    const errStr = String(networkErr?.message || networkErr || "").toLowerCase();
    const isTimeout =
      networkErr === "NETWORK_TIMEOUT_EXCEEDED" ||
      networkErr?.name === "AbortError" ||
      errStr.includes("timeout") ||
      errStr.includes("aborted") ||
      errStr.includes("network_timeout_exceeded");

    return {
      ok: false,
      status: isTimeout ? 408 : 0,
      error: isTimeout
        ? "AI request timed out. Please try again with a shorter text selection or in a few moments."
        : networkErr?.message || "Network connection failed. Please check your internet connection.",
    };
  }
}

export interface TranslationResult {
  success: boolean;
  result?: string;
  translatedText?: string;
  targetLanguage?: string;
  chunksProcessed?: number;
  totalLength?: number;
  modelUsed?: string;
  error?: string;
}

/**
 * Dedicated document translation caller with multi-endpoint fallback (/api/translate and /api/ai/translate)
 */
export async function callTranslateApi(
  documentText: string,
  targetLanguage: string = "Hindi"
): Promise<{ success: boolean; text?: string; error?: string }> {
  const trimmed = (documentText || "").trim();
  if (!trimmed) {
    return { success: false, error: "No document text provided for translation." };
  }

  const endpoints = ["/api/translate", "/api/ai/translate"];
  let lastError = "";

  for (const endpoint of endpoints) {
    const res = await safeFetch<TranslationResult>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentText: trimmed,
        sourceText: trimmed,
        targetLanguage,
      }),
    });

    if (res.ok && res.data && (res.data.result || res.data.translatedText)) {
      return {
        success: true,
        text: res.data.result || res.data.translatedText,
      };
    }

    if (res.error) {
      lastError = res.error;
    }
    // If it's a 404 on the first endpoint, continue to fallback endpoint
    if (res.status !== 404) {
      break;
    }
  }

  return {
    success: false,
    error: lastError || "Failed to process translation request with Gemini AI.",
  };
}
