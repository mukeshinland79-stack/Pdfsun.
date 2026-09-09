/**
 * PDFSun.in - Today in History & Daily Knowledge Hub Real-Time Sync Engine
 * Listens to Date, Country, and Language dropdown changes and updates all 9 knowledge blocks
 */
(function () {
  function initKnowledgeHubSync() {
    const hubSection = document.querySelector("#today-in-history-hub");
    if (!hubSection) return;

    // Avoid duplicate initialization
    if (hubSection.getAttribute("data-sync-initialized") === "true") return;
    hubSection.setAttribute("data-sync-initialized", "true");

    const datePicker = hubSection.querySelector("#hub-date-picker");
    const countryPicker = hubSection.querySelector("#hub-country-picker");
    const langPicker = hubSection.querySelector("#hub-lang-picker");

    [datePicker, countryPicker, langPicker].forEach((input) => {
      if (input) {
        input.addEventListener("change", () => updateKnowledgeHubContent());
      }
    });

    async function updateKnowledgeHubContent() {
      const selectedDate = datePicker?.value || new Date().toISOString().split("T")[0];
      const selectedCountry = countryPicker?.value || "United States";
      const selectedLang = langPicker?.value || "English (US)";

      toggleCardLoaders(true);

      try {
        const res = await fetch("/api/knowledge-hub/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDate,
            country: selectedCountry,
            language: selectedLang,
          }),
        });

        const result = await res.json();
        if (result.success && result.data) {
          renderHubData(result.data);
        }
      } catch (err) {
        console.warn("Failed to sync hub content via vanilla sync script:", err);
      } finally {
        toggleCardLoaders(false);
      }
    }

    function renderHubData(data) {
      // 1. Governance & Treaties
      updateBlock("#card-governance", data.governance);

      // 2. Tech & Science
      updateBlock("#card-tech", data.techScience);

      // 3. Space & Aerospace
      updateBlock("#card-space", data.spaceAerospace);

      // 4. Science & Letters
      updateBlock("#card-letters", data.scienceLetters);

      // 5. Nobel Laureate
      updateBlock("#card-nobel", data.nobelLaureate);

      // 6. Astrophysics
      updateBlock("#card-astrophysics", data.astrophysics);

      // 7. Quiz Update
      if (data.quiz) {
        const quizContainer = hubSection.querySelector("#quiz-question-text");
        if (quizContainer) quizContainer.textContent = data.quiz.question;

        const options = hubSection.querySelectorAll(".quiz-option-btn");
        options.forEach((btn, idx) => {
          if (data.quiz.options && data.quiz.options[idx]) {
            btn.textContent = data.quiz.options[idx];
          }
        });
      }

      // 8. Quote of the Day
      if (data.quote) {
        const quoteText = hubSection.querySelector("#quote-text");
        const quoteAuthor = hubSection.querySelector("#quote-author");
        if (quoteText) quoteText.textContent = `"${data.quote.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${data.quote.author}`;
      }

      // 9. Deep Dive with PDFSun AI
      if (data.deepDive) {
        const ddTitle = hubSection.querySelector("#deepdive-title");
        const ddDesc = hubSection.querySelector("#deepdive-desc");
        if (ddTitle) ddTitle.textContent = data.deepDive.title;
        if (ddDesc) ddDesc.textContent = data.deepDive.description;
      }
    }

    function updateBlock(cardId, item) {
      if (!item) return;
      const block = hubSection.querySelector(cardId);
      if (!block) return;

      const yearBadge = block.querySelector(".block-year");
      const titleElem = block.querySelector(".block-title");
      const descElem = block.querySelector(".block-desc");
      const subtextElem = block.querySelector(".block-subtext");

      if (yearBadge && item.year) yearBadge.textContent = item.year;
      if (titleElem && item.title) titleElem.textContent = item.title;
      if (descElem && item.description) descElem.textContent = item.description;
      if (subtextElem && item.subtext) subtextElem.textContent = item.subtext;
    }

    function toggleCardLoaders(isLoading) {
      const blocks = hubSection.querySelectorAll(".hub-card-item");
      blocks.forEach((card) => {
        if (isLoading) card.classList.add("opacity-50", "pointer-events-none");
        else card.classList.remove("opacity-50", "pointer-events-none");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initKnowledgeHubSync);
  } else {
    initKnowledgeHubSync();
  }

  // Also expose globally for manual re-sync if needed
  window.__initKnowledgeHubSync = initKnowledgeHubSync;
})();
