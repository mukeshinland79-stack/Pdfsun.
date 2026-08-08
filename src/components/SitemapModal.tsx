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
} from "lucide-react";
import {
  generateSitemapXml,
  buildSitemapEntries,
  getSitemapStats,
  downloadSitemapFile,
  copySitemapToClipboard,
  SitemapUrlEntry,
} from "../utils/sitemapGenerator";

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({ isOpen, onClose }) => {
  const [baseUrlInput, setBaseUrlInput] = useState<string>("https://pdfsun.in");

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"urls" | "raw" | "stats">("urls");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "tool" | "blog" | "core" | "policy">("all");

  if (!isOpen) return null;

  const entries: SitemapUrlEntry[] = buildSitemapEntries(baseUrlInput);
  const xmlContent = generateSitemapXml(baseUrlInput);
  const stats = getSitemapStats(baseUrlInput);

  const handleCopy = async () => {
    const success = await copySitemapToClipboard(baseUrlInput);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadSitemapFile(baseUrlInput);
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
                placeholder="https://pdfsun.in"
                className="w-full text-xs font-mono font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  copied
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "XML Copied!" : "Copy XML"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md flex items-center space-x-1.5 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download sitemap.xml</span>
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

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Blog Articles</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{stats.blogUrlsCount}</p>
              </div>
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
        <div className="px-6 py-2 bg-slate-100/70 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("urls")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === "urls"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL Explorer ({entries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("raw")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === "raw"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw XML Source</span>
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
                      className={`px-2.5 py-1 rounded-lg capitalize transition ${
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
