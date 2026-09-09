// PDFSun.in - Today in History & Daily Knowledge Hub Interactive App Script
// Handles Compact Strip tap/click, modal open/close, and dynamic live fetching

(function () {
  function initKnowledgeHub() {
    const compactStrip = document.querySelector("#btn-open-knowledge-hub");
    const entireStrip = document.querySelector("#knowledge-hub-compact-strip");
    const modal = document.querySelector("#knowledge-hub-modal");
    const closeBtn = document.querySelector("#btn-close-knowledge-hub");

    const datePicker = document.querySelector("#hub-date-picker");
    const countrySelect = document.querySelector("#hub-country-select");
    const langSelect = document.querySelector("#hub-language-select");

    // Set Default Today's Date
    if (datePicker && !datePicker.value) {
      datePicker.value = new Date().toISOString().split("T")[0];
    }

    function openModal() {
      if (!modal) return;
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden"; // Prevent page background scroll
      fetchAndRenderKnowledgeData();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.add("hidden");
      document.body.style.overflow = "auto";
    }

    // Open Modal Action on Tap/Click
    if (compactStrip && !compactStrip.dataset.hubBound) {
      compactStrip.dataset.hubBound = "true";
      compactStrip.addEventListener("click", (e) => {
        e.stopPropagation();
        openModal();
      });
    }

    if (entireStrip && !entireStrip.dataset.hubBound) {
      entireStrip.dataset.hubBound = "true";
      entireStrip.addEventListener("click", (e) => {
        // Only trigger if user clicked somewhere inside strip
        openModal();
      });
    }

    // Close Modal Action
    if (closeBtn && !closeBtn.dataset.hubBound) {
      closeBtn.dataset.hubBound = "true";
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeModal();
      });
    }

    if (modal && !modal.dataset.hubBound) {
      modal.dataset.hubBound = "true";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          closeModal();
        }
      });
    }

    // Auto-update content when filters change
    [datePicker, countrySelect, langSelect].forEach((element) => {
      if (element && !element.dataset.hubBound) {
        element.dataset.hubBound = "true";
        element.addEventListener("change", fetchAndRenderKnowledgeData);
      }
    });

    async function fetchAndRenderKnowledgeData() {
      const container = document.querySelector("#hub-dynamic-content");
      if (!container) return;

      container.innerHTML = `<div class="col-span-1 md:col-span-2 text-center py-16 text-gray-400 flex flex-col items-center justify-center space-y-3">
        <div class="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm font-semibold">Loading daily historical knowledge...</p>
      </div>`;

      try {
        const selectedDate = datePicker?.value || new Date().toISOString().split("T")[0];
        const selectedCountry = countrySelect?.value || "United States";
        const selectedLang = langSelect?.value || "English (US)";

        const response = await fetch("/api/get-daily-knowledge-hub", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDate,
            country: selectedCountry,
            language: selectedLang,
          }),
        });

        const result = await response.json();
        if (result.success && result.data) {
          renderCardsUI(result.data, container);
        } else {
          throw new Error(result.message || "Failed to fetch knowledge data");
        }
      } catch (error) {
        console.error("Knowledge Hub fetch error:", error);
        container.innerHTML = `<div class="col-span-1 md:col-span-2 text-center py-12 text-red-400">Unable to load data. Please try again.</div>`;
      }
    }

    function renderCardsUI(data, container) {
      if (!container || !data) return;

      container.innerHTML = `
        <!-- Governance -->
        <div id="card-governance" class="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-xs text-amber-400 font-bold mb-2">
              <span class="tracking-wider flex items-center gap-1.5">⚖️ GOVERNANCE & TREATIES</span>
              <span class="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">${data.governance?.year || "1945"}</span>
            </div>
            <h4 class="font-bold text-white text-base leading-snug">${data.governance?.title || ""}</h4>
            <p class="text-sm text-gray-400 mt-2 leading-relaxed">${data.governance?.description || ""}</p>
          </div>
          ${data.governance?.subtext ? `<p class="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">${data.governance.subtext}</p>` : ""}
        </div>

        <!-- Technology & Science -->
        <div id="card-tech" class="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-blue-500/30 transition-all flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-xs text-blue-400 font-bold mb-2">
              <span class="tracking-wider flex items-center gap-1.5">⚡ TECHNOLOGY & SCIENCE</span>
              <span class="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">${data.techScience?.year || "1982"}</span>
            </div>
            <h4 class="font-bold text-white text-base leading-snug">${data.techScience?.title || ""}</h4>
            <p class="text-sm text-gray-400 mt-2 leading-relaxed">${data.techScience?.description || ""}</p>
          </div>
          ${data.techScience?.subtext ? `<p class="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">${data.techScience.subtext}</p>` : ""}
        </div>

        <!-- Space & Aerospace -->
        <div id="card-space" class="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-purple-500/30 transition-all flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-xs text-purple-400 font-bold mb-2">
              <span class="tracking-wider flex items-center gap-1.5">🚀 SPACE & AEROSPACE</span>
              <span class="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">${data.spaceAerospace?.year || "1969"}</span>
            </div>
            <h4 class="font-bold text-white text-base leading-snug">${data.spaceAerospace?.title || ""}</h4>
            <p class="text-sm text-gray-400 mt-2 leading-relaxed">${data.spaceAerospace?.description || ""}</p>
          </div>
          ${data.spaceAerospace?.subtext ? `<p class="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">${data.spaceAerospace.subtext}</p>` : ""}
        </div>

        <!-- Science & Letters -->
        <div id="card-letters" class="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-xs text-emerald-400 font-bold mb-2">
              <span class="tracking-wider flex items-center gap-1.5">📜 SCIENCE & LETTERS</span>
              <span class="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">${data.scienceLetters?.year || "1859"}</span>
            </div>
            <h4 class="font-bold text-white text-base leading-snug">${data.scienceLetters?.title || ""}</h4>
            <p class="text-sm text-gray-400 mt-2 leading-relaxed">${data.scienceLetters?.description || ""}</p>
          </div>
          ${data.scienceLetters?.subtext ? `<p class="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">${data.scienceLetters.subtext}</p>` : ""}
        </div>

        <!-- Nobel Laureate -->
        <div id="card-nobel" class="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-yellow-500/30 transition-all flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-xs text-yellow-400 font-bold mb-2">
              <span class="tracking-wider flex items-center gap-1.5">🎖️ NOBEL LAUREATE</span>
              <span class="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">${data.nobelLaureate?.year || "1921"}</span>
            </div>
            <h4 class="font-bold text-white text-base leading-snug">${data.nobelLaureate?.title || ""}</h4>
            <p class="text-sm text-gray-400 mt-2 leading-relaxed">${data.nobelLaureate?.description || ""}</p>
          </div>
          ${data.nobelLaureate?.subtext ? `<p class="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">${data.nobelLaureate.subtext}</p>` : ""}
        </div>

        <!-- Astrophysics -->
        <div id="card-astrophysics" class="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-xs text-cyan-400 font-bold mb-2">
              <span class="tracking-wider flex items-center gap-1.5">🔭 ASTROPHYSICS</span>
              <span class="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">${data.astrophysics?.year || "2019"}</span>
            </div>
            <h4 class="font-bold text-white text-base leading-snug">${data.astrophysics?.title || ""}</h4>
            <p class="text-sm text-gray-400 mt-2 leading-relaxed">${data.astrophysics?.description || ""}</p>
          </div>
          ${data.astrophysics?.subtext ? `<p class="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">${data.astrophysics.subtext}</p>` : ""}
        </div>

        <!-- Quiz Section -->
        <div id="quiz-block" class="col-span-1 md:col-span-2 bg-[#121827] p-5 rounded-xl border border-gray-800">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span>❓</span> DAILY KNOWLEDGE CHALLENGE (QUIZ)
            </span>
          </div>
          <p class="font-bold text-white text-base mt-1 mb-3">${data.quiz?.question || "Which historical milestone took place on this date?"}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5" id="quiz-options-group">
            ${(data.quiz?.options || [
              "A) Fundamental discovery in optical physics",
              "B) First transatlantic telecommunication signal",
              "C) International treaty on outer space peaceful exploration",
              "D) Founding charter of universal human rights declaration"
            ]).map((opt, idx) => `
              <button 
                type="button" 
                onclick="window.__handleHubQuizAnswer(${idx}, this)" 
                class="quiz-btn p-3 bg-gray-800/90 hover:bg-gray-700 text-left text-xs font-medium text-gray-200 rounded-lg border border-gray-700 transition flex items-center justify-between"
              >
                <span>${opt}</span>
              </button>
            `).join("")}
          </div>
          ${data.quiz?.explanation ? `
            <div id="quiz-feedback-box" class="hidden mt-3 p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300">
              <span class="font-bold text-amber-400">Insight: </span>${data.quiz.explanation}
            </div>
          ` : ""}
        </div>

        <!-- Quote & AI Study Deep Dive -->
        <div class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div id="quote-block" class="bg-[#121827] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>💬</span> QUOTE OF THE DAY
            </span>
            <p class="italic text-sm text-gray-300 mt-2 leading-relaxed">&ldquo;${data.quote?.text || "Knowledge is the eye of desire and can become the pilot of the soul."}&rdquo;</p>
            <p class="text-xs font-semibold text-amber-400 mt-2 text-right">— ${data.quote?.author || "Historical Records"}</p>
          </div>

          <div id="deepdive-block" class="bg-blue-950/30 p-5 rounded-xl border border-blue-500/30 flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>✨</span> DEEP DIVE WITH PDFSUN AI
              </span>
              <h4 class="font-bold text-white text-sm mt-1.5">${data.deepDive?.title || "Analyze & Compile Historical Documents with PDFSun AI"}</h4>
              <p class="text-xs text-gray-300 mt-1 leading-relaxed">${data.deepDive?.description || "Upload historical manuscripts or research papers to extract key chronological events and generate study guides."}</p>
            </div>
            <a href="#all-tools" onclick="window.__closeKnowledgeHubModal && window.__closeKnowledgeHubModal()" class="mt-3 inline-flex items-center justify-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white py-2 px-3.5 rounded-lg transition">
              <span>Launch PDF Tools &amp; AI Studio</span>
              <span>→</span>
            </a>
          </div>
        </div>
      `;
    }

    // Global Quiz Handler
    window.__handleHubQuizAnswer = function (selectedIndex, btnElement) {
      const container = btnElement.closest("#quiz-block");
      if (!container || container.dataset.answered === "true") return;
      container.dataset.answered = "true";

      const allButtons = container.querySelectorAll(".quiz-btn");
      allButtons.forEach((btn, idx) => {
        if (idx === 0) {
          btn.classList.remove("bg-gray-800/90", "border-gray-700");
          btn.classList.add("bg-emerald-600/30", "border-emerald-500", "text-emerald-300");
        } else if (idx === selectedIndex) {
          btn.classList.remove("bg-gray-800/90", "border-gray-700");
          btn.classList.add("bg-rose-600/30", "border-rose-500", "text-rose-300");
        }
      });

      const feedbackBox = container.querySelector("#quiz-feedback-box");
      if (feedbackBox) {
        feedbackBox.classList.remove("hidden");
      }
    };

    window.__openKnowledgeHubModal = openModal;
    window.__closeKnowledgeHubModal = closeModal;
    window.__fetchAndRenderKnowledgeData = fetchAndRenderKnowledgeData;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initKnowledgeHub);
  } else {
    initKnowledgeHub();
  }

  window.__initKnowledgeHub = initKnowledgeHub;
})();
