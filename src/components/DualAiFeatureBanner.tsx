import React from "react";
import { Sparkles, Bot, Globe, ShieldCheck, Zap, ArrowRight, Cpu, Lock, FileText, CheckCircle2 } from "lucide-react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

interface DualAiFeatureBannerProps {
  onSelectTool: (tool: ToolItem) => void;
  onOpenContactModal?: () => void;
}

export const DualAiFeatureBanner: React.FC<DualAiFeatureBannerProps> = ({
  onSelectTool,
  onOpenContactModal,
}) => {
  const handleLaunchAi = () => {
    const aiTool = ALL_TOOLS.find((t) => t.slug === "ai-summary" || t.id === "ai-summary" || t.slug === "ai-chat");
    if (aiTool) {
      onSelectTool(aiTool);
    } else if (ALL_TOOLS[0]) {
      onSelectTool(ALL_TOOLS[0]);
    }
  };

  const handleGlobalReach = () => {
    if (onOpenContactModal) {
      onOpenContactModal();
    } else {
      handleLaunchAi();
    }
  };

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
      aria-label="PDFSun AI Pro Features and Global Reach"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: PDFSun AI Copilot (Left) */}
        <div className="relative group rounded-3xl p-6 sm:p-8 bg-[#0f172a]/85 backdrop-blur-xl border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
          {/* Subtle Background Glow Accent */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/25 transition-all" />

          <div>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs">
                <Sparkles className="w-3 h-3 mr-1" /> PRO FEATURE
              </span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs">
                <Bot className="w-3 h-3 mr-1" /> AI POWERED
              </span>
            </div>

            {/* Title & Subheading */}
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 flex items-center space-x-2">
              <span>PDFSun AI Document Copilot</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Summarize, analyze, and chat with massive PDF files in real time using 100% private, client-side WebAssembly processing.
            </p>

            {/* Key Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: "Instant AI Chat", icon: Zap },
                { label: "Multi-Language Translation", icon: Globe },
                { label: "Zero Server Uploads", icon: Lock },
              ].map((tag, idx) => {
                const TagIcon = tag.icon;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-slate-200 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl"
                  >
                    <TagIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{tag.label}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* CTA Button */}
          <div>
            <button
              onClick={handleLaunchAi}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-blue-500/40 hover:scale-102 active:scale-98 transition duration-200 group-hover:from-blue-500 group-hover:to-cyan-400"
            >
              <span>Launch AI Assistant</span>
              <ArrowRight className="w-4 h-4 ml-1 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: Global Enterprise Engine (Right) */}
        <div className="relative group rounded-3xl p-6 sm:p-8 bg-[#0f172a]/85 backdrop-blur-xl border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
          {/* Subtle Background Glow Accent */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/25 transition-all" />

          <div>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs">
                <Globe className="w-3 h-3 mr-1" /> GLOBAL ENTERPRISE
              </span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                <Cpu className="w-3 h-3 mr-1" /> WORLDWIDE SCALE
              </span>
            </div>

            {/* Title & Subheading */}
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 flex items-center space-x-2">
              <span>PDFSun Global Enterprise Suite</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Empower global teams with automated document processing, enterprise encryption, and multi-region deployment.
            </p>

            {/* Key Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: "Global Edge Speed", icon: Zap },
                { label: "256-bit Encryption", icon: ShieldCheck },
                { label: "99.9% Uptime SLA", icon: CheckCircle2 },
              ].map((tag, idx) => {
                const TagIcon = tag.icon;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-slate-200 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl"
                  >
                    <TagIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>{tag.label}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* CTA Button */}
          <div>
            <button
              onClick={handleGlobalReach}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-amber-500 to-orange-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-purple-500/40 hover:scale-102 active:scale-98 transition duration-200 group-hover:from-purple-500 group-hover:to-amber-400"
            >
              <span>Expand Global Reach</span>
              <ArrowRight className="w-4 h-4 ml-1 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
