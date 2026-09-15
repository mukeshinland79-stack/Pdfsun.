import React, { useState } from "react";
import {
  Globe,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  RefreshCw,
  X,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  Code,
} from "lucide-react";
import {
  generateSitemapXml,
  buildSitemapEntries,
  getSitemapStats,
  downloadSitemapFile,
  copySitemapToClipboard,
  SitemapUrlEntry,
} from "../utils/sitemapGenerator";
import {
  generateBlogSitemap,
  buildBlogSitemapEntries,
  downloadBlogSitemapFile,
  copyBlogSitemapToClipboard,
} from "../utils/sitemap";

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({ isOpen, onClose }) => {
  const [baseUrlInput, setBaseUrlInput] = useState<string>("https://www.pdfsun.in");

  const [copied, setCopied] = useState(false);
  const [blogCopied, setBlogCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"urls" | "raw" | "blog-sitemap">("urls");
  const [blogViewMode, setBlogViewMode] = useState<"cards" | "xml">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "tool" | "blog" | "core" | "policy">("all");

  if (!isOpen) return null;

  const entries: SitemapUrlEntry[] = buildSitemapEntries(baseUrlInput);
  const xmlContent = generateSitemapXml(baseUrlInput);
  const stats = getSitemapStats(baseUrlInput);

  const blogEntries: SitemapUrlEntry[] = buildBlogSitemapEntries(baseUrlInput);
  const blogXmlContent = generateBlogSitemap(baseUrlInput);

  const handleCopy = async () => {
    const success = await copySitemapToClipboard(baseUrlInput);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyBlog = async () => {
    const success = await copyBlogSitemapToClipboard(baseUrlInput);
    if (success) {
      setBlogCopied(true);
      setTimeout(() => setBlogCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadSitemapFile(baseUrlInput);
  };

  const handleDownloadBlog = () => {
    downloadBlogSitemapFile(baseUrlInput);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesFilter = filterType === "all" || entry.type === filterType;
    const matchesSearch =
      searchQuery.trim() === "" ||
      entry.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.title && entry.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl max-w-5xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Dynamic sitemap.xml Generator
                </h2>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SEO Optimization
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically scans all PDF tools, blog articles, and core routes to boost search indexation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close sitemap modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Domain Config */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Domain Base URL Input */}
            <div className="flex items-center space-x-2 flex-1 max-w-lg bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs font-bold text-slate-400 shrink-0">Target Domain:</span>
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://www.pdfsun.in"
                className="w-full text-xs font-mono font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  copied
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "XML Copied!" : "Copy XML"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                title="Download full sitemap.xml with all core, tool, and blog URLs"
              >
                <Download className="w-4 h-4" />
                <span>Download sitemap.xml</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBlog}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                title="Download dedicated blog-sitemap.xml containing all 10 blog post URLs"
              >
                <FileText className="w-4 h-4 text-indigo-200" />
                <span>Download blog-sitemap.xml</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Indexed URLs</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{stats.totalUrls}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">PDF Tool Pages</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{stats.toolUrlsCount}</p>
              </div>
            </div>

            <div
              onClick={() => setActiveTab("blog-sitemap")}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 flex items-center justify-between cursor-pointer group transition"
              title="Click to explore dedicated Blog Sitemap"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Blog Articles</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{stats.blogUrlsCount}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/20">
                blog-sitemap &rarr;
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Core & Legal Pages</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {stats.corePagesCount + stats.policyPagesCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 py-2 bg-slate-100/70 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("urls")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "urls"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL Explorer ({entries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("blog-sitemap")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "blog-sitemap"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Blog Sitemap (blog-sitemap.xml)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-mono">
                10 Posts
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "raw"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw sitemap.xml</span>
            </button>
          </div>

          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
          >
            <span>Google Search Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 min-h-[300px]">
          {activeTab === "urls" && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search indexed URL or title..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto">
                  {(["all", "tool", "blog", "core", "policy"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer ${
                        filterType === type
                          ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Blog Sitemap Notice Banner */}
              {filterType === "blog" && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Dedicated Blog Sitemap Available
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Generated specifically for all 10 blog articles with canonical <code className="font-mono text-indigo-600 dark:text-indigo-400">/blog/:slug</code> URLs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab("blog-sitemap")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>View blog-sitemap.xml</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBlog}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}

              {/* URL Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">URL Location</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Change Frequency</th>
                        <th className="py-3 px-4">Last Mod</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {filteredEntries.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 max-w-md truncate">
                            <a
                              href={item.loc}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1.5"
                            >
                              <span className="truncate">{item.loc}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                            </a>
                            {item.title && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.title}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.type === "tool"
                                  ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300"
                                  : item.type === "blog"
                                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
                                  : item.type === "core"
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {item.priority}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 capitalize">
                            {item.changefreq}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {item.lastmod}
                          </td>
                        </tr>
                      ))}

                      {filteredEntries.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No matching URL entries found for "{searchQuery}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "blog-sitemap" && (
            <div className="space-y-4">
              {/* Blog Sitemap Control Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5 shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-black text-white">
                        Dedicated Blog XML Sitemap (<code className="text-indigo-400 font-mono">blog-sitemap.xml</code>)
                      </h3>
                      <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {blogEntries.length} Indexed URLs
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      Generated dynamically via <code className="text-indigo-300 font-mono text-[11px]">generateBlogSitemap()</code>.
                      Indexes all 10 in-depth engineering whitepapers, WebAssembly guides, and security deep dives using canonical <code className="text-indigo-300 font-mono text-[11px]">/blog/:slug</code> paths.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
                  <div className="flex items-center bg-slate-900 border border-slate-700 p-0.5 rounded-xl text-xs font-bold mr-1">
                    <button
                      type="button"
                      onClick={() => setBlogViewMode("cards")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        blogViewMode === "cards"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>URL Entries ({blogEntries.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogViewMode("xml")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        blogViewMode === "xml"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>XML Output</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyBlog}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      blogCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                    }`}
                  >
                    {blogCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{blogCopied ? "XML Copied!" : "Copy Blog XML"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBlog}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download blog-sitemap.xml</span>
                  </button>
                </div>
              </div>

              {/* View 1: Detailed URL cards */}
              {blogViewMode === "cards" ? (
                <div className="space-y-2.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 px-1">
                    <span>
                      Target URL format: <code className="font-mono text-indigo-500 dark:text-indigo-400">{baseUrlInput}/blog/:slug</code>
                    </span>
                    <span>
                      Direct redirection aliases supported (e.g. <code className="font-mono text-indigo-500">/blog/privacy-future</code>, <code className="font-mono text-indigo-500">/blog/compression-guide</code>)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {blogEntries.map((entry, idx) => {
                      const isHub = entry.loc.endsWith("/blog");
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                #{idx + 1}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  isHub
                                    ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                    : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
                                }`}
                              >
                                {isHub ? "Blog Hub" : "Technical Article"}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Priority: <strong className="text-slate-800 dark:text-slate-200">{entry.priority}</strong> • Freq: <strong className="text-slate-800 dark:text-slate-200">{entry.changefreq}</strong> • LastMod: {entry.lastmod}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {entry.title}
                            </p>

                            <div className="flex items-center space-x-1.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                              <Globe className="w-3 h-3 shrink-0 opacity-60" />
                              <span className="truncate">{entry.loc}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                            <a
                              href={entry.loc}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center space-x-1"
                            >
                              <span>Visit</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* View 2: Raw XML Preview */
                <div className="relative">
                  <div className="absolute right-3 top-3 z-10 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCopyBlog}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold transition flex items-center space-x-1 shadow-md cursor-pointer"
                    >
                      {blogCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{blogCopied ? "Copied" : "Copy XML"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBlog}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold transition flex items-center space-x-1 shadow-md cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-[500px]">
                    {blogXmlContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <div className="relative">
              <div className="absolute right-3 top-3 z-10 flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold transition flex items-center space-x-1 shadow-md"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Source"}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-[500px]">
                {xmlContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>XML Schema v0.9 Compliant • Standardized for Google, Bing & DuckDuckGo</span>
          </div>

          <span>Last Scanned: {stats.lastGenerated}</span>
        </div>
      </div>
    </div>
  );
};
