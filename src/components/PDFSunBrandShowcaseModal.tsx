import React, { useState, useRef } from "react";
import {
  X,
  Copy,
  Download,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  Palette,
  Type,
  Grid,
  Smartphone,
  Globe,
  CreditCard,
  Share2,
  ExternalLink,
  Info,
  Sliders,
  Sun,
  Award,
} from "lucide-react";
import { PDFSunLogo, PDFSunLogoIcon } from "./PDFSunLogo";
import { triggerErrorToast } from "./GlobalErrorToast";

interface PDFSunBrandShowcaseModalProps {
  onClose: () => void;
}

export const PDFSunBrandShowcaseModal: React.FC<PDFSunBrandShowcaseModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "logos" | "colors" | "typography" | "grid" | "mockups"
  >("logos");

  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(label);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const svgHorizontalString = `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pdfGrad" x1="10" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="60%" stop-color="#0B3D91"/>
      <stop offset="100%" stop-color="#09275E"/>
    </linearGradient>
    <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF566"/>
      <stop offset="45%" stop-color="#FFC107"/>
      <stop offset="90%" stop-color="#FF7A00"/>
    </linearGradient>
  </defs>
  <g transform="translate(10, 10) scale(0.6)">
    <circle cx="68" cy="32" r="18" fill="url(#sunGrad)" />
    <path d="M 22 14 C 18 14, 15 17, 15 21 L 15 81 C 15 85, 18 88, 22 88 L 68 88 C 72 88, 75 85, 75 81 L 75 38 L 51 14 Z" fill="url(#pdfGrad)" />
    <path d="M 51 14 L 75 38 L 56 38 C 53 38, 51 36, 51 33 Z" fill="#60A5FA" />
    <rect x="25" y="46" width="36" height="4.5" rx="2.25" fill="#FFFFFF" />
    <rect x="25" y="56" width="44" height="4.5" rx="2.25" fill="#60A5FA" />
    <rect x="25" y="66" width="28" height="4.5" rx="2.25" fill="#FFC107" />
  </g>
  <text x="80" y="48" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#0B3D91">PDF</text>
  <text x="160" y="48" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#FF7A00">Sun</text>
  <text x="80" y="66" font-family="monospace" font-weight="700" font-size="14" fill="#64748B">pdfsun.in</text>
</svg>`;

  const handleDownloadSvg = (filename: string, svgContent: string) => {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const colors = [
    {
      name: "Primary Deep Navy",
      hex: "#0B3D91",
      rgb: "rgb(11, 61, 145)",
      role: "Main PDF Document Core, Header Typography & High-Contrast Accents",
      bgClass: "bg-[#0B3D91]",
    },
    {
      name: "Royal Blue",
      hex: "#2563EB",
      rgb: "rgb(37, 99, 235)",
      role: "Interactive UI Elements, Primary Buttons & Vector Gradients",
      bgClass: "bg-[#2563EB]",
    },
    {
      name: "Luxury Sun Orange",
      hex: "#FF7A00",
      rgb: "rgb(255, 122, 0)",
      role: "Sun Brand Mark, Gradient Typography & Feature Highlights",
      bgClass: "bg-[#FF7A00]",
    },
    {
      name: "Golden Yellow",
      hex: "#FFC107",
      rgb: "rgb(255, 193, 7)",
      role: "Sun Rays, Golden Glow Accents & Badge Highlights",
      bgClass: "bg-[#FFC107]",
    },
    {
      name: "Smart AI Cyan",
      hex: "#38BDF8",
      rgb: "rgb(56, 189, 248)",
      role: "Gemini 3.6 AI Sparkle, Live Status Badges & Glow Overlays",
      bgClass: "bg-[#38BDF8]",
    },
    {
      name: "Deep Slate Canvas",
      hex: "#0F172A",
      rgb: "rgb(15, 23, 42)",
      role: "Dark Mode Backgrounds, Modern Contrast Cards & Footers",
      bgClass: "bg-[#0F172A]",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PDFSunLogoIcon size={42} variant="rounded-square" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  PDFSun.in Brand Identity Guidelines
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Official Master Kit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pentagram & Apple-Grade Brand System for PDFSun.in — Your Smart Document Companion
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {[
            { id: "logos", label: "Logo Variants & SVG", icon: Layers },
            { id: "colors", label: "Color Palette & Hex", icon: Palette },
            { id: "typography", label: "Typography Rules", icon: Type },
            { id: "grid", label: "Safe Space & Geometry", icon: Grid },
            { id: "mockups", label: "Brand Mockup Gallery", icon: Smartphone },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 text-xs font-extrabold transition flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-amber-500 text-slate-900 dark:text-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? "text-amber-500" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: LOGOS */}
          {activeTab === "logos" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Official Logo Assets & Composition
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Vector precision SVG logos crafted for headers, mobile apps, favicons, dark/light themes, and print.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadSvg("pdfsun-master-logo.svg", svgHorizontalString)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs shadow-md hover:brightness-105 transition flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Master SVG</span>
                </button>
              </div>

              {/* Grid of Variants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Primary Horizontal Logo (Light Canvas) */}
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Primary Horizontal Logo (Light)
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                      Header / Navbar
                    </span>
                  </div>
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                    <PDFSunLogo layout="horizontal" size="lg" theme="light" showTagline />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(svgHorizontalString, "horiz")}
                      className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center space-x-1.5"
                    >
                      {copiedIndex === "horiz" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === "horiz" ? "Copied SVG" : "Copy SVG Code"}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Primary Horizontal Logo (Dark Canvas) */}
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Primary Horizontal Logo (Dark)
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 rounded-md">
                      Dark Mode & Hero
                    </span>
                  </div>
                  <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <PDFSunLogo layout="horizontal" size="lg" theme="dark" showTagline />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(svgHorizontalString, "dark")}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center justify-center space-x-1.5"
                    >
                      {copiedIndex === "dark" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === "dark" ? "Copied SVG" : "Copy SVG Code"}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Vertical Stack Logo */}
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Vertical Stacked Centered Logo
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md">
                      Splash Screen / Cards
                    </span>
                  </div>
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                    <PDFSunLogo layout="vertical" size="xl" showTagline />
                  </div>
                </div>

                {/* 4. App Icon & Favicon Suite */}
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      App Store & Favicon Suite
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                      512×512 & 32×32
                    </span>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-around">
                    <div className="text-center space-y-2">
                      <PDFSunLogoIcon size={64} variant="rounded-square" />
                      <p className="text-[10px] font-mono text-slate-400">PWA 512px Icon</p>
                    </div>
                    <div className="text-center space-y-2">
                      <PDFSunLogoIcon size={48} variant="circle" />
                      <p className="text-[10px] font-mono text-slate-400">Avatar Circle</p>
                    </div>
                    <div className="text-center space-y-2">
                      <PDFSunLogoIcon size={32} variant="glass" />
                      <p className="text-[10px] font-mono text-slate-400">Favicon 32px</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS */}
          {activeTab === "colors" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Official Brand Color Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Precision HSB & RGB color formulas engineered for trust, document safety, and high-energy AI productivity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {colors.map((c) => (
                  <div
                    key={c.hex}
                    className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-md group hover:border-amber-500/50 transition"
                  >
                    <div className={`h-24 ${c.bgClass} relative p-4 flex items-end justify-between`}>
                      <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {c.hex}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(c.hex, c.hex)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition"
                        title="Copy Hex Code"
                      >
                        {copiedIndex === c.hex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {c.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">{c.rgb}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {c.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY */}
          {activeTab === "typography" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Geometric Typography Hierarchy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paired display sans-serif fonts with mathematical step ratio scale for pristine clarity across all screens.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-6">
                <div className="space-y-4">
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                      Display Title (64px / 1.125 Scale)
                    </span>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                      PDFSun <span className="text-amber-500">Document Engine</span>
                    </h1>
                  </div>

                  <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-500 font-bold">
                      Heading 2 (28px / Bold 800)
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                      Your Smart Document Companion
                    </h2>
                  </div>

                  <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-500 font-bold">
                      Body Copy (16px / Regular 400 / Line Height 1.6)
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1 max-w-2xl">
                      PDFSun.in empowers students, lawyers, and global enterprises with instant, client-side PDF editing, AI document summarization, and bank-grade privacy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GRID & SAFE SPACE */}
          {activeTab === "grid" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Safe Space & Geometry Rules
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimum clearance margins equal to the height of the PDF folded sheet icon ("X").
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                {/* Visual Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                
                <div className="relative border-2 border-dashed border-amber-500/60 p-8 rounded-2xl bg-slate-900/90 shadow-2xl">
                  <span className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-mono font-black rounded">
                    SAFE CLEARANCE ZONE (1.5X)
                  </span>
                  <PDFSunLogo layout="horizontal" size="xl" theme="dark" showTagline />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MOCKUPS */}
          {activeTab === "mockups" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Brand Applications & Mockups
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visual previews showing PDFSun.in across web headers, app icons, business cards & browser tabs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mockup 1: Mobile App Icon */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile App Home Screen</span>
                  </div>
                  <div className="h-44 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-4 flex items-center justify-center space-x-6">
                    <div className="text-center space-y-1">
                      <PDFSunLogoIcon size={56} variant="rounded-square" />
                      <p className="text-[10px] font-semibold text-white">PDFSun</p>
                    </div>
                    <div className="text-center space-y-1 opacity-50">
                      <div className="w-14 h-14 rounded-[22%] bg-slate-800" />
                      <p className="text-[10px] font-semibold text-slate-400">Files</p>
                    </div>
                    <div className="text-center space-y-1 opacity-50">
                      <div className="w-14 h-14 rounded-[22%] bg-slate-800" />
                      <p className="text-[10px] font-semibold text-slate-400">Notes</p>
                    </div>
                  </div>
                </div>

                {/* Mockup 2: Business Card */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
                    <CreditCard className="w-4 h-4" />
                    <span>Executive Business Card</span>
                  </div>
                  <div className="h-44 rounded-2xl bg-gradient-to-tr from-[#0B3D91] via-slate-900 to-slate-950 p-6 flex flex-col justify-between border border-blue-500/30">
                    <PDFSunLogo layout="horizontal" size="sm" theme="dark" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Mukesh Kalonia</h4>
                      <p className="text-[10px] text-amber-400 font-mono">Founder & CEO • pdfsun.in</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Trademark Registered Identity • 2026 PDFSun.in</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
