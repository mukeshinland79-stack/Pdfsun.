import React, { useState, useMemo } from "react";
import { BLOG_POSTS } from "../data/blogData";
import { BlogPost, ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";
import {
  BookOpen,
  X,
  Clock,
  Calendar,
  User,
  Search,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Share2,
  Check,
  Copy,
  Sparkles,
} from "lucide-react";
import { PDFSunLogo } from "./PDFSunLogo";
import { AdSensePlaceholder } from "./AdSensePlaceholder";

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool?: (tool: ToolItem) => void;
  initialSlug?: string | null;
}

export const BlogModal: React.FC<BlogModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  initialSlug,
}) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(() => {
    if (initialSlug) {
      return BLOG_POSTS.find((p) => p.slug === initialSlug) || null;
    }
    return null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [copiedLink, setCopiedLink] = useState(false);

  // Available unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    BLOG_POSTS.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, []);

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((p) => {
      const matchesCat =
        activeCategory === "All" ||
        (p.category || "").toLowerCase() === activeCategory.toLowerCase();
      const q = (searchQuery || "").toLowerCase().trim();
      const matchesQuery =
        !q ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.author || "").toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const handleShare = async (post: BlogPost) => {
    const url = `https://pdfsun.in/blog/${post.slug}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch (err) {
        // Fallback
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="blog-modal-shell"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="PDFSun Knowledge Blog and Engineering Guides"
    >
      {/* Sticky Top Navigation (Matching PricingSection Shell) */}
      <div className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          {selectedPost ? (
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/20 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              aria-label="Back to All Articles"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Articles</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/20 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              aria-label="Back to PDF Tools & Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Tools</span>
            </button>
          )}

          <PDFSunLogo layout="horizontal" size="sm" showProBadge={true} showDomain={true} />
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center space-x-2">
          {!selectedPost && (
            <div className="relative hidden md:block w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles & guides..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Blog View"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {selectedPost ? (
          /* ========================================================= */
          /* SINGLE HIGH-EEAT ARTICLE READER VIEW                      */
          /* ========================================================= */
          <article className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
            {/* Breadcrumb & Actions */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="cursor-pointer hover:underline" onClick={() => setSelectedPost(null)}>
                  Blog
                </span>
                <span>/</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedPost.category}</span>
              </div>

              <button
                type="button"
                onClick={() => handleShare(selectedPost)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Share Guide"}</span>
              </button>
            </div>

            {/* Article Header */}
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {selectedPost.category}
              </span>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {selectedPost.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPost.author}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{selectedPost.date}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{selectedPost.readTime}</span>
                </span>
                <span className="flex items-center space-x-1.5 ml-auto text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Zero-Knowledge Verified</span>
                </span>
              </div>
            </div>

            {/* Article Hero Media */}
            {selectedPost.image && (
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 max-h-96">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content Body */}
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed space-y-4">
              {selectedPost.content}
            </div>

            {/* In-Article Native Feed Ad Placement */}
            <div className="my-8 p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden text-center">
              <AdSensePlaceholder format="horizontal" className="my-2" />
            </div>

            {/* Tool Recommendation Callout */}
            {selectedPost.relatedTools && selectedPost.relatedTools.length > 0 && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-cyan-500/10 border border-blue-500/20 space-y-4">
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Relevant Tools in this Guide</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPost.relatedTools.map((tId) => {
                    const toolObj = ALL_TOOLS.find((t) => t.id === tId || t.slug === tId);
                    if (!toolObj) return null;
                    return (
                      <button
                        key={tId}
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onSelectTool) onSelectTool(toolObj);
                        }}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition text-left flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {toolObj.name}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{toolObj.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        ) : (
          /* ========================================================= */
          /* ARTICLES DIRECTORY & KNOWLEDGE HUB                        */
          /* ========================================================= */
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Header Hero */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                PDFSun Knowledge Hub
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Engineering Insights &amp; PDF Guides
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Deep dives into WebAssembly document compilation, client-side zero-knowledge security, and PDF optimization techniques.
              </p>
            </div>

            {/* Mobile Search Bar */}
            <div className="block md:hidden">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles & tutorials..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Articles Grid */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No articles matched your search</h3>
                <p className="text-xs text-slate-500">Try adjusting your search query or select "All" categories.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer overflow-hidden group flex flex-col justify-between shadow-2xs hover:shadow-lg"
                  >
                    <div>
                      {post.image && (
                        <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {post.category}
                          </span>
                          <span className="text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{post.readTime}</span>
                          </span>
                        </div>

                        <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                          {post.title}
                        </h2>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-2">
                      <span className="font-medium text-slate-600 dark:text-slate-300">By {post.author}</span>
                      <span>{post.date}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="w-full py-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500">
        <p>PDFSun — 100% In-Browser Zero-Knowledge WebAssembly Architecture. GDPR &amp; HIPAA Compliant.</p>
      </div>
    </div>
  );
};

