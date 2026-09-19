import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  Home,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  Shield,
  GraduationCap,
  Flame,
  Wrench,
  Search,
  X,
  CreditCard,
  BookOpen,
} from "lucide-react";
import { CategoryId, ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

export interface BreadcrumbItem {
  name: string;
  url: string;
  isCurrent?: boolean;
}

export interface BreadcrumbNavProps {
  selectedCategory?: CategoryId;
  onSelectCategory?: (category: CategoryId) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onGoHome?: () => void;
  onSelectTool?: (tool: ToolItem) => void;
  onOpenPricing?: () => void;
  onOpenBlog?: () => void;
  activeTool?: ToolItem | null;
  baseUrl?: string;
  className?: string;
}

const SITE_URL = "https://pdfsun.in";

const CATEGORY_META: Record<CategoryId, { name: string; icon: React.FC<{ className?: string }> }> = {
  all: { name: "All Tools", icon: Layers },
  convert: { name: "Convert PDF", icon: RefreshCw },
  edit: { name: "Edit & Annotate", icon: Sliders },
  security: { name: "Security & Privacy", icon: Shield },
  ai: { name: "AI PDF Tools", icon: Sparkles },
  advanced: { name: "Image & Utilities", icon: Wrench },
  student: { name: "Student Essentials", icon: GraduationCap },
  popular: { name: "Most Popular", icon: Flame },
};

/**
 * Format path slug into a human-readable title case,
 * matching known tools from ALL_TOOLS for accurate nomenclature.
 */
export const formatSlugToTitle = (slug: string): string => {
  const cleanSlug = slug.toLowerCase().replace(/^\/+|\/+$/g, "");
  const matched = ALL_TOOLS.find(
    (t) => t.id.toLowerCase() === cleanSlug || t.slug.toLowerCase() === cleanSlug
  );
  if (matched) return matched.name;

  return cleanSlug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function BreadcrumbNav({
  selectedCategory = "all",
  onSelectCategory,
  searchQuery = "",
  onClearSearch,
  onGoHome,
  onSelectTool,
  onOpenPricing,
  onOpenBlog,
  activeTool = null,
  baseUrl = SITE_URL,
  className = "",
}: BreadcrumbNavProps) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== "undefined" ? window.location.pathname : "/";
  });

  // Track browser navigation popstate
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Compute dynamic active tool from prop or route pathname
  const effectiveActiveTool = useMemo(() => {
    if (activeTool) return activeTool;

    const pathSegments = currentPath.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0].toLowerCase();
      // Ignore known non-tool paths
      if (!["blog", "pricing", "install", "today-in-history"].includes(firstSegment)) {
        const found = ALL_TOOLS.find(
          (t) => t.id.toLowerCase() === firstSegment || t.slug.toLowerCase() === firstSegment
        );
        if (found) return found;
      }
    }
    return null;
  }, [activeTool, currentPath]);

  // Construct dynamic breadcrumb hierarchy
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { name: "Home", url: "/" },
      { name: "PDF Tools", url: "/#tools" },
    ];

    if (effectiveActiveTool) {
      items.push({
        name: effectiveActiveTool.name,
        url: `/${effectiveActiveTool.slug}`,
        isCurrent: true,
      });
    } else if (selectedCategory && selectedCategory !== "all") {
      const catInfo = CATEGORY_META[selectedCategory] || { name: selectedCategory };
      items.push({
        name: catInfo.name,
        url: `/#tools?category=${selectedCategory}`,
        isCurrent: !searchQuery.trim(),
      });
    }

    if (searchQuery.trim()) {
      items.push({
        name: `Filter: "${searchQuery.trim()}"`,
        url: `/#tools?q=${encodeURIComponent(searchQuery.trim())}`,
        isCurrent: true,
      });
    }

    // If still just Home and PDF Tools on homepage, mark PDF Tools as current
    if (items.length === 2 && currentPath === "/") {
      items[1].isCurrent = true;
    }

    return items;
  }, [effectiveActiveTool, selectedCategory, searchQuery, currentPath]);

  // Schema.org JSON-LD BreadcrumbList Construction
  const schemaData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, index) => {
        const absoluteUrl = item.url.startsWith("http")
          ? item.url
          : `${baseUrl}${item.url === "/" ? "/" : item.url.startsWith("/") ? item.url : "/" + item.url}`;

        return {
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteUrl,
        };
      }),
    };
  }, [breadcrumbItems, baseUrl]);

  // Fast shortcut tools
  const mergeTool = ALL_TOOLS.find((t) => t.id === "merge-pdf");
  const compressTool = ALL_TOOLS.find((t) => t.id === "compress-pdf");

  return (
    <>
      {/* 1. Schema.org Structured Data (BreadcrumbList) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* 2. Framer Motion Animated Navigation Bar */}
      <motion.nav
        aria-label="Breadcrumb"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1 ${className}`}
      >
        <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm backdrop-blur-sm shadow-xs transition-colors">
          {/* Semantic Microdata Breadcrumb Hierarchy */}
          <ol
            itemScope
            itemType="https://schema.org/BreadcrumbList"
            className="flex items-center flex-wrap gap-1 sm:gap-2 text-slate-600 dark:text-slate-300 font-medium"
          >
            {breadcrumbItems.map((item, index) => {
              const isLast = item.isCurrent || index === breadcrumbItems.length - 1;
              const isFirst = index === 0;

              return (
                <li
                  key={item.url + index}
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                  className="inline-flex items-center"
                >
                  {index > 0 && (
                    <ChevronRight
                      className="w-3.5 h-3.5 mx-1 text-slate-400 dark:text-slate-600 shrink-0 select-none"
                      aria-hidden="true"
                    />
                  )}

                  {/* 3. Dynamic Active Tool vs Ancestor Links */}
                  {isLast ? (
                    <span
                      itemProp="name"
                      aria-current="page"
                      className="inline-flex items-center font-bold text-slate-900 dark:text-slate-100 px-1 py-0.5"
                    >
                      {item.name}
                      <meta
                        itemProp="position"
                        content={String(index + 1)}
                      />
                      <link
                        itemProp="item"
                        href={item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`}
                      />
                    </span>
                  ) : (
                    <a
                      itemProp="item"
                      href={item.url}
                      onClick={(e) => {
                        if (isFirst && onGoHome) {
                          e.preventDefault();
                          onGoHome();
                        } else if (item.url.includes("#tools")) {
                          e.preventDefault();
                          onSelectCategory?.("all");
                          if (onClearSearch) onClearSearch();
                          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-150 rounded px-1 py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                    >
                      {isFirst && (
                        <Home className="w-3.5 h-3.5 mr-1 text-orange-500 shrink-0" aria-hidden="true" />
                      )}
                      {index === 1 && (
                        <Layers className="w-3.5 h-3.5 mr-1 text-blue-500 shrink-0" aria-hidden="true" />
                      )}
                      <span itemProp="name">{item.name}</span>
                      <meta
                        itemProp="position"
                        content={String(index + 1)}
                      />
                    </a>
                  )}
                </li>
              );
            })}

            {/* Clear Filter Button if search query active */}
            {searchQuery.trim() && onClearSearch && (
              <li className="inline-flex items-center">
                <button
                  type="button"
                  onClick={onClearSearch}
                  aria-label="Clear tool search filter"
                  className="ml-1 p-0.5 text-slate-400 hover:text-red-500 rounded-full focus:outline-none"
                  title="Clear search query"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            )}
          </ol>

          {/* Quick Jump Shortcuts for Internal Linking Equity */}
          <div
            aria-label="Quick Navigation Links"
            className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium"
          >
            <span className="hidden xl:inline text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Quick Jump:
            </span>

            {mergeTool && (
              <button
                type="button"
                onClick={() => onSelectTool?.(mergeTool)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-2xs cursor-pointer"
                title="Open Merge PDF Tool"
              >
                <span>Merge</span>
              </button>
            )}

            {compressTool && (
              <button
                type="button"
                onClick={() => onSelectTool?.(compressTool)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-2xs cursor-pointer"
                title="Open Compress PDF Tool"
              >
                <span>Compress</span>
              </button>
            )}

            {onSelectCategory && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory("ai");
                  document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-2xs cursor-pointer"
                title="Browse AI PDF Tools"
              >
                <Sparkles className="w-3 h-3 text-amber-500" aria-hidden="true" />
                <span>AI Tools</span>
              </button>
            )}

            {onOpenPricing && (
              <button
                type="button"
                onClick={onOpenPricing}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-2xs cursor-pointer"
                title="View PDFSun Pricing & Plans"
              >
                <CreditCard className="w-3 h-3 text-blue-500" aria-hidden="true" />
                <span>Pricing</span>
              </button>
            )}

            {onOpenBlog && (
              <button
                type="button"
                onClick={onOpenBlog}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-2xs cursor-pointer"
                title="Read PDF Knowledge Base & Guides"
              >
                <BookOpen className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                <span>Guides</span>
              </button>
            )}
          </div>
        </div>
      </motion.nav>
    </>
  );
}

export default BreadcrumbNav;
