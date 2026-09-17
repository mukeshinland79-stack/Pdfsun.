import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Zap,
  Bot,
  Lock,
  FileCheck,
  Sparkles,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Bookmark,
  Share2,
  Check,
  Clock,
  Calendar,
  BookOpen,
  Filter,
  Layers,
  Heart,
  X,
} from "lucide-react";
import { BLOG_POSTS } from "../data/blogData";
import { BlogPost } from "../types";
import { AdSensePlaceholder } from "./AdSensePlaceholder";
import {
  getSavedArticleSlugs,
  toggleSavedArticle,
  onBookmarksChange,
  shareArticleContent,
} from "../utils/blogArticleUtils";

/**
 * Calculates reading time in minutes based on average human reading speed of 200 words per minute (WPM).
 * Sanitizes markdown, code blocks, HTML tags, and punctuation for accurate word counting.
 * Returns formatted string: '⚡ X min read'
 */
export function calculateReadingTime(
  content?: string | null,
  fallbackTimeStr?: string
): { minutes: number; text: string; badgeText: string } {
  const wordsPerMinute = 200;
  if (!content || !content.trim()) {
    if (fallbackTimeStr) {
      const parsed = parseInt(fallbackTimeStr.replace(/\D/g, ""), 10);
      const mins = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
      const formatted = `⚡ ${mins} min read`;
      return {
        minutes: mins,
        text: formatted,
        badgeText: formatted,
      };
    }
    return {
      minutes: 4,
      text: "⚡ 4 min read",
      badgeText: "⚡ 4 min read",
    };
  }

  // Strip code blocks, HTML tags, markdown symbols
  const clean = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*`_~\[\]()>\-+|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(/\s+/).filter((w) => w.length > 0).length;
  // Calculate minutes at 200 WPM, minimum 1 minute
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  const formatted = `⚡ ${minutes} min read`;

  return {
    minutes,
    text: formatted,
    badgeText: formatted,
  };
}

/**
 * Direct helper function to estimate reading time (200 WPM) and return '⚡ X min read'.
 */
export function estimateReadingTime(content?: string | null, fallbackTimeStr?: string): string {
  return calculateReadingTime(content, fallbackTimeStr).text;
}

interface PdfSunArticleSectionProps {
  showAd?: boolean;
  onNavigateArticle?: (slug: string) => void;
  onNavigateBlog?: () => void;
}

/**
 * Enhanced Editorial Knowledge & Article Section for PDFSun.in.
 * 
 * Features:
 * 1. Dynamic 200 WPM Reading Time calculation (e.g. ⚡ 5 min read)
 * 2. Native Web Share API with graceful Clipboard fallback & instant toast notifications
 * 3. Interactive Category Filter Pills with responsive active states
 * 4. Resilient LocalStorage Bookmark/Save functionality (pdfsun_saved_articles) with dedicated view
 * 5. AdSense & Ezoic layout stability (CLS = 0) with reserved dimension buffers
 */
export const PdfSunArticleSection: React.FC<PdfSunArticleSectionProps> = ({
  showAd = true,
  onNavigateArticle,
  onNavigateBlog,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [viewSavedOnly, setViewSavedOnly] = useState<boolean>(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [shareToast, setShareToast] = useState<{
    visible: boolean;
    message: string;
    slug?: string;
  }>({ visible: false, message: "" });

  // Initialize and sync saved article bookmarks safely across tabs and components
  useEffect(() => {
    setSavedSlugs(getSavedArticleSlugs());
    const unsubscribe = onBookmarksChange((updatedSlugs) => {
      setSavedSlugs(updatedSlugs);
    });
    return unsubscribe;
  }, []);

  // Compute available categories from articles
  const categories = useMemo(() => {
    const set = new Set<string>();
    BLOG_POSTS.forEach((post) => {
      if (post.category) set.add(post.category);
    });
    return ["All", ...Array.from(set)];
  }, []);

  // Filter articles based on category or saved-only mode
  const displayedArticles = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      if (viewSavedOnly) {
        return savedSlugs.includes(post.slug);
      }
      if (selectedCategory === "All") {
        return true;
      }
      return post.category === selectedCategory;
    });
  }, [selectedCategory, viewSavedOnly, savedSlugs]);

  // Handle bookmark toggle with safe local storage persistence
  const handleToggleBookmark = useCallback((e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    toggleSavedArticle(slug);
  }, []);

  // Handle native Web Share API with clipboard fallback & toast notification
  const handleShareArticle = useCallback(
    async (e: React.MouseEvent, post: BlogPost) => {
      e.stopPropagation();

      const articleUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/blog/${post.slug}`
          : `https://pdfsun.in/blog/${post.slug}`;

      // 1. Try Native Web Share API first for supported browsers (mobile browsers, Safari, modern Chromium)
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `${post.title} — PDFSun`,
            text: post.excerpt,
            url: articleUrl,
          });

          setShareToast({
            visible: true,
            message: "Article shared successfully!",
            slug: post.slug,
          });
          setTimeout(() => {
            setShareToast((prev) => (prev.slug === post.slug ? { visible: false, message: "" } : prev));
          }, 3200);
          return;
        } catch (err: any) {
          // If the user cancelled the share dialog (AbortError), exit cleanly without error toast
          if (err?.name === "AbortError") {
            return;
          }
          console.warn("[PDFSun Share] navigator.share failed, falling back to clipboard:", err);
        }
      }

      // 2. Fallback to clipboard copy with instant toast message
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(articleUrl);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = articleUrl;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        setShareToast({
          visible: true,
          message: "Link copied to clipboard!",
          slug: post.slug,
        });
        setTimeout(() => {
          setShareToast((prev) => (prev.slug === post.slug ? { visible: false, message: "" } : prev));
        }, 3200);
      } catch (clipErr) {
        setShareToast({
          visible: true,
          message: "Unable to copy link to clipboard",
          slug: post.slug,
        });
        setTimeout(() => {
          setShareToast((prev) => (prev.slug === post.slug ? { visible: false, message: "" } : prev));
        }, 3200);
      }
    },
    []
  );

  const handleCardClick = (slug: string) => {
    if (onNavigateArticle) {
      onNavigateArticle(slug);
    } else if (typeof window !== "undefined") {
      window.location.href = `/blog/${slug}`;
    }
  };

  return (
    <section
      id="pdfsun-editorial-overview"
      className="my-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      aria-label="PDFSun Document Intelligence & In-Depth Technical Guides"
    >
      <article className="rounded-3xl bg-gradient-to-b from-slate-900 via-[#0c1322] to-slate-950 border border-slate-800/80 shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden">
        {/* Subtle Ambient Decorative Glows */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Global Toast Notification for Share actions */}
        {shareToast.visible && (
          <div
            id="pdfsun-article-toast"
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-100">{shareToast.message}</span>
            <button
              id="btn-dismiss-share-toast"
              type="button"
              onClick={() => setShareToast({ visible: false, message: "" })}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Dismiss toast notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Semantic Article Header */}
        <header className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Next-Gen Document Engineering &amp; Research</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            PDFSun.in: Fast, Free &amp; Private Online Document Management Suite
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Engineered for professionals, students, and global enterprises,{" "}
            <strong className="text-white font-semibold">PDFSun.in</strong> delivers a complete,
            zero-compromise workspace for viewing, editing, compressing, converting, and
            analyzing PDF documents directly inside your web browser.
          </p>
        </header>

        {/* 3-Column Core Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 relative z-10">
          {/* Card 1: Client-Side WebAssembly Security */}
          <div className="rounded-2xl p-6 bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Zero-Knowledge WebAssembly Privacy
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlike traditional PDF converters that upload confidential contracts and personal
                records to third-party cloud servers, PDFSun executes core document modifications
                locally using sandboxed <strong>WebAssembly (WASM)</strong>. Your documents remain
                entirely in your device&apos;s memory and are never stored or logged remotely.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-700/40 flex items-center text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>100% In-Browser Isolation</span>
            </div>
          </div>

          {/* Card 2: AI Document Copilot */}
          <div className="rounded-2xl p-6 bg-slate-800/40 border border-slate-700/60 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                AI Copilot &amp; Smart Analysis
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlock deep insights from academic research papers, legal briefs, and financial
                statements. The built-in AI Copilot provides instant document summarization,
                multilingual translations across 30+ languages, interactive natural language Q&amp;A,
                and structured table-to-spreadsheet extraction.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-700/40 flex items-center text-xs font-semibold text-blue-400">
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Gemini-Powered Intelligence</span>
            </div>
          </div>

          {/* Card 3: Lightning Speed & Precision */}
          <div className="rounded-2xl p-6 bg-slate-800/40 border border-slate-700/60 hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Sub-Second Processing &amp; Compression
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Experience ultra-fast batch conversions, instant page reordering, and smart PDF
                compression. Shrink large scan files down to targeted thresholds (100KB, 200KB,
                or 500KB) for seamless email attachments and portal submissions without compromising
                visual typography or vector clarity.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-700/40 flex items-center text-xs font-semibold text-amber-400">
              <Cpu className="w-4 h-4 mr-1.5" />
              <span>Multithreaded Web Workers</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
         * CURATED ARTICLES & GUIDES WITH FILTERS, READING TIME, BOOKMARK & SHARE
         * ========================================================================= */}
        <div className="my-10 pt-8 border-t border-slate-800 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Authoritative Knowledge Series</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Featured Guides, Benchmarks &amp; Tutorials
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Written by WebAssembly and technical security specialists. All articles include calculated reading times, bookmarking, and native sharing.
              </p>
            </div>

            {onNavigateBlog && (
              <button
                id="btn-view-all-blog-guides"
                type="button"
                onClick={onNavigateBlog}
                className="shrink-0 inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                <span>Browse All Guides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Category Filter Pills & Dedicated Saved Articles Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {categories.map((category) => {
              const isActive = !viewSavedOnly && selectedCategory === category;
              return (
                <button
                  key={category}
                  id={`filter-pill-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  type="button"
                  onClick={() => {
                    setViewSavedOnly(false);
                    setSelectedCategory(category);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center space-x-1.5 shadow-2xs ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-amber-500/20 shadow-md"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60"
                  }`}
                >
                  <span>{category}</span>
                </button>
              );
            })}

            {/* Dedicated Saved Articles Pill */}
            <button
              id="filter-pill-saved-articles"
              type="button"
              onClick={() => setViewSavedOnly(!viewSavedOnly)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center space-x-1.5 shadow-2xs border ${
                viewSavedOnly
                  ? "bg-rose-500 text-white border-rose-400 font-black shadow-rose-500/25 shadow-md"
                  : savedSlugs.length > 0
                  ? "bg-slate-800/80 text-rose-400 hover:bg-slate-700/80 border-rose-500/30"
                  : "bg-slate-800/40 text-slate-400 hover:bg-slate-800 border-slate-700/50"
              }`}
              title="View your bookmarked articles saved in browser"
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  viewSavedOnly || savedSlugs.length > 0 ? "fill-current" : ""
                }`}
              />
              <span>Saved Articles</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  viewSavedOnly
                    ? "bg-white/20 text-white"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {savedSlugs.length}
              </span>
            </button>
          </div>

          {/* Article Cards Grid */}
          {displayedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedArticles.map((post) => {
                const isSaved = savedSlugs.includes(post.slug);
                const readingTime = calculateReadingTime(post.content, post.readTime);
                const isCopied = shareToast.visible && shareToast.slug === post.slug;

                return (
                  <div
                    key={post.id}
                    id={`article-card-${post.slug}`}
                    onClick={() => handleCardClick(post.slug)}
                    className="group rounded-2xl bg-slate-800/40 border border-slate-700/70 hover:border-amber-500/60 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Thumbnail with Overlay Badges */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />

                        {/* Top Category Tag */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-400 border border-white/10">
                            {post.category}
                          </span>
                        </div>

                        {/* Top Right Actions (Bookmark & Share) */}
                        <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                          <button
                            id={`btn-bookmark-${post.slug}`}
                            type="button"
                            onClick={(e) => handleToggleBookmark(e, post.slug)}
                            className={`p-2 rounded-xl backdrop-blur-md transition cursor-pointer shadow-md ${
                              isSaved
                                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                : "bg-slate-900/80 text-white hover:bg-slate-800 border border-white/10"
                            }`}
                            title={isSaved ? "Remove from bookmarks" : "Save article to browser"}
                            aria-label={isSaved ? "Remove bookmark" : "Bookmark article"}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`}
                            />
                          </button>

                          <button
                            id={`btn-share-${post.slug}`}
                            type="button"
                            onClick={(e) => handleShareArticle(e, post)}
                            className={`p-2 rounded-xl backdrop-blur-md transition cursor-pointer shadow-md ${
                              isCopied
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-900/80 text-white hover:bg-slate-800 border border-white/10"
                            }`}
                            title="Share article via Web Share API or copy link"
                            aria-label="Share article"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Reading Time Badge Overlay */}
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-950/85 backdrop-blur-sm text-amber-300 border border-amber-500/30 flex items-center space-x-1 shadow-sm">
                            <span>{readingTime.badgeText}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{post.date}</span>
                          </span>
                          <span>•</span>
                          <span>By {post.author}</span>
                        </div>

                        <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h4>

                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action Bar */}
                    <div className="p-5 pt-3 border-t border-slate-700/50 flex items-center justify-between mt-auto gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {readingTime.text}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Native Web Share Button */}
                        <button
                          id={`btn-share-footer-${post.slug}`}
                          type="button"
                          onClick={(e) => handleShareArticle(e, post)}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            isCopied
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50"
                          }`}
                          title="Share article via Web Share API or copy link"
                          aria-label="Share article"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[11px]">Share</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                          <span>Read Full Guide</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State for Saved Articles or Zero Search Results */
            <div className="text-center py-12 px-6 rounded-2xl bg-slate-800/30 border border-slate-700/60 my-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                {viewSavedOnly ? "No saved articles yet" : "No articles found in this category"}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                {viewSavedOnly
                  ? "Tap the bookmark ribbon icon on any guide above to store it in your browser for instant reference and offline study."
                  : "Try selecting another category or view all guides."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setViewSavedOnly(false);
                  setSelectedCategory("All");
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
              >
                Explore All Guides
              </button>
            </div>
          )}
        </div>

        {/* Detailed Semantic Editorial Body */}
        <div className="space-y-4 pt-8 border-t border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed relative z-10">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <span>Why Modern Teams Choose PDFSun Over Desktop Software</span>
          </h3>

          <p>
            Traditional document management often requires bloated desktop software installations,
            costly recurring subscriptions, or risking confidential data on untrusted cloud servers.
            PDFSun solves this dilemma by uniting over 30 essential tools—including PDF merging,
            splitting, page rotation, optical character recognition (OCR), digital signature stamping,
            and password decryption—into a single, high-performance web platform that works instantly
            on Windows, macOS, Linux, iOS, and Android devices.
          </p>

          <p>
            Whether preparing invoices, merging semester study notes, or redacting sensitive client
            identities, PDFSun ensures that your workflows remain unthrottled, ad-compliant, and
            strictly private. No user registration or credit card is ever required to access our core
            utilities.
          </p>
        </div>

        {/* Compliant In-Article AdSense Banner with Reserved CLS Buffer (Zero Layout Shift) */}
        {showAd && (
          <div
            id="pdfsun-editorial-ad-buffer"
            className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col items-center justify-center relative z-10 min-h-[280px]"
          >
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mb-2">
              Sponsored Content
            </span>
            <AdSensePlaceholder
              slotId="pdfsun-auto-incontent-02"
              format="rectangle"
              className="my-0 w-full min-h-[250px]"
            />
          </div>
        )}
      </article>
    </section>
  );
};
