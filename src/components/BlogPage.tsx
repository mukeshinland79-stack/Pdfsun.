import React, { useState, useMemo } from "react";
import { BlogPost } from "../types";
import { BLOG_POSTS, getBlogPostBySlug } from "../data/blogData";
import { ALL_TOOLS } from "../data/toolsData";
import {
  BookOpen,
  Clock,
  Calendar,
  User,
  Search,
  ArrowLeft,
  Share2,
  Check,
  Copy,
  ShieldCheck,
  Cpu,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  FileCheck2,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

interface BlogPageProps {
  currentSlug?: string | null;
  onNavigateHome: () => void;
  onNavigateBlog: () => void;
  onNavigateArticle: (slug: string) => void;
  onSelectTool?: (toolId: string) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  currentSlug,
  onNavigateHome,
  onNavigateBlog,
  onNavigateArticle,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Active article detection (if slug provided)
  const activePost = useMemo(() => {
    if (!currentSlug) return null;
    return getBlogPostBySlug(currentSlug);
  }, [currentSlug]);

  // Unique categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All");
    BLOG_POSTS.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, []);

  // Filtered posts for blog index
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesTitle = post.title.toLowerCase().includes(query);
      const matchesExcerpt = post.excerpt.toLowerCase().includes(query);
      const matchesCategoryText = post.category.toLowerCase().includes(query);
      const matchesTags = (post.tags || []).some((t) =>
        t.toLowerCase().includes(query)
      );

      return (
        matchesCategory &&
        (matchesTitle || matchesExcerpt || matchesCategoryText || matchesTags)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyShareUrl = (slug: string) => {
    const url = `https://pdfsun.in/blog/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  // Structured Data JSON-LD for Single Article View
  const articleJsonLd = useMemo(() => {
    if (!activePost) return null;

    const faqEntities = (activePost.faqs || []).map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    }));

    const articleSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": `https://pdfsun.in/blog/${activePost.slug}#article`,
          isPartOf: {
            "@type": "WebSite",
            "@id": "https://pdfsun.in/#website",
            name: "PDFSun.in",
            url: "https://pdfsun.in",
          },
          headline: activePost.title,
          description: activePost.excerpt,
          image: activePost.image,
          datePublished: "2026-09-01T08:00:00+00:00",
          dateModified: `${activePost.lastModified || "2026-09-14"}T12:00:00+00:00`,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://pdfsun.in/blog/${activePost.slug}`,
          },
          author: {
            "@type": "Person",
            name: activePost.author,
            jobTitle: "Senior Web Security & Technical SEO Architect",
            url: "https://pdfsun.in/about-us",
          },
          publisher: {
            "@type": "Organization",
            name: "PDFSun",
            url: "https://pdfsun.in",
            logo: {
              "@type": "ImageObject",
              url: "https://pdfsun.in/brand/logo.svg",
            },
          },
          articleSection: activePost.category,
          keywords: (activePost.tags || []).join(", "),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://pdfsun.in",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog & Guides",
              item: "https://pdfsun.in/blog",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: activePost.title,
              item: `https://pdfsun.in/blog/${activePost.slug}`,
            },
          ],
        },
        ...(faqEntities.length > 0
          ? [
              {
                "@type": "FAQPage",
                mainEntity: faqEntities,
              },
            ]
          : []),
      ],
    };

    return JSON.stringify(articleSchema);
  }, [activePost]);

  // Structured Data JSON-LD for Blog Index
  const blogIndexJsonLd = useMemo(() => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": "https://pdfsun.in/blog#collection",
      name: "PDFSun Master Knowledge Base & Document Guides",
      description:
        "Authoritative technical guides, tutorials, and security analyses on in-browser WebAssembly PDF processing, compression, encryption, and client-side document management.",
      url: "https://pdfsun.in/blog",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://pdfsun.in/#website",
        name: "PDFSun.in",
        url: "https://pdfsun.in",
      },
      hasPart: BLOG_POSTS.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: `https://pdfsun.in/blog/${post.slug}`,
        datePublished: "2026-09-01",
      })),
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Dynamic SEO Meta Headers */}
      {activePost ? (
        <Helmet>
          <title>{`${activePost.title} | PDFSun Knowledge Base`}</title>
          <meta name="description" content={activePost.excerpt} />
          <link rel="canonical" href={`https://pdfsun.in/blog/${activePost.slug}`} />
          <meta property="og:title" content={activePost.title} />
          <meta property="og:description" content={activePost.excerpt} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={`https://pdfsun.in/blog/${activePost.slug}`} />
          <meta property="og:image" content={activePost.image} />
          <meta property="article:published_time" content="2026-09-01T08:00:00Z" />
          <meta property="article:author" content={activePost.author} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={activePost.title} />
          <meta name="twitter:description" content={activePost.excerpt} />
          <meta name="twitter:image" content={activePost.image} />
          {articleJsonLd && (
            <script type="application/ld+json">{articleJsonLd}</script>
          )}
        </Helmet>
      ) : (
        <Helmet>
          <title>PDFSun Blog & Technical Guides | In-Browser WebAssembly PDF Security</title>
          <meta
            name="description"
            content="Explore comprehensive, authoritative guides on client-side PDF compression, WebAssembly security, OCR, encryption, and digital document workflows with zero cloud data retention."
          />
          <link rel="canonical" href="https://pdfsun.in/blog" />
          <meta property="og:title" content="PDFSun Blog & Technical Guides" />
          <meta
            property="og:description"
            content="Master document privacy and high-speed in-browser WebAssembly PDF tools."
          />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://pdfsun.in/blog" />
          {blogIndexJsonLd && (
            <script type="application/ld+json">{blogIndexJsonLd}</script>
          )}
        </Helmet>
      )}

      {/* TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-amber-400 transition font-bold text-xs sm:text-sm cursor-pointer"
              title="Return to PDFSun Tools Grid"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All PDF Tools</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {activePost ? (
              <button
                onClick={onNavigateBlog}
                className="flex items-center space-x-1.5 text-orange-600 dark:text-amber-400 hover:underline font-bold text-xs sm:text-sm cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Blog Index</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-amber-400 border border-orange-500/20">
                  Knowledge Hub
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Launch Studio</span>
            </button>
          </div>
        </div>
      </nav>

      {/* VIEW CONDITIONAL: SINGLE ARTICLE vs. BLOG INDEX */}
      {activePost ? (
        /* =========================================================================
         * SINGLE ARTICLE DETAIL VIEW (Dedicated URL: /blog/:slug)
         * ========================================================================= */
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <li>
                <button
                  onClick={onNavigateHome}
                  className="hover:text-orange-500 dark:hover:text-amber-400 transition"
                >
                  Home
                </button>
              </li>
              <li className="text-slate-400">/</li>
              <li>
                <button
                  onClick={onNavigateBlog}
                  className="hover:text-orange-500 dark:hover:text-amber-400 transition"
                >
                  Blog & Guides
                </button>
              </li>
              <li className="text-slate-400">/</li>
              <li className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[220px] sm:max-w-md">
                {activePost.title}
              </li>
            </ol>
          </nav>

          {/* Article Header & Metadata */}
          <header className="space-y-4 mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-amber-400 border border-orange-500/20">
                {activePost.category}
              </span>
              <span className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{activePost.readTime}</span>
              </span>
              <span className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activePost.date}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              {activePost.title}
            </h1>

            {/* Author E-E-A-T Identity & Share Buttons */}
            <div className="pt-2 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
                  {activePost.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {activePost.author}
                    </span>
                    <span title="Verified Web Security & Technical SEO Architect">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lead Web Engineer & Client-Side Architect • PDFSun Research
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopyShareUrl(activePost.slug)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Copy direct article URL"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Link Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Guide</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Hero Feature Image */}
          <div className="mb-8 rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-900">
            <img
              src={activePost.image}
              alt={activePost.title}
              className="w-full h-64 sm:h-80 md:h-96 object-cover object-center"
              loading="eager"
            />
          </div>

          {/* EXECUTIVE SUMMARY CALLOUT BOX */}
          {activePost.executiveSummary && (
            <aside className="mb-8 p-6 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 shadow-xs">
              <div className="flex items-center space-x-2 mb-2 text-amber-700 dark:text-amber-300 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Executive Summary & Key Takeaways</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed font-medium">
                {activePost.executiveSummary}
              </p>
            </aside>
          )}

          {/* MAIN ARTICLE BODY (Formatted Markdown/Prose) */}
          <section className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 space-y-6 text-sm sm:text-base leading-relaxed">
            {activePost.content.split("\n\n").map((block, idx) => {
              // Conceptual summary or callout block
              if (block.startsWith("```")) {
                const cleanText = block.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-blue-50/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 text-sm my-4 border border-blue-100 dark:border-slate-800 shadow-xs leading-relaxed"
                  >
                    <p className="whitespace-pre-line">{cleanText}</p>
                  </div>
                );
              }

              // Heading 2
              if (block.startsWith("## ")) {
                return (
                  <h2
                    key={idx}
                    className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-6 pb-2 border-b border-slate-200 dark:border-slate-800 tracking-tight"
                  >
                    {block.replace("## ", "")}
                  </h2>
                );
              }

              // Heading 3
              if (block.startsWith("### ")) {
                return (
                  <h3
                    key={idx}
                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-4 pb-1"
                  >
                    {block.replace("### ", "")}
                  </h3>
                );
              }

              // Markdown horizontal divider
              if (block.trim() === "---") {
                return (
                  <hr
                    key={idx}
                    className="border-slate-200 dark:border-slate-800 my-8"
                  />
                );
              }

              // Blockquote / Callout
              if (block.startsWith("> ")) {
                return (
                  <blockquote
                    key={idx}
                    className="border-l-4 border-orange-500 pl-4 italic text-slate-700 dark:text-slate-300 my-4 bg-orange-500/5 py-2 rounded-r-xl"
                  >
                    {block.replace("> ", "")}
                  </blockquote>
                );
              }

              // Unordered List
              if (block.startsWith("- ") || block.startsWith("* ")) {
                const items = block
                  .split("\n")
                  .filter((l) => l.startsWith("- ") || l.startsWith("* "));
                return (
                  <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3">
                    {items.map((it, i) => (
                      <li key={i} className="text-slate-700 dark:text-slate-300">
                        {it.replace(/^[-*]\s/, "")}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Numbered List
              if (/^\d+\.\s/.test(block)) {
                const items = block
                  .split("\n")
                  .filter((l) => /^\d+\.\s/.test(l));
                return (
                  <ol key={idx} className="list-decimal pl-5 space-y-1.5 my-3">
                    {items.map((it, i) => (
                      <li key={i} className="text-slate-700 dark:text-slate-300">
                        {it.replace(/^\d+\.\s/, "")}
                      </li>
                    ))}
                  </ol>
                );
              }

              // Standard Paragraph
              return (
                <p key={idx} className="text-slate-700 dark:text-slate-300">
                  {block}
                </p>
              );
            })}
          </section>

          {/* COMPARISON TABLE SECTION */}
          {activePost.comparisonTable && (
            <div className="my-10 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
              <div className="flex items-center space-x-2 mb-4">
                <Layers className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Technical Architecture & Security Comparison
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Comparing PDFSun in-browser WebAssembly against traditional cloud-upload
                services.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                      {activePost.comparisonTable.headers.map((hdr, hIdx) => (
                        <th
                          key={hIdx}
                          className={`p-3 font-bold ${
                            hIdx === 1
                              ? "text-orange-600 dark:text-amber-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {hdr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activePost.comparisonTable.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-3 align-top ${
                              cIdx === 0
                                ? "font-bold text-slate-900 dark:text-white"
                                : cIdx === 1
                                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIONABLE TOOL LAUNCH CARD */}
          {activePost.relatedTools && activePost.relatedTools.length > 0 && (
            <div className="my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-700 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Execute This Locally in Seconds</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Experience Zero-Knowledge PDF Speed Right Now
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Try the exact client-side WebAssembly tools featured in this guide.
                  100% free, unlimited, and runs in local browser memory with zero
                  cloud uploads.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {activePost.relatedTools.map((toolSlug) => {
                    const toolObj = ALL_TOOLS.find(
                      (t) => t.slug === toolSlug || t.id === toolSlug
                    );
                    const label = toolObj ? toolObj.name : toolSlug.replace(/-/g, " ");
                    return (
                      <button
                        key={toolSlug}
                        type="button"
                        onClick={() => {
                          if (onSelectTool && toolObj) {
                            onSelectTool(toolObj.id);
                          } else {
                            window.location.href = `/${toolSlug}`;
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm cursor-pointer capitalize active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Launch {label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SCHEMA-READY FAQ ACCORDION SECTION */}
          {activePost.faqs && activePost.faqs.length > 0 && (
            <section className="my-12">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Frequently Asked Questions (FAQ)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                Direct answers to common technical and regulatory questions.
              </p>

              <div className="space-y-3">
                {activePost.faqs.map((faq, fIdx) => {
                  const isExpanded = expandedFaqIndex === fIdx;
                  return (
                    <div
                      key={fIdx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFaqIndex(isExpanded ? null : fIdx)
                        }
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-orange-500 dark:hover:text-amber-400 transition cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-orange-500 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* AUTHOR PROFILE & E-E-A-T TRUST CARD */}
          <footer className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                MK
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Written by Mukesh Kalonia
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Verified Engineer
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Mukesh is a Senior Web Security Architect and Technical SEO Specialist
                  dedicated to advancing high-performance, client-side WebAssembly utility
                  architectures. He advocates for zero-data retention, uncompromising user privacy,
                  and sub-50ms web application responsiveness.
                </p>
                <div className="pt-2 flex items-center space-x-4 text-xs font-bold text-orange-600 dark:text-amber-400">
                  <button
                    onClick={onNavigateBlog}
                    className="hover:underline cursor-pointer"
                  >
                    View All 10 Guides &rarr;
                  </button>
                  <button
                    onClick={onNavigateHome}
                    className="hover:underline cursor-pointer"
                  >
                    Launch PDF Tools &rarr;
                  </button>
                </div>
              </div>
            </div>
          </footer>

          {/* RELATED POSTS SECTION */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">
              Recommended Guides in This Knowledge Series
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {BLOG_POSTS.filter((p) => p.slug !== activePost.slug)
                .slice(0, 3)
                .map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onNavigateArticle(post.slug)}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-orange-500 dark:hover:border-amber-500 transition shadow-2xs cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-36 object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="p-4 space-y-2">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-amber-400 uppercase">
                          {post.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-orange-500 transition">
                          {post.title}
                        </h4>
                      </div>
                    </div>
                    <div className="p-4 pt-0 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{post.readTime}</span>
                      <span className="font-bold text-orange-500 flex items-center space-x-1">
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </article>
      ) : (
        /* =========================================================================
         * BLOG INDEX VIEW (/blog)
         * ========================================================================= */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-amber-400 border border-orange-500/20 inline-flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Knowledge Series & Guides</span>
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Mastering Document Security, WebAssembly &amp; PDF Engineering
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Explore in-depth technical blueprints, optimization benchmarks, and
              privacy-first tutorials designed for students, legal teams, and
              enterprises.
            </p>

            {/* Search & Filter Bar */}
            <div className="pt-4 max-w-xl mx-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search 10 comprehensive guides, WASM tutorials, OCR tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 dark:focus:border-amber-400 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 text-xs font-bold scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap shadow-2xs ${
                  selectedCategory === cat
                    ? "bg-orange-500 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onNavigateArticle(post.slug)}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-amber-400 transition cursor-pointer overflow-hidden group flex flex-col justify-between shadow-xs hover:shadow-lg"
                >
                  <div>
                    <div className="relative overflow-hidden h-48 bg-slate-800">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-400 border border-white/10">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{post.date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.readTime}</span>
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-amber-400 transition leading-snug">
                        {post.title}
                      </h2>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      By {post.author}
                    </span>
                    <span className="text-xs font-black text-orange-600 dark:text-amber-400 flex items-center space-x-1 group-hover:translate-x-1 transition">
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No articles found matching &quot;{searchQuery}&quot;
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for keywords like &quot;WASM&quot;, &quot;Compression&quot;, &quot;OCR&quot;, or &quot;Encryption&quot;.
              </p>
            </div>
          )}

          {/* Trust Banner (E-E-A-T & Google AdSense / Ezoic Compliance) */}
          <div className="mt-16 p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Cloud Retention Standard</span>
              </div>
              <h3 className="text-xl font-black">
                100% Client-Side Processing Powered by WebAssembly
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                PDFSun operates directly on your device CPU. Your private documents are
                never uploaded to third-party cloud servers, guaranteeing complete compliance
                with GDPR, HIPAA, and corporate confidentiality policies.
              </p>
            </div>
            <button
              onClick={onNavigateHome}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs sm:text-sm hover:from-orange-600 hover:to-amber-600 shadow-md transition whitespace-nowrap cursor-pointer active:scale-95"
            >
              Open PDF Studio Tools
            </button>
          </div>
        </main>
      )}
    </div>
  );
};
