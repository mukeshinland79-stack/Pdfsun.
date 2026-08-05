import React, { useState, useEffect } from "react";
import {
  Sun,
  Share2,
  Combine,
  Scissors,
  Minimize2,
  FileText,
  FileType,
  Image,
  FileImage,
  ScanText,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  Zap,
  X,
  Sparkles,
  Settings,
} from "lucide-react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";
import { QuickShareModal } from "./QuickShareModal";

interface QuickActionsSidebarProps {
  onSelectTool: (tool: ToolItem) => void;
  activeTool?: ToolItem | null;
}

export const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({
  onSelectTool,
  activeTool = null,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Monitor window scroll to reveal Back to Top helper button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Primary tools required by quick actions in exact priority order:
  // 1. Quick Share (NEW)
  // 2. Merge PDF (MOST POPULAR)
  // 3. Split PDF (FAST)
  // 4. Compress PDF (ESSENTIAL)
  // 5. PDF to Word
  // 6. Word to PDF / System Options
  // 7. JPG to PDF
  // 8. OCR PDF (AI)
  const popupMenuItems = [
    {
      id: "quick-share",
      name: "Quick Share",
      badge: "NEW",
      badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      icon: Share2,
      color: "from-amber-400 to-amber-500",
      action: "share",
      slug: "share-pdfsun",
    },
    {
      id: "merge-pdf",
      name: "Merge PDF",
      badge: "MOST POPULAR",
      badgeBg: "bg-orange-500/20 text-orange-400 border-orange-500/40",
      icon: Combine,
      color: "from-orange-500 to-amber-500",
      action: "tool",
      slug: "merge-pdf",
    },
    {
      id: "split-pdf",
      name: "Split PDF",
      badge: "FAST",
      badgeBg: "bg-sky-500/20 text-sky-400 border-sky-500/40",
      icon: Scissors,
      color: "from-blue-500 to-indigo-500",
      action: "tool",
      slug: "split-pdf",
    },
    {
      id: "compress-pdf",
      name: "Compress PDF",
      badge: "ESSENTIAL",
      badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      icon: Minimize2,
      color: "from-purple-500 to-indigo-500",
      action: "tool",
      slug: "compress-pdf",
    },
    {
      id: "pdf-to-word",
      name: "PDF to Word",
      badge: null,
      icon: FileText,
      color: "from-sky-500 to-cyan-500",
      action: "tool",
      slug: "pdf-to-word",
    },
    {
      id: "word-to-pdf",
      name: "System Options",
      badge: null,
      icon: Settings,
      color: "from-slate-500 to-slate-700",
      action: "tool",
      slug: "word-to-pdf",
    },
    {
      id: "jpg-to-pdf",
      name: "JPG to PDF",
      badge: null,
      icon: Image,
      color: "from-rose-500 to-red-500",
      action: "tool",
      slug: "jpg-to-pdf",
    },
    {
      id: "ai-ocr",
      name: "OCR PDF",
      badge: "AI",
      badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      icon: ScanText,
      color: "from-indigo-500 to-purple-500",
      action: "tool",
      slug: "ai-ocr",
    },
  ];

  const handleItemClick = (item: (typeof popupMenuItems)[0]) => {
    if (item.action === "share") {
      setShowShareModal(true);
      setIsPopupOpen(false);
      return;
    }

    const foundTool = ALL_TOOLS.find((t) => t.slug === item.slug || t.id === item.slug);
    if (foundTool) {
      onSelectTool(foundTool);
      setIsPopupOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* 1. Floating Sun Trigger Icon (Bottom Right: 24px bottom, 24px right) */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end space-y-3 pointer-events-auto">
        {/* Scroll To Top helper bubble if user scrolled down */}
        {showScrollTop && !isPopupOpen && (
          <button
            onClick={scrollToTop}
            title="Scroll to Top"
            className="w-10 h-10 rounded-full bg-slate-900/90 text-amber-400 border border-amber-500/40 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-md"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Sun Trigger Icon Button */}
        <button
          onClick={() => setIsPopupOpen(!isPopupOpen)}
          aria-label="Toggle PDF Sun Quick Actions"
          title="PDF Sun Quick Actions Menu"
          className={`relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 p-0.5 flex items-center justify-center transition-all duration-300 active:scale-95 sun-breathe-glow ${
            isPopupOpen ? "rotate-90 scale-105" : "hover:scale-110"
          }`}
        >
          {/* Inner Rotating Rays Background */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-300 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] animate-pulse" />
            {isPopupOpen ? (
              <X className="w-7 h-7 text-slate-950 font-black stroke-[3] relative z-10" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Sun className="w-8 h-8 text-slate-950 font-black stroke-[2.5] animate-[spin_12s_linear_infinite]" />
                <Sparkles className="w-4 h-4 text-slate-950 absolute -top-1 -right-1 animate-bounce" />
              </div>
            )}
          </div>

          {/* Active Badge Dot */}
          {!isPopupOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-slate-900"></span>
            </span>
          )}
        </button>
      </div>

      {/* 2. Glassmorphic Quick Actions Popup Menu */}
      {isPopupOpen && (
        <>
          {/* Backdrop blur click target */}
          <div
            className="fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPopupOpen(false)}
          />

          {/* Popup Container */}
          <div
            role="dialog"
            aria-label="PDF Sun Quick Actions"
            className="fixed bottom-24 right-4 sm:right-6 z-[9999] w-[92vw] max-w-xs sm:w-88 bg-[#0f172a]/95 backdrop-blur-xl border border-amber-400/40 rounded-3xl shadow-2xl shadow-amber-500/10 p-4 text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300 overflow-hidden"
            style={{
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.25)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-400/20">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Sun className="w-4 h-4 text-slate-950 stroke-[3]" />
                </div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                  ☀️ PDF SUN QUICK ACTIONS
                </span>
              </div>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="p-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                title="Close Quick Actions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
              {popupMenuItems.map((item) => {
                const IconComponent = item.icon;
                const foundTool = ALL_TOOLS.find((t) => t.slug === item.slug || t.id === item.slug);
                const isActive = activeTool && foundTool && activeTool.id === foundTool.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 text-left group border ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-amber-400/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                        : "bg-slate-900/60 hover:bg-white/15 border-slate-800 hover:border-amber-400/60 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] text-slate-200 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Gradient Icon Badge */}
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-slate-950 font-black shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                      >
                        <IconComponent className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-extrabold truncate tracking-wide">
                        {item.name}
                      </span>
                    </div>

                    {/* Badge */}
                    {item.badge && (
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.badgeBg || "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        } ml-2 shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer info banner */}
            <div className="mt-3 pt-2.5 border-t border-amber-400/20 text-center">
              <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center space-x-1">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Instant High-Speed PDF Tools & AI Engine</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Quick Share Modal when triggered from Quick Actions */}
      {showShareModal && (
        <QuickShareModal
          fileName="PDFSun Enterprise Suite"
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};
