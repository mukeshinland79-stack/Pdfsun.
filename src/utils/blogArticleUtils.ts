/**
 * Blog Article Utilities for PdfSun.in
 * 
 * Includes:
 * 1. Estimated Reading Time calculation based on 200 words per minute
 * 2. Safe LocalStorage Bookmark/Save persistence with fallback & anti-corruption guards
 * 3. Native Web Share API helper with clipboard fallback
 */

const STORAGE_KEY = "pdfsun_saved_articles";
const MAX_BOOKMARKS = 100; // Guard against unbounded storage bloat
const BOOKMARK_CHANGE_EVENT = "pdfsun_bookmarks_changed";

/**
 * Calculates reading time in minutes based on average reading speed of 200 WPM.
 * Cleans out markdown syntax, code snippets, and markup to get accurate word count.
 */
export function calculateReadingTime(
  content?: string | null,
  fallbackTimeStr?: string
): { minutes: number; text: string; badgeText: string } {
  if (!content || !content.trim()) {
    // If a fallback string like "8 min read" was provided, parse it
    if (fallbackTimeStr) {
      const parsed = parseInt(fallbackTimeStr.replace(/\D/g, ""), 10);
      const mins = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
      return {
        minutes: mins,
        text: `${mins} min read`,
        badgeText: `⚡ ${mins} min read`,
      };
    }
    return {
      minutes: 4,
      text: "4 min read",
      badgeText: "⚡ 4 min read",
    };
  }

  // Strip code blocks, HTML tags, markdown symbols
  const clean = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*`_~\[\]()>\-+|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(/\s+/).filter((w) => w.length > 0).length;
  // Standard human adult reading speed: 200 words per minute
  const minutes = Math.max(1, Math.ceil(words / 200));

  return {
    minutes,
    text: `${minutes} min read`,
    badgeText: `⚡ ${minutes} min read`,
  };
}

/**
 * Safely retrieve saved article slugs from localStorage.
 * Handles corrupt JSON, quota errors, and private-browsing security restrictions.
 */
export function getSavedArticleSlugs(): string[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Data was corrupted or invalid type; reset safely
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Sanitize to only non-empty strings and cap maximum size
    const sanitized = parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, MAX_BOOKMARKS);

    return sanitized;
  } catch (err) {
    console.warn("[PDFSun Storage] Failed to read saved articles from localStorage:", err);
    return [];
  }
}

/**
 * Checks if a specific article slug is bookmarked.
 */
export function isArticleSaved(slug: string): boolean {
  if (!slug) return false;
  const list = getSavedArticleSlugs();
  return list.includes(slug);
}

/**
 * Toggles an article bookmark on/off and emits a sync event for real-time UI updates.
 * Returns the new saved state (true = saved, false = removed).
 */
export function toggleSavedArticle(slug: string): boolean {
  if (typeof window === "undefined" || !slug) return false;

  try {
    const current = getSavedArticleSlugs();
    const isAlreadySaved = current.includes(slug);
    let updated: string[];

    if (isAlreadySaved) {
      updated = current.filter((s) => s !== slug);
    } else {
      // Prepend so latest saved appears first
      updated = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX_BOOKMARKS);
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (writeErr) {
      console.warn("[PDFSun Storage] Quota exceeded or storage blocked, pruning oldest items:", writeErr);
      // Prune half if quota exceeded
      const pruned = updated.slice(0, Math.floor(MAX_BOOKMARKS / 2));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    }

    // Broadcast change event to keep all open components (header, article list, blog page) synced
    window.dispatchEvent(
      new CustomEvent(BOOKMARK_CHANGE_EVENT, {
        detail: { slug, isSaved: !isAlreadySaved, savedSlugs: updated },
      })
    );

    return !isAlreadySaved;
  } catch (err) {
    console.error("[PDFSun Storage] Could not toggle saved article:", err);
    return false;
  }
}

/**
 * Subscribes to bookmark change events across the application.
 */
export function onBookmarksChange(callback: (savedSlugs: string[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ savedSlugs: string[] }>;
    if (customEvent.detail?.savedSlugs) {
      callback(customEvent.detail.savedSlugs);
    } else {
      callback(getSavedArticleSlugs());
    }
  };

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getSavedArticleSlugs());
    }
  };

  window.addEventListener(BOOKMARK_CHANGE_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(BOOKMARK_CHANGE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

/**
 * Native Web Share API helper.
 * Uses navigator.share() if supported, with automatic clipboard writeText() fallback.
 */
export async function shareArticleContent(options: {
  title: string;
  text: string;
  slug: string;
  url?: string;
}): Promise<{ success: boolean; method: "native" | "clipboard" | "error"; message: string }> {
  const articleUrl = options.url || `https://pdfsun.in/blog/${options.slug}`;

  // 1. Try Native Web Share API first
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    navigator.canShare?.({ url: articleUrl }) !== false
  ) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: articleUrl,
      });
      return { success: true, method: "native", message: "Article shared successfully!" };
    } catch (err: any) {
      // User cancelled share dialog (AbortError) - don't show an error toast
      if (err?.name === "AbortError") {
        return { success: false, method: "native", message: "Share cancelled" };
      }
      // Otherwise fall through to clipboard fallback
      console.warn("[PDFSun Share] navigator.share failed, falling back to clipboard:", err);
    }
  }

  // 2. Clipboard Fallback
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(articleUrl);
      return { success: true, method: "clipboard", message: "Link copied to clipboard!" };
    } catch (clipErr) {
      console.warn("[PDFSun Share] Clipboard copy failed:", clipErr);
    }
  }

  // 3. Fallback prompt for older or restricted environments
  try {
    const input = document.createElement("input");
    input.value = articleUrl;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(input);
    if (successful) {
      return { success: true, method: "clipboard", message: "Link copied to clipboard!" };
    }
  } catch (e) {
    // Ignore
  }

  return {
    success: false,
    method: "error",
    message: "Unable to share or copy link automatically",
  };
}
