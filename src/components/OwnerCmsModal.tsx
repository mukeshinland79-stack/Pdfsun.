import React, { useState, useMemo } from "react";
import {
  X,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  Globe,
  Sparkles,
  Download,
  Upload,
  Layers,
  HelpCircle,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  FileText,
  MessageSquare,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  useLanguage,
  SUPPORTED_LANGUAGES,
  IN_MEMORY_TRANSLATIONS,
  getCmsOverrides,
  saveBulkCmsOverrides,
  resetAllCmsOverrides,
} from "../lib/i18n";

interface OwnerCmsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CmsEditableField {
  key: string;
  label: string;
  category: "header" | "hero" | "tools" | "pricing" | "formats" | "testimonials" | "faq" | "footer";
  defaultValue: string;
  isMultiLine?: boolean;
}

const DEFAULT_EDITABLE_FIELDS: CmsEditableField[] = [
  // Header & Nav
  { key: "nav.home", label: "Nav: Home", category: "header", defaultValue: "Home" },
  { key: "nav.allTools", label: "Nav: All PDF Tools", category: "header", defaultValue: "All PDF Tools" },
  { key: "nav.aiSuite", label: "Nav: AI Tools Suite", category: "header", defaultValue: "AI Tools Suite" },
  { key: "nav.pricing", label: "Nav: Pricing Plans", category: "header", defaultValue: "Pricing Plans" },
  { key: "nav.loginRegister", label: "Nav: Login / Register", category: "header", defaultValue: "Login / Register" },
  { key: "nav.brandKit", label: "Nav: Brand Kit", category: "header", defaultValue: "Brand Kit" },
  { key: "nav.searchBtn", label: "Nav: Search Button", category: "header", defaultValue: "Search 68+ Tools" },

  // Hero
  { key: "hero.title", label: "Hero: Main Heading", category: "hero", defaultValue: "Enterprise PDF Tools & Document Engine", isMultiLine: true },
  { key: "hero.subtitle", label: "Hero: Subheading", category: "hero", defaultValue: "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.", isMultiLine: true },
  { key: "hero.chooseFiles", label: "Hero: Choose Files Button", category: "hero", defaultValue: "Choose Files from Device" },
  { key: "hero.dropzoneTitle", label: "Hero: Dropzone Title", category: "hero", defaultValue: "Drop PDF files here or click to browse" },
  { key: "hero.dropzoneSub", label: "Hero: Dropzone Subtitle", category: "hero", defaultValue: "Files stay completely on your device. Fast, safe, and private.", isMultiLine: true },
  { key: "hero.searchPlaceholder", label: "Hero: Search Placeholder", category: "hero", defaultValue: "Search 68+ PDF tools (Ctrl+K)..." },

  // Badges & Features
  { key: "badges.privacyTitle", label: "Badge: In-Browser Privacy", category: "hero", defaultValue: "100% In-Browser Privacy" },
  { key: "badges.privacySub", label: "Badge: Privacy Subtext", category: "hero", defaultValue: "Client-side WebAssembly processing" },
  { key: "badges.utilitiesTitle", label: "Badge: Utilities Count", category: "hero", defaultValue: "68+ Pro PDF Utilities" },
  { key: "badges.ultraFast", label: "Badge: Ultra Fast", category: "hero", defaultValue: "Ultra Fast Speed" },
  { key: "badges.noStorage", label: "Badge: No Storage", category: "hero", defaultValue: "No Storage Purge" },
  { key: "badges.geminiAi", label: "Badge: Gemini AI", category: "hero", defaultValue: "Gemini 3.6 AI" },

  // Supported Formats
  { key: "formats.badge", label: "Formats: Section Badge", category: "formats", defaultValue: "Universal Document Converter" },
  { key: "formats.title", label: "Formats: Section Title", category: "formats", defaultValue: "Supported File Formats on PDFSun" },
  { key: "formats.subtitle", label: "Formats: Section Subtitle", category: "formats", defaultValue: "Convert, process, and optimize documents across all major office formats, vector images, and eBook standards.", isMultiLine: true },

  // Pricing
  { key: "pricing.badge", label: "Pricing: Top Badge", category: "pricing", defaultValue: "INSTANT UNLIMITED PDF PROCESSING" },
  { key: "pricing.title", label: "Pricing: Main Title", category: "pricing", defaultValue: "Simple, Transparent" },
  { key: "pricing.titleHighlight", label: "Pricing: Title Highlight", category: "pricing", defaultValue: "Pricing Plans" },
  { key: "pricing.subtitle", label: "Pricing: Subtitle", category: "pricing", defaultValue: "Process unlimited PDF files with 100% private WebAssembly speed. No hidden fees. First 7 Days 100% Money-Back Guarantee on all subscription plans.", isMultiLine: true },
  { key: "pricing.guarantee", label: "Pricing: Guarantee Badge", category: "pricing", defaultValue: "First 7 Days 100% Money-Back Guarantee" },
  { key: "pricing.monthly", label: "Pricing: Monthly Toggle", category: "pricing", defaultValue: "Monthly Billing" },
  { key: "pricing.yearly", label: "Pricing: Annual Toggle", category: "pricing", defaultValue: "Annual Billing" },
  { key: "pricing.savePercent", label: "Pricing: Savings Pill", category: "pricing", defaultValue: "Save 40%" },
  { key: "pricing.termsTitle", label: "Pricing: Terms Title", category: "pricing", defaultValue: "Disclaimer & Refund Terms" },
  { key: "pricing.termsText", label: "Pricing: Terms Text", category: "pricing", defaultValue: "7-Day Money-Back Guarantee: Eligible first-time purchases can be refunded within 7 days if less than 30% of the included quota or credits has been used. Applicable payment gateway fees are non-refundable. Cancel your subscription anytime; access continues until the current billing period ends.", isMultiLine: true },

  // Testimonials
  { key: "testimonials.badge", label: "Testimonials: Badge", category: "testimonials", defaultValue: "Loved by 500,000+ Users" },
  { key: "testimonials.title", label: "Testimonials: Title", category: "testimonials", defaultValue: "Trusted by Students, Lawyers & Researchers" },
  { key: "testimonials.subtitle", label: "Testimonials: Subtitle", category: "testimonials", defaultValue: "See what students and industry professionals say about PDFSun efficiency, privacy, and Gemini AI capabilities.", isMultiLine: true },

  // FAQs
  { key: "faq.sectionBadge", label: "FAQ: Section Badge", category: "faq", defaultValue: "Security & Privacy FAQ" },
  { key: "faq.title", label: "FAQ: Section Title", category: "faq", defaultValue: "Frequently Asked Questions" },
  { key: "faq.subtitle", label: "FAQ: Subtitle", category: "faq", defaultValue: "Everything you need to know about PDFSun security, data privacy, and browser operations.", isMultiLine: true },
  { key: "faq.q1", label: "FAQ Q1: Files Safe?", category: "faq", defaultValue: "Are my uploaded PDF files safe on PDFSun?", isMultiLine: true },
  { key: "faq.a1", label: "FAQ A1: Files Safe Answer", category: "faq", defaultValue: "Absolutely! At PDFSun, privacy is paramount. Most operations run 100% locally inside your browser via WebAssembly.", isMultiLine: true },
  { key: "faq.q2", label: "FAQ Q2: AI Features?", category: "faq", defaultValue: "How does PDFSun handle AI PDF Chat, Summaries, and Explanations?", isMultiLine: true },
  { key: "faq.a2", label: "FAQ A2: AI Features Answer", category: "faq", defaultValue: "PDFSun integrates Google Gemini 3.6 AI to analyze text extracted from your PDF securely and in memory.", isMultiLine: true },
  { key: "faq.q3", label: "FAQ Q3: Free to use?", category: "faq", defaultValue: "Is PDFSun completely free to use?", isMultiLine: true },
  { key: "faq.a3", label: "FAQ A3: Free Answer", category: "faq", defaultValue: "Yes! PDFSun offers generous free access to all 68+ tools with zero registration required.", isMultiLine: true },
  { key: "faq.q4", label: "FAQ Q4: Offline & PWA?", category: "faq", defaultValue: "Can I use PDFSun offline or as a PWA?", isMultiLine: true },
  { key: "faq.a4", label: "FAQ A4: Offline Answer", category: "faq", defaultValue: "Yes! PDFSun is built as a Progressive Web App (PWA). All core PDF tools work even without an internet connection.", isMultiLine: true },

  // Footer & Brand
  { key: "footer.tagline", label: "Footer: Main Tagline", category: "footer", defaultValue: "PDFSun (pdfsun.in) — Your Smart Document Companion. Merge, split, compress, convert, edit, and analyze documents with cutting-edge Gemini 3.6 AI and 100% in-browser privacy.", isMultiLine: true },
  { key: "footer.brandKit", label: "Footer: Brand Kit Link", category: "footer", defaultValue: "Brand Identity Guidelines & Logo Kit" },
  { key: "footer.developedBy", label: "Footer: Developer Tag", category: "footer", defaultValue: "Architected & Engineered by" },
  { key: "footer.leadDev", label: "Footer: Lead Developer Title", category: "footer", defaultValue: "Lead Web Developer" },
];

export const OwnerCmsModal: React.FC<OwnerCmsModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage, setLanguage, saveCmsText } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");
  const [customFields, setCustomFields] = useState<CmsEditableField[]>(DEFAULT_EDITABLE_FIELDS);

  // Local draft state of overrides
  const [localOverrides, setLocalOverrides] = useState<Record<string, Record<string, string>>>(getCmsOverrides);

  // New Custom String state
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [newKeyPath, setNewKeyPath] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyCategory, setNewKeyCategory] = useState<CmsEditableField["category"]>("header");
  const [newKeyDefaultVal, setNewKeyDefaultVal] = useState("");

  if (!isOpen) return null;

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
    setSaveSuccessMsg("All changes published live to website in real time!");
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

  const handleAddCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyPath.trim()) return;

    const newField: CmsEditableField = {
      key: newKeyPath.trim(),
      label: newKeyLabel.trim() || newKeyPath.trim(),
      category: newKeyCategory,
      defaultValue: newKeyDefaultVal.trim(),
      isMultiLine: newKeyDefaultVal.length > 60,
    };

    setCustomFields((prev) => [newField, ...prev]);
    handleFieldChange(newField.key, newField.defaultValue);
    setShowAddKeyModal(false);
    setNewKeyPath("");
    setNewKeyLabel("");
    setNewKeyDefaultVal("");
  };

  const filteredFields = customFields.filter((field) => {
    const matchesCategory = selectedCategory === "all" || field.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.defaultValue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFieldValue = (key: string, fallback: string): string => {
    const override = localOverrides[selectedLanguage]?.[key] || localOverrides["all"]?.[key];
    if (override !== undefined) return override;

    // Check in-memory translations dictionary
    const langDict = IN_MEMORY_TRANSLATIONS[selectedLanguage];
    if (langDict) {
      const getNested = (obj: any, path: string) => path.split(".").reduce((curr, part) => (curr ? curr[part] : undefined), obj);
      const val = getNested(langDict, key);
      if (typeof val === "string") return val;
    }

    return fallback;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-white">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Website Content Management System (CMS)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  Owner Live Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edit any website heading, FAQs, pricing details, or translation strings with 0ms instant live sync.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveAll}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Publish Live</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-bold px-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg("")} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Toolbar: Language Switcher, Category Filters, Search, Actions */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Target Language Dropdown */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-600 dark:text-slate-300">Editing Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
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

          {/* Quick CMS Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddKeyModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
              title="Add a custom translation string or section key"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Key</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
              title="Export CMS overrides as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              title="Import CMS JSON file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={handleResetDefaults}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 font-bold text-xs transition"
              title="Reset all edits to original defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Section Category Tabs */}
        <div className="flex items-center space-x-2 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-bold scrollbar-none">
          {[
            { id: "all", label: "All Sections" },
            { id: "header", label: "Header & Nav" },
            { id: "hero", label: "Hero & Dropzone" },
            { id: "pricing", label: "Pricing & Plans" },
            { id: "formats", label: "Supported Formats" },
            { id: "testimonials", label: "Testimonials" },
            { id: "faq", label: "Security & FAQs" },
            { id: "footer", label: "Footer & Legal" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                selectedCategory === tab.id
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Editable Fields Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {filteredFields.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-500" />
              <p className="font-bold">No matching content fields found.</p>
              <p className="text-xs">Try searching for a different keyword or category.</p>
            </div>
          ) : (
            filteredFields.map((field) => {
              const currentVal = getFieldValue(field.key, field.defaultValue);
              const isOverridden = !!localOverrides[selectedLanguage]?.[field.key];

              return (
                <div
                  key={field.key}
                  className={`p-4 rounded-2xl border transition ${
                    isOverridden
                      ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-xs"
                      : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{field.label}</span>
                      <code className="text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {field.key}
                      </code>
                    </div>

                    {isOverridden && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Sparkles className="w-3 h-3" />
                        <span>Live Custom Value</span>
                      </span>
                    )}
                  </div>

                  {field.isMultiLine ? (
                    <textarea
                      rows={3}
                      value={currentVal}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-amber-500 transition"
                      placeholder={`Default: ${field.defaultValue}`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500 transition font-medium"
                      placeholder={`Default: ${field.defaultValue}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Target: <strong>{SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Publish Live Changes</span>
            </button>
          </div>
        </div>

        {/* Add Custom Key Sub-Modal */}
        {showAddKeyModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAddCustomKey}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Add Custom CMS Field</h3>
                <button type="button" onClick={() => setShowAddKeyModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Translation Key Path (e.g. faq.q6 or hero.customTag)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. faq.q6"
                  value={newKeyPath}
                  onChange={(e) => setNewKeyPath(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Label / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAQ Q6: High Volume Batching"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Section Category</label>
                <select
                  value={newKeyCategory}
                  onChange={(e) => setNewKeyCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 font-bold"
                >
                  <option value="header">Header &amp; Nav</option>
                  <option value="hero">Hero &amp; Dropzone</option>
                  <option value="pricing">Pricing Plans</option>
                  <option value="formats">Supported Formats</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="faq">FAQs</option>
                  <option value="footer">Footer &amp; Legal</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Default Value Text</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter text value..."
                  value={newKeyDefaultVal}
                  onChange={(e) => setNewKeyDefaultVal(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKeyModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
