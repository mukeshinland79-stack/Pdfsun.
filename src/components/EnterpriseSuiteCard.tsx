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
      className="relative group h-full rounded-3xl p-6 sm:p-8 bg-[#0b1329] border border-blue-500/30 hover:border-blue-400/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_35px_rgba(59,130,246,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden text-white"
      aria-label="PDFSun Global Enterprise Suite"
    >
      {/* Background Radial Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/25 transition-all" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>GLOBAL ENTERPRISE SUITE</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>WASM MULTI-THREAD ENGINE</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ml-auto hidden sm:inline-flex">
            <ShieldCheck className="w-3 h-3 text-emerald-400 mr-0.5" />
            SOC-2 &amp; GDPR Ready
          </span>
        </div>

        {/* Title & Core Value Proposition */}
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2 tracking-tight flex items-center space-x-2">
            <span>PDFSun Global Enterprise Suite</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Empower high-volume teams with zero-knowledge, in-browser WebAssembly document automation, hardware-accelerated batch conversions, and enterprise identity federation.
          </p>
        </div>

        {/* Capability Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-400">&lt;200ms</span>
            </div>
            <div className="text-xs font-bold text-white">Edge Speed</div>
            <div className="text-[10px] text-slate-400">Zero cloud latency</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-400 mb-1">
              <KeyRound className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-400">SAML 2.0</span>
            </div>
            <div className="text-xs font-bold text-white">Enterprise SSO</div>
            <div className="text-[10px] text-slate-400">Okta &amp; Azure AD</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <Lock className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-400">256-Bit</span>
            </div>
            <div className="text-xs font-bold text-white">Zero Leakage</div>
            <div className="text-[10px] text-slate-400">Pure client sandbox</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold text-slate-400">99.99%</span>
            </div>
            <div className="text-xs font-bold text-white">Uptime SLA</div>
            <div className="text-[10px] text-slate-400">Offline PWA ready</div>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-300 font-medium">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>AI Copilot &amp; Smart Summaries</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Unlimited Concurrent Batching</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
            <FileCheck className="w-3 h-3 text-emerald-400" />
            <span>Audit-Proof Ledger &amp; Invoicing</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-6 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLaunchCopilot}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch AI Copilot</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>

          <button
            type="button"
            onClick={handleOpenEnterprisePlans}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition cursor-pointer active:scale-95"
          >
            <span>Explore Enterprise Plans</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          66+ Tools • 100% In-Browser Privacy
        </span>
      </div>
    </div>
  );
};
