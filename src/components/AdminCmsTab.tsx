import React, { useState } from "react";
import {
  Globe,
  Edit,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  Sparkles,
  Download,
  Upload,
  Plus,
  Trash2,
  Layers,
  FileText,
} from "lucide-react";
import {
  useLanguage,
  SUPPORTED_LANGUAGES,
  IN_MEMORY_TRANSLATIONS,
  getCmsOverrides,
  saveBulkCmsOverrides,
  resetAllCmsOverrides,
} from "../lib/i18n";

export const AdminCmsTab: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  const [localOverrides, setLocalOverrides] = useState<Record<string, Record<string, string>>>(getCmsOverrides);

  const handleFieldChange = (key: string, value: string) => {
    setLocalOverrides((prev) => {
      const updated = { ...prev };
      if (!updated[selectedLanguage]) updated[selectedLanguage] = {};
      updated[selectedLanguage][key] = value;
      return updated;
    });
  };

  const handleSaveAll = () => {
    saveBulkCmsOverrides(localOverrides);
    setSaveSuccessMsg("All text changes published live to website in real time!");
    setTimeout(() => setSaveSuccessMsg(""), 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all custom text overrides back to default values?")) {
      resetAllCmsOverrides();
      setLocalOverrides({});
      setSaveSuccessMsg("All website text reset to original default strings.");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localOverrides, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pdfsun_cms_overrides_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setLocalOverrides(parsed);
          saveBulkCmsOverrides(parsed);
          setSaveSuccessMsg("CMS Overrides imported successfully and applied live!");
          setTimeout(() => setSaveSuccessMsg(""), 4000);
        } catch (err) {
          alert("Invalid JSON file format.");
        }
      };
    }
  };

  const fields = [
    // Header & Nav
    { key: "nav.home", label: "Nav: Home", category: "header", defaultValue: "Home" },
    { key: "nav.allTools", label: "Nav: All PDF Tools", category: "header", defaultValue: "All PDF Tools" },
    { key: "nav.aiSuite", label: "Nav: AI Suite Pill", category: "header", defaultValue: "AI Tools Suite" },
    { key: "nav.pricing", label: "Nav: Pricing Plans", category: "header", defaultValue: "Pricing Plans" },
    { key: "nav.brandKit", label: "Nav: Brand Kit", category: "header", defaultValue: "Brand Kit" },

    // Hero
    { key: "hero.title", label: "Hero: Main Headline", category: "hero", defaultValue: "Enterprise PDF Tools & Document Engine", isMultiLine: true },
    { key: "hero.subtitle", label: "Hero: Subheading", category: "hero", defaultValue: "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.", isMultiLine: true },
    { key: "badges.privacyTitle", label: "Hero: In-Browser Privacy Badge", category: "hero", defaultValue: "100% In-Browser Privacy" },
    { key: "badges.privacySub", label: "Hero: In-Browser Privacy Subtext", category: "hero", defaultValue: "Client-side WebAssembly processing" },
    { key: "badges.utilitiesTitle", label: "Hero: Utilities Count Badge", category: "hero", defaultValue: "57+ Pro PDF Utilities" },

    // Pricing
    { key: "pricing.badge", label: "Pricing: Section Badge", category: "pricing", defaultValue: "INSTANT UNLIMITED PDF PROCESSING" },
    { key: "pricing.title", label: "Pricing: Main Title", category: "pricing", defaultValue: "Simple, Transparent" },
    { key: "pricing.titleHighlight", label: "Pricing: Title Highlight", category: "pricing", defaultValue: "Pricing Plans" },
    { key: "pricing.subtitle", label: "Pricing: Subtitle", category: "pricing", defaultValue: "Process unlimited PDF files with 100% private WebAssembly speed. No hidden fees. First 7 Days 100% Money-Back Guarantee on all subscription plans.", isMultiLine: true },
    { key: "pricing.monthly", label: "Pricing: Monthly Billing Toggle", category: "pricing", defaultValue: "Monthly Billing" },
    { key: "pricing.yearly", label: "Pricing: Annual Billing Toggle", category: "pricing", defaultValue: "Annual Billing" },
    { key: "pricing.savePercent", label: "Pricing: Savings Pill", category: "pricing", defaultValue: "Save 40%" },

    // Formats
    { key: "formats.badge", label: "Formats: Section Badge", category: "formats", defaultValue: "Universal Document Converter" },
    { key: "formats.title", label: "Formats: Section Title", category: "formats", defaultValue: "Supported File Formats on PDFSun" },

    // FAQs
    { key: "faq.sectionBadge", label: "FAQ: Section Badge", category: "faq", defaultValue: "Security & Privacy FAQ" },
    { key: "faq.title", label: "FAQ: Section Title", category: "faq", defaultValue: "Frequently Asked Questions" },
    { key: "faq.q1", label: "FAQ Q1: Are uploaded files safe?", category: "faq", defaultValue: "Are my uploaded PDF files safe on PDFSun?", isMultiLine: true },
    { key: "faq.a1", label: "FAQ A1: Safe files answer", category: "faq", defaultValue: "Absolutely! At PDFSun, privacy is paramount. Most operations run 100% locally inside your browser via WebAssembly.", isMultiLine: true },
    { key: "faq.q2", label: "FAQ Q2: AI PDF Chat", category: "faq", defaultValue: "How does PDFSun handle AI PDF Chat, Summaries, and Explanations?", isMultiLine: true },
    { key: "faq.a2", label: "FAQ A2: AI answer", category: "faq", defaultValue: "PDFSun integrates Google Gemini 3.6 AI to analyze text extracted from your PDF securely and in memory.", isMultiLine: true },
  ];

  const getFieldValue = (key: string, fallback: string): string => {
    const override = localOverrides[selectedLanguage]?.[key] || localOverrides["all"]?.[key];
    if (override !== undefined) return override;

    const langDict = IN_MEMORY_TRANSLATIONS[selectedLanguage];
    if (langDict) {
      const getNested = (obj: any, path: string) => path.split(".").reduce((curr, part) => (curr ? curr[part] : undefined), obj);
      const val = getNested(langDict, key);
      if (typeof val === "string") return val;
    }

    return fallback;
  };

  const filteredFields = fields.filter((f) => {
    const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.defaultValue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Dynamic Website CMS &amp; Instant Translation Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Directly edit and customize any headings, FAQs, or translation strings without developer intervention.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleSaveAll}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish Changes Live</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 flex items-center space-x-2 text-xs font-bold px-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Control Bar: Language Select, Categories, Search */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-700 dark:text-slate-300">Target Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} ({l.nativeName})
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search keys or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 font-bold text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Overrides</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs font-bold scrollbar-none">
        {[
          { id: "all", label: "All Sections" },
          { id: "header", label: "Header & Nav" },
          { id: "hero", label: "Hero Section" },
          { id: "pricing", label: "Pricing Table" },
          { id: "formats", label: "Supported Formats" },
          { id: "faq", label: "FAQs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition ${
              selectedCategory === tab.id
                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Field List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFields.map((field) => {
          const currentVal = getFieldValue(field.key, field.defaultValue);
          const isOverridden = !!localOverrides[selectedLanguage]?.[field.key];

          return (
            <div
              key={field.key}
              className={`p-4 rounded-2xl border transition ${
                isOverridden
                  ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">{field.label}</span>
                <code className="text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {field.key}
                </code>
              </div>

              {field.isMultiLine ? (
                <textarea
                  rows={3}
                  value={currentVal}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
