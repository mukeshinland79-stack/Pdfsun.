import React from "react";
import {
  Globe,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  CheckCircle2,
  Sparkles,
  Server,
  Layers,
  KeyRound,
  FileCheck,
} from "lucide-react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";
import { useLanguage } from "../lib/i18n";

interface EnterpriseSuiteCardProps {
  onSelectTool: (tool: ToolItem) => void;
  onOpenPricing?: () => void;
  onOpenContactModal?: () => void;
}

export const EnterpriseSuiteCard: React.FC<EnterpriseSuiteCardProps> = ({
  onSelectTool,
  onOpenPricing,
  onOpenContactModal,
}) => {
  const { t, dir } = useLanguage();

  const handleLaunchCopilot = () => {
    const aiTool =
      ALL_TOOLS.find((t) => t.id === "ai-chat-pdf" || t.slug === "ai-chat-pdf") ||
      ALL_TOOLS.find((t) => t.id === "ai-pdf-summary") ||
      ALL_TOOLS[0];
    if (aiTool) onSelectTool(aiTool);
  };

  const handleOpenEnterprisePlans = () => {
    if (onOpenPricing) {
      onOpenPricing();
    } else if (onOpenContactModal) {
      onOpenContactModal();
    }
  };

  return (
    <div
      id="enterprise-suite-card"
      dir={dir}
      className="relative group h-full rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0b1329] border border-blue-200 dark:border-blue-500/30 hover:border-blue-400/60 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-2xl dark:hover:shadow-[0_8px_35px_rgba(59,130,246,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden text-slate-900 dark:text-white theme-glow-border"
      aria-label="PDFSun Global Enterprise Suite"
    >
      {/* Background Radial Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 dark:group-hover:bg-blue-600/25 transition-all" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Badges Bar with WCAG AAA Standards */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD] dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40 shadow-2xs">
            <Globe className="w-3 h-3 text-[#1E40AF] dark:text-blue-400" />
            <span>{t("enterpriseSuite.badgeGlobal", "GLOBAL ENTERPRISE SUITE")}</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-2xs">
            <Cpu className="w-3 h-3 text-[#92400E] dark:text-amber-400" />
            <span>{t("enterpriseSuite.badgeWasm", "WASM MULTI-THREAD ENGINE")}</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7] dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 ml-auto hidden sm:inline-flex shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-[#065F46] dark:text-emerald-400 mr-0.5" />
            {t("enterpriseSuite.badgeSoc", "SOC-2 & GDPR Ready")}
          </span>
        </div>

        {/* Title & Core Value Proposition */}
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2 tracking-tight flex items-center space-x-2">
            <span>{t("enterpriseSuite.title", "PDFSun Global Enterprise Suite")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
            {t("enterpriseSuite.description", "Empower high-volume teams with zero-knowledge, in-browser WebAssembly document automation, hardware-accelerated batch conversions, and enterprise identity federation.")}
          </p>
        </div>

        {/* Capability Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xs flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">&lt;200ms</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{t("enterpriseSuite.edgeSpeed", "Edge Speed")}</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400">{t("enterpriseSuite.edgeSpeedSub", "Zero cloud latency (<200ms)")}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xs flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
              <KeyRound className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">SAML 2.0</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{t("enterpriseSuite.enterpriseSso", "Enterprise SSO")}</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400">{t("enterpriseSuite.enterpriseSsoSub", "Okta & Azure AD (SAML 2.0)")}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xs flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <Lock className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">256-Bit</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{t("enterpriseSuite.zeroLeakage", "Zero Leakage")}</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400">{t("enterpriseSuite.zeroLeakageSub", "Pure client sandbox (256-Bit)")}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xs flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">99.99%</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{t("enterpriseSuite.uptimeSla", "Uptime SLA")}</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400">{t("enterpriseSuite.uptimeSlaSub", "Offline PWA ready (99.99%)")}</div>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-medium">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>{t("enterpriseSuite.aiCopilot", "AI Copilot & Smart Summaries")}</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
            <Layers className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>{t("enterpriseSuite.unlimitedBatching", "Unlimited Concurrent Batching")}</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
            <FileCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{t("enterpriseSuite.auditProofLedger", "Audit-Proof Ledger & Invoicing")}</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-6 mt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLaunchCopilot}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("copilot.cta", "Launch AI Assistant")}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>

          <button
            type="button"
            onClick={handleOpenEnterprisePlans}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-white/15 transition cursor-pointer active:scale-95"
          >
            <span>{t("enterpriseSuite.cta", "Explore Enterprise Solutions")}</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
          {t("badges.tools50", "66+ Tools")} • {t("badges.privacyTitle", "100% In-Browser Privacy")}
        </span>
      </div>
    </div>
  );
};
