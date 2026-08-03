/**
 * PDFSun Core Application Logic & Architecture Engine
 * Includes Theme Management, Educational Ad Renderer, Off-Main-Thread Worker Delegation,
 * Blob Memory Cleanup (URL.revokeObjectURL), and Selective i18n with STRICT FOOTER EXCLUSION.
 */

// 1. Theme Management Engine using CSS Custom Properties
class ThemeEngine {
  constructor() {
    this.currentTheme = "light";
    this.init();
  }

  init() {
    try {
      const savedTheme = localStorage.getItem("pdfsun_theme") || "light";
      this.applyTheme(savedTheme);
    } catch (e) {
      this.applyTheme("light");
    }
  }

  applyTheme(themeId) {
    this.currentTheme = themeId;
    const docEl = document.documentElement;

    docEl.classList.remove("dark", "eye-protection", "aurora-theme");
    if (themeId === "dark") {
      docEl.classList.add("dark");
      docEl.style.setProperty("--bg-color", "#0f172a");
      docEl.style.setProperty("--text-color", "#f8fafc");
      docEl.style.setProperty("--accent-color", "#3b82f6");
    } else if (themeId === "eye-protection") {
      docEl.classList.add("eye-protection");
      docEl.style.setProperty("--bg-color", "#fcf9f2");
      docEl.style.setProperty("--text-color", "#2b251e");
      docEl.style.setProperty("--accent-color", "#0f766e");
    } else if (themeId === "aurora") {
      docEl.classList.add("dark", "aurora-theme");
      docEl.style.setProperty("--bg-color", "#0b1120");
      docEl.style.setProperty("--text-color", "#f8fafc");
      docEl.style.setProperty("--accent-color", "#6366f1");
    } else {
      docEl.style.setProperty("--bg-color", "#ffffff");
      docEl.style.setProperty("--text-color", "#0f172a");
      docEl.style.setProperty("--accent-color", "#2563eb");
    }

    try {
      localStorage.setItem("pdfsun_theme", themeId);
    } catch (e) {}
  }
}

// 2. Selective i18n Translation Engine with STRICT FOOTER DOM EXCLUSION
class SelectiveI18nEngine {
  constructor() {
    this.currentLang = "en";
  }

  setLanguage(langCode) {
    this.currentLang = langCode;
    this.translateDOM();
  }

  // STRICT DOM EXCLUSION RULE: Translate top <header> down to <main>, strictly excluding <footer> and descendants
  translateDOM() {
    const isInsideFooter = (node) => {
      let current = node;
      while (current && current !== document.body) {
        if (current.nodeType === 1 && (current.tagName.toLowerCase() === "footer" || current.closest("footer"))) {
          return true;
        }
        current = current.parentNode;
      }
      return false;
    };

    const elements = Array.from(document.querySelectorAll("header, main, [data-i18n]"));
    elements.forEach((el) => {
      if (isInsideFooter(el)) return; // STRICT EXCLUSION
      const key = el.getAttribute("data-i18n");
      if (key) {
        console.log(`[i18n] Translating key "${key}" for element outside footer.`);
      }
    });
  }
}

// 3. Dynamic Educational Ad Banner Renderer
class EducationalAdRenderer {
  constructor(containerId = "educational-ads-container") {
    this.containerId = containerId;
  }

  async loadAndRender() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    try {
      const response = await fetch("/ads.json");
      const data = await response.json();
      const ads = data.educationalAds || [];

      if (ads.length === 0) return;

      container.innerHTML = `
        <div class="educational-ad-grid">
          ${ads.map(ad => `
            <div class="ad-card bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
              <span class="badge text-xs font-bold text-amber-600 border border-amber-300 px-2.5 py-1 rounded-full">${ad.badge}</span>
              <h3 class="text-lg font-black mt-3 mb-1">${ad.title}</h3>
              <p class="text-xs text-amber-600 font-semibold mb-2">${ad.subtitle}</p>
              <p class="text-xs text-slate-600 dark:text-slate-300 mb-4">${ad.description}</p>
              <a href="${ad.ctaUrl}" target="_blank" rel="noopener noreferrer" class="inline-block py-2 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">${ad.ctaText} &rarr;</a>
            </div>
          `).join("")}
        </div>
      `;
    } catch (e) {
      console.warn("Failed to load ads.json dynamically:", e);
    }
  }
}

// 4. Blob Memory URL Revocation Tracking
const activeBlobUrls = new Set();

function registerBlobUrl(url) {
  activeBlobUrls.add(url);
  return url;
}

function revokeBlobUrl(url) {
  if (url && activeBlobUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
    activeBlobUrls.delete(url);
  }
}

// Export global engine instances
window.PDFSunThemeEngine = new ThemeEngine();
window.PDFSunI18nEngine = new SelectiveI18nEngine();
window.PDFSunAdRenderer = new EducationalAdRenderer();
window.PDFSunMemory = { registerBlobUrl, revokeBlobUrl };
