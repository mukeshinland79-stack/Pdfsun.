import React, { useState, useEffect } from "react";
import {
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
} from "lucide-react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

interface QuickActionsSidebarProps {
  onSelectTool: (tool: ToolItem) => void;
  activeTool?: ToolItem | null;
}

export const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({
  onSelectTool,
  activeTool = null,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Monitor window scroll to reveal Back to Top helper button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Primary tools required by quick actions in exact priority order:
  // 1. Share PDFSun (NEW)
  // 2. Merge PDF
  // 3. Split PDF
  // 4. Compress PDF
  // 5. PDF to Word
  // 6. Word to PDF
  // 7. JPG to PDF
  // 8. PDF to JPG
  // 9. OCR PDF
  const primaryToolSlugs = [
    { slug: "share-pdfsun", name: "Share PDFSun", defaultIcon: Share2, color: "from-amber-400 to-orange-500", badge: "⭐ NEW" },
    { slug: "merge-pdf", name: "Merge PDF", defaultIcon: Combine, color: "from-orange-500 to-amber-500", badge: "POPULAR" },
    { slug: "split-pdf", name: "Split PDF", defaultIcon: Scissors, color: "from-blue-500 to-indigo-500", badge: "FAST" },
    { slug: "compress-pdf", name: "Compress PDF", defaultIcon: Minimize2, color: "from-emerald-500 to-teal-500", badge: "ESSENTIAL" },
    { slug: "pdf-to-word", name: "PDF to Word", defaultIcon: FileText, color: "from-sky-500 to-cyan-500", badge: null },
    { slug: "word-to-pdf", name: "Word to PDF", defaultIcon: FileType, color: "from-purple-500 to-pink-500", badge: null },
    { slug: "jpg-to-pdf", name: "JPG to PDF", defaultIcon: Image, color: "from-rose-500 to-red-500", badge: null },
    { slug: "pdf-to-jpg", name: "PDF to JPG", defaultIcon: FileImage, color: "from-teal-500 to-emerald-500", badge: null },
    { slug: "ai-ocr", name: "OCR PDF", defaultIcon: ScanText, color: "from-indigo-500 to-purple-500", badge: "AI" },
  ];

  // Resolve tools from dataset
  const quickTools = primaryToolSlugs
    .map((item) => {
      const found = ALL_TOOLS.find((t) => t.slug === item.slug || t.id === item.slug);
      return {
        ...item,
        toolObj: found || null,
      };
    })
    .filter((item) => item.toolObj !== null);

  const handleToolClick = (toolObj: ToolItem) => {
    onSelectTool(toolObj);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside
      aria-label="Quick Actions Sidebar"
      className={`fixed right-3 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-in-out hidden md:block ${
        isExpanded ? "w-48" : "w-14"
      }`}
    >
      <div className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/60 dark:border-slate-800 rounded-2xl shadow-2xl p-2 relative text-slate-100 group">
        {/* Header / Collapse Toggle */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
          {isExpanded ? (
            <div className="flex items-center space-x-1.5 overflow-hidden">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 truncate">
                Quick Actions
              </span>
            </div>
          ) : (
            <div className="mx-auto" title="Quick Actions">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Tool Buttons List */}
        <div className="space-y-1.5">
          {quickTools.map((item) => {
            if (!item.toolObj) return null;
            const IconComponent = item.defaultIcon;
            const isActive = activeTool?.id === item.toolObj.id;

            return (
              <button
                key={item.slug}
                onClick={() => item.toolObj && handleToolClick(item.toolObj)}
                title={`${item.toolObj.name} - ${item.toolObj.description}`}
                className={`w-full flex items-center p-2 rounded-xl transition-all duration-200 text-left relative overflow-hidden group/btn ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/50 text-orange-400 shadow-sm"
                    : "hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent"
                }`}
              >
                {/* Icon Container with Gradient Accent */}
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${item.color} flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-xs group-hover/btn:scale-105 transition-transform`}
                >
                  <IconComponent className="w-4 h-4 stroke-[2.5]" />
                </div>

                {/* Expanded Label & Badges */}
                {isExpanded && (
                  <div className="ml-2.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-1 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tooltip for collapsed mode */}
                {!isExpanded && (
                  <div className="absolute right-full mr-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-md shadow-lg opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-700">
                    {item.toolObj.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Back To Top Action */}
        {showScrollTop && (
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              onClick={scrollToTop}
              title="Scroll to Top"
              className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors text-xs font-bold space-x-1.5"
            >
              <ArrowUp className="w-4 h-4" />
              {isExpanded && <span>Top</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
