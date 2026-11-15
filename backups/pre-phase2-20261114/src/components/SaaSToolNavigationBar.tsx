import React, { useState } from "react";
import {
  AiSummarySaaSIcon,
  AiTranslateSaaSIcon,
  AiNotesSaaSIcon,
  AiFlashcardsSaaSIcon,
  AiExplainSaaSIcon,
  AiOcrSaaSIcon,
  AiResumeSaaSIcon,
} from "./SaaSToolIcons";

export interface SaaSToolNavigationBarProps {
  onSelectTool?: (toolSlug: string) => void;
  className?: string;
  defaultHoveredId?: string;
}

export const SAAS_NAV_ITEMS = [
  {
    id: "summary",
    slug: "ai-summary",
    name: "AI Document Summary",
    shortName: "Document Summary",
    icon: AiSummarySaaSIcon,
    tooltip: "Document Summary Tool (Clean multi-page layout + crisp skeleton lines + golden/cyan magic sparkles)",
    color: "#4F46E5",
    glowColor: "rgba(79, 70, 229, 0.2)",
  },
  {
    id: "translate",
    slug: "ai-translate",
    name: "AI Translate PDF",
    shortName: "Translate PDF",
    icon: AiTranslateSaaSIcon,
    tooltip: "Translate Tool (Minimalist document sheet + bidirectional language arrows + purple translation glow)",
    color: "#7C3AED",
    glowColor: "rgba(124, 58, 237, 0.2)",
  },
  {
    id: "notes",
    slug: "ai-notes",
    name: "AI Notes Generator",
    shortName: "Notes Generator",
    icon: AiNotesSaaSIcon,
    tooltip: "Notes Generator Tool (Open notebook + refined pen + subtle glowing lightbulb)",
    color: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.3)",
  },
  {
    id: "flashcards",
    slug: "ai-flashcards",
    name: "AI Flashcards",
    shortName: "Flashcards",
    icon: AiFlashcardsSaaSIcon,
    tooltip: "Flashcards Tool (Stacked golden-amber cards + circular flip arrow + emerald-to-cyan edge)",
    color: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.2)",
  },
  {
    id: "explain",
    slug: "ai-explain",
    name: "AI Explain PDF",
    shortName: "Explain PDF",
    icon: AiExplainSaaSIcon,
    tooltip: "Explain Tool (Sapphire blue document outline + floating question mark morphing into teal bulb)",
    color: "#2563EB",
    glowColor: "rgba(37, 99, 235, 0.2)",
  },
  {
    id: "ocr",
    slug: "ocr-pdf",
    name: "AI OCR (Text Recognition PRO)",
    shortName: "OCR Recognition PRO",
    icon: AiOcrSaaSIcon,
    tooltip: "OCR PRO Tool (Scanned sheet + precise cyan grid reticle + vibrant red PRO pill badge)",
    color: "#0D9488",
    glowColor: "rgba(13, 148, 136, 0.2)",
  },
  {
    id: "resume",
    slug: "ai-resume-builder",
    name: "AI Resume Builder",
    shortName: "Resume Builder",
    icon: AiResumeSaaSIcon,
    tooltip: "Resume Builder Tool (Executive CV layout + profile avatar badge + balanced structure blocks)",
    color: "#6D28D9",
    glowColor: "rgba(109, 40, 217, 0.2)",
  },
];

/**
 * High-Conversion 2026 SaaS Tool Navigation Bar
 * Aligns 7 distinct interactive SaaS tool cards in a perfectly balanced horizontal row.
 * Includes interactive hover state, sleek dark mouse cursor, halo glow, and floating tooltip pill.
 */
export const SaaSToolNavigationBar: React.FC<SaaSToolNavigationBarProps> = ({
  onSelectTool,
  className = "",
  defaultHoveredId = "notes",
}) => {
  // Default hovered card is card 3 ("notes" / "AI Notes Generator")
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(defaultHoveredId);
  const [isSimulatedCursorActive, setIsSimulatedCursorActive] = useState<boolean>(true);

  const activeItem = SAAS_NAV_ITEMS.find((item) => item.id === hoveredCardId);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Pure White Background Container with Generous Padding & Ambient Shadow */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[24px] p-4 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-[0px_4px_24px_rgba(0,0,0,0.04)] overflow-visible">
        
        {/* Horizontal Row of 7 Cards with Scroll-Safe Container on Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-5 items-stretch relative">
          {SAAS_NAV_ITEMS.map((item) => {
            const isHovered = hoveredCardId === item.id;
            const IconComponent = item.icon;
            const isNotesGenerator = item.id === "notes";

            return (
              <div
                key={item.id}
                className="relative flex flex-col items-center group"
                onMouseEnter={() => {
                  setHoveredCardId(item.id);
                  // If user manually interacts, adapt simulated cursor behavior
                  setIsSimulatedCursorActive(true);
                }}
                onMouseLeave={() => {
                  // Keep default to 'notes' or release
                  setHoveredCardId(defaultHoveredId);
                }}
              >
                {/* 18px Corner Radius Card */}
                <button
                  type="button"
                  onClick={() => onSelectTool?.(item.slug)}
                  className={`w-full h-full min-h-[148px] rounded-[18px] p-3.5 sm:p-4 flex flex-col items-center justify-between text-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 relative select-none ${
                    isHovered
                      ? "bg-white dark:bg-slate-800 -translate-y-1 z-20"
                      : "bg-[#FFFFFF] dark:bg-slate-800/80 hover:bg-white border border-slate-200/80 dark:border-slate-700/80 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
                  }`}
                  style={
                    isHovered
                      ? {
                          borderColor: item.color,
                          boxShadow: `0 12px 28px -4px ${item.glowColor}, 0 4px 12px rgba(0,0,0,0.05)`,
                          borderWidth: "1.5px",
                        }
                      : {}
                  }
                  aria-label={`${item.name} - Click to launch`}
                >
                  {/* Subtle Inner Optical Depth Glow */}
                  <div className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-white via-transparent to-slate-50/50 pointer-events-none" />

                  {/* Icon Container (64x64 Box) */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
                      isHovered ? "scale-110 drop-shadow-md" : "group-hover:scale-105"
                    }`}
                  >
                    <IconComponent size={44} />
                  </div>

                  {/* High-Contrast Bold Tool Label (Inter / Geist typography) */}
                  <div className="mt-2.5 w-full">
                    <span
                      className={`block text-xs font-bold tracking-tight transition-colors duration-200 ${
                        isHovered
                          ? "text-slate-950 dark:text-white font-extrabold"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  {/* Interactive Status Indicator on Hover */}
                  {isHovered && (
                    <span
                      className="absolute top-2 right-2 w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </button>

                {/* Sleek Modern Dark Mouse Pointer (Arrow Cursor) on Hovered Card */}
                {isHovered && isSimulatedCursorActive && (
                  <div className="absolute -top-3.5 -right-2 z-30 pointer-events-none animate-bounce duration-1000">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
                    >
                      {/* Dark Cursor Vector with Crisp White Border */}
                      <path
                        d="M3 3L10.5 21L13.8 13.8L21 10.5L3 3Z"
                        fill="#0F172A"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Floating Hover Tooltip Pill (Floating directly beneath the hovered card) */}
        {activeItem && (
          <div className="mt-5 flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative inline-flex items-center space-x-2.5 px-4 sm:px-6 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-[0_8px_24px_rgba(0,0,0,0.08)] text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-semibold backdrop-blur-md">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: activeItem.color }}
              />
              <span className="font-extrabold text-slate-900 dark:text-white">
                {activeItem.shortName}:
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {activeItem.tooltip}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
