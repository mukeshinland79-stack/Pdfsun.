import React, { useState } from "react";
import { X, Copy, Check, Sparkles, Download, Layers, Eye, Code, Image as ImageIcon, MousePointer } from "lucide-react";
import {
  SAAS_7_ICONS,
  AiSummarySaaSIcon,
  AiTranslateSaaSIcon,
  AiNotesSaaSIcon,
  AiFlashcardsSaaSIcon,
  AiExplainSaaSIcon,
  AiOcrSaaSIcon,
  AiResumeSaaSIcon,
  AiChatSaaSIcon,
} from "./SaaSToolIcons";
import { SaaSToolNavigationBar } from "./SaaSToolNavigationBar";
import saasAiNavMockup from "../assets/images/saas_ai_nav_mockup_1790270631465.jpg";

interface SaaSIconsShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool?: (toolSlug: string) => void;
}

export const SaaSIconsShowcaseModal: React.FC<SaaSIconsShowcaseModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [selectedSize, setSelectedSize] = useState<number>(56);
  const [activeTab, setActiveTab] = useState<"navbar" | "mockup" | "catalog" | "prompt" | "specs">("navbar");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const MASTER_VISUAL_PROMPT = `Act as a Principal UI/UX Architect and Design System Lead for PDFSun.in — an ultra-premium, privacy-first, client-side AI PDF platform ($100M+ Vercel/Stripe/Linear-level aesthetic in 2026).

Create a pristine, pixel-perfect UI mock-up of a high-conversion tool navigation bar featuring 7 distinct interactive SaaS tool cards aligned in a perfectly balanced horizontal row on a pure white (#FFFFFF) background with generous padding and optical balance.

GLOBAL DESIGN SYSTEM & VISUAL RULES:
- Cards: Soft rounded rectangular cards (18px corner radius), pure white surface with ultra-soft multi-layered ambient shadow (0px 4px 20px rgba(0,0,0,0.04)) and a crisp 1px subtle neutral border.
- Visual Hierarchy & Clarity: High-contrast, crystal-clear, intuitive vector icons designed to be instantly readable and accessible for all age groups (from kids to elderly users).
- Text & Labels: Clean modern typography (Inter/Geist font style). Exactly below each icon, display the explicit tool name in bold, highly legible text.
- Interactive Hover & Cursor Mechanics:
  * The 3rd card ("AI Notes Generator") is actively in a HOVER STATE with a sleek, modern dark mouse pointer (arrow cursor) pointing directly at it.
  * Active Hover State Visuals: The card is subtly elevated (-4px Y-axis), wrapped in a soft glowing deep purple border halo (#8B5CF6).
  * Dynamic Hover Tooltip: Floating directly beneath the hovered "AI Notes Generator" card is a sleek white floating tooltip pill with subtle drop shadow displaying the extended description: "Notes Generator Tool (Open notebook + refined pen + subtle glowing lightbulb)".

EXACT 7-CARD SEQUENTIAL LAYOUT (Left to Right):

1. AI Document Summary: Clean white multi-page document layout with crisp blue skeleton lines and soft glowing cyan/golden magic sparkle particles. Text below: "AI Document Summary".
2. AI Translate PDF: Minimalist document sheet encircled by vibrant bidirectional language arrows (A ↔ 文 style) wrapped in a translucent purple-to-indigo translation glow. Text below: "AI Translate PDF".
3. AI Notes Generator (HOVERED): Open structured notebook with subtle grid lines, a refined purple metallic pen resting diagonally, and a glowing lightbulb of insight. Text below: "AI Notes Generator".
4. AI Flashcards: Neatly stacked golden-amber cards wrapped by a smooth circular flip/refresh arrow with an emerald-to-cyan gradient edge. Text below: "AI Flashcards".
5. AI Explain PDF: Sapphire blue document outline with an integrated floating question mark seamlessly morphing into a soft glowing teal lightbulb. Text below: "AI Explain PDF".
6. AI OCR (Text Recognition PRO): Scanned document with precise cyan alignment grid lines framing a selected area, plus a high-contrast vibrant red gradient "PRO" badge with pill corners. Text below: "AI OCR (Text Recognition PRO)".
7. AI Resume Builder: Executive CV layout with a clean indigo profile silhouette icon in a top circular badge and balanced horizontal structure blocks. Text below: "AI Resume Builder".

PRODUCTION & RENDER REQUIREMENTS:
- Studio-grade lighting, immaculate vector-like clarity, perfect symmetry, 8k resolution, photorealistic web component rendering, studio UI design showcase on Dribbble/Behance style. --ar 16:9 --v 6.0 --style raw`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                PDFSun.in 2026 SaaS Tool Navigation System
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold uppercase tracking-wide">
                  Hover State + Dribbble Studio
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pixel-Perfect 7 Interactive Cards • Pure White #FFFFFF Canvas • Inter Typography • 18px Squircles
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyPrompt(MASTER_VISUAL_PROMPT, "master")}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center space-x-1.5 transition border border-purple-200 dark:border-purple-800 shadow-2xs"
            >
              {copiedId === "master" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Master Visual Prompt</span>
                  <span className="sm:hidden">Copy Prompt</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-5 sm:px-7 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("navbar")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "navbar"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <MousePointer className="w-3.5 h-3.5 text-purple-400" />
              <span>Interactive Navigation Bar (Live)</span>
            </button>
            <button
              onClick={() => setActiveTab("mockup")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "mockup"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>8K Studio UI Mockup Render</span>
            </button>
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "catalog"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Vector Icon Catalog</span>
            </button>
            <button
              onClick={() => setActiveTab("prompt")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "prompt"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Code className="w-3.5 h-3.5 text-amber-500" />
              <span>Midjourney / DALL-E Commands</span>
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "specs"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>Design Rules & Accessibility</span>
            </button>
          </div>

          {activeTab === "catalog" && (
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <span className="text-[10px] text-slate-500 uppercase px-2">Scale:</span>
              {[32, 48, 56, 72].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-2 py-0.5 rounded-md transition ${
                    selectedSize === sz
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* TAB 1: INTERACTIVE NAVIGATION BAR (LIVE) */}
          {activeTab === "navbar" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-purple-600" />
                    Interactive Component with Simulated Hover State
                  </h3>
                  <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-0.5">
                    Card 3 ("AI Notes Generator") is actively in hover state with sleek mouse cursor arrow, glowing deep purple halo (#8B5CF6), and floating white tooltip pill. Hover any card to test live transitions!
                  </p>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full bg-purple-600 text-white font-black text-[11px] uppercase tracking-wider shadow-xs">
                  2026 SaaS Interactive
                </span>
              </div>

              {/* Render the full interactive navigation bar component */}
              <div className="bg-slate-100/60 dark:bg-slate-950/40 p-3 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <SaaSToolNavigationBar
                  onSelectTool={(slug) => {
                    if (onSelectTool) {
                      onSelectTool(slug);
                      onClose();
                    }
                  }}
                />
              </div>

              {/* Architecture highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                    Interactive State Mechanics
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Simulated & Real Cursor</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Card 3 actively showcases -4px elevation, #8B5CF6 glowing halo ring, dark mouse pointer vector, and dynamic floating tooltip pill.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                    Universal Accessibility
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Kids to Elderly Legibility</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    High contrast geometry, zero confusing clutter, and explicit bold text labels below each icon ensure effortless comprehension.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                    Inter & Geist Typography
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">SaaS Precision</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    18px soft corner radiuses, subtle 1px border, and multi-layered ambient shadow (0px 4px 20px rgba(0,0,0,0.04)).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 8K STUDIO UI MOCKUP RENDER */}
          {activeTab === "mockup" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    8K Studio Photorealistic UI Mockup Render
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-conversion Dribbble/Behance showcase render generated with 2026 SaaS Level visual prompt.
                  </p>
                </div>
                <a
                  href={saasAiNavMockup}
                  download="pdfsun_saas_ai_nav_mockup_8k.jpg"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center space-x-1.5 transition hover:opacity-90 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res Mockup</span>
                </a>
              </div>

              {/* Mockup Canvas Container */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-950 flex items-center justify-center p-2 sm:p-4">
                <img
                  src={saasAiNavMockup}
                  alt="PDFSun.in 2026 SaaS AI Tool Navigation Bar Mockup"
                  className="w-full h-auto max-h-[68vh] object-contain rounded-2xl shadow-lg"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* TAB 3: VECTOR ICON CATALOG */}
          {activeTab === "catalog" && (
            <div>
              {/* 7 Horizontal Cards on Pure White Canvas with 18px corners */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
                <div className="text-center mb-6">
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    Horizontal Row Alignment (Pure White #FFFFFF Canvas)
                  </span>
                  <p className="text-xs text-slate-500 mt-2">
                    Soft rounded cards (18px corner radius), pure white surface with ultra-soft shadow (0px 4px 20px rgba(0,0,0,0.04)).
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4">
                  {SAAS_7_ICONS.map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <div key={item.id} className="flex flex-col items-center group">
                        <div
                          style={{ width: `${selectedSize + 28}px`, height: `${selectedSize + 28}px` }}
                          className="relative flex items-center justify-center bg-white rounded-[18px] border border-slate-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06),0_2px_6px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_-4px_rgba(139,92,246,0.2)] hover:border-purple-300 hover:scale-105 transition-all duration-300 overflow-hidden"
                        >
                          <IconComp size={selectedSize} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 mt-2.5 max-w-[100px] text-center leading-tight">
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SAAS_7_ICONS.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start space-x-4 hover:border-purple-300 dark:hover:border-purple-600 transition"
                    >
                      <div className="shrink-0 p-2 bg-white dark:bg-slate-900 rounded-[14px] border border-slate-200 dark:border-slate-800 shadow-xs">
                        <IconComp size={36} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {idx + 1}. {item.name}
                          </h4>
                          <button
                            onClick={() => copyPrompt(item.promptTag, item.id)}
                            className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                            title="Copy Prompt Segment"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PROMPTS & AI GENERATORS */}
          {activeTab === "prompt" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Ultimate Top-Notch Master Visual Prompt (2026 SaaS Level)
                  </h3>
                  <button
                    onClick={() => copyPrompt(MASTER_VISUAL_PROMPT, "full_prompt")}
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 transition"
                  >
                    {copiedId === "full_prompt" ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Master Visual Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-purple-100 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {MASTER_VISUAL_PROMPT}
                </pre>
              </div>

              {/* Generator Directives */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                    Midjourney v6
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Studio Parameters</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Direct copy paste: <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-[10px]">--ar 16:9 --v 6.0 --style raw</code>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                    DALL-E 3 / ChatGPT Plus
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Precision Vector Prompt</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Renders the exact 7 cards with simulated dark arrow cursor on card 3, purple glowing halo, and floating description pill.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                    Stable Diffusion XL
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Quality Tokens</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-[10px]">dribbble UI showcase, 8k resolution, vector UI component, pure white background</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SPECS & ACCESSIBILITY */}
          {activeTab === "specs" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Universal Accessibility (Kids to Elderly)
                  </h4>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>High-contrast optical balance: Bold `#0F172A` text on pure `#FFFFFF` background.</li>
                    <li>Distinct geometric identities for all 7 tools prevents cognitive confusion.</li>
                    <li>Sufficient touch and click target boundaries (minimum 148px height, 18px rounded cards).</li>
                    <li>Full keyboard accessibility with visible focus rings (`focus-visible:ring-indigo-500`).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Interactive Hover State & Cursor Mechanics
                  </h4>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>3rd Card ("AI Notes Generator") demonstrates active hover elevation (-4px Y-axis).</li>
                    <li>Glowing deep purple border halo (`#8B5CF6`, 4px spread glow).</li>
                    <li>Sleek modern dark mouse arrow cursor vector overlay pointing directly at the card.</li>
                    <li>Floating white pill tooltip beneath with detailed tool description.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex items-center justify-between text-xs text-slate-500">
          <span>Engineered exclusively for PDFSun.in • 2026 SaaS Visual Master System</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
