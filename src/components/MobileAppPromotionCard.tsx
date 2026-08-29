import React, { useState } from "react";
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Globe,
  Bot,
  WifiOff,
  Compass,
  ArrowRight,
} from "lucide-react";
import { PDFSunLogoIcon } from "./PDFSunLogo";
import { usePWAStatus } from "../pwaRegister";
import { InstallAppModal } from "./InstallAppModal";
import { useLanguage } from "../lib/i18n";

interface MobileAppPromotionCardProps {
  className?: string;
}

export const MobileAppPromotionCard: React.FC<MobileAppPromotionCardProps> = ({
  className = "",
}) => {
  const { t } = useLanguage();
  const { isInstalled, installPWA, platform } = usePWAStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"install" | "ios" | "android" | "desktop" | "qr">("install");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const websiteUrl = "https://www.pdfsun.in/";
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    websiteUrl
  )}&ecc=H&margin=6&color=0f172a&bgcolor=ffffff`;

  const handleInstall = async () => {
    if (isInstalled) {
      setModalTab("install");
      setModalOpen(true);
      return;
    }

    if (platform.isIOS) {
      setModalTab("ios");
      setModalOpen(true);
      return;
    }

    setIsInstalling(true);
    const outcome = await installPWA();
    setIsInstalling(false);

    if (outcome === "manual-guide" || outcome === "dismissed") {
      setModalTab(platform.isAndroid ? "android" : "install");
      setModalOpen(true);
    }
  };

  const handleOpenGuide = () => {
    setModalTab(platform.isIOS ? "ios" : platform.isAndroid ? "android" : "qr");
    setModalOpen(true);
  };

  const handleContinueInBrowser = () => {
    const toolsEl = document.getElementById("tools");
    if (toolsEl) {
      toolsEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const benefitChips = [
    { icon: Zap, label: t("mobilePromo.instantLaunch", "⚡ Instant Launch"), color: "text-amber-400" },
    { icon: ShieldCheck, label: t("mobilePromo.privacyFocused", "🔒 Privacy-Focused"), color: "text-emerald-400" },
    { icon: Smartphone, label: t("mobilePromo.mobileOptimized", "📱 Mobile Optimized"), color: "text-sky-400" },
    { icon: Bot, label: t("mobilePromo.aiTools", "🤖 AI PDF Tools"), color: "text-cyan-400" },
    { icon: Globe, label: t("mobilePromo.multiLang", "🌍 Multi-Language"), color: "text-indigo-400" },
    { icon: WifiOff, label: t("mobilePromo.offlineReady", "📴 Offline-Ready Tools*"), color: "text-orange-400" },
  ];

  return (
    <section
      id="mobile-app-section"
      className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-10 ${className}`}
      aria-label="PDFSun Mobile App Section"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-7 lg:p-9 border border-blue-800/40 shadow-2xl">
        {/* Subtle decorative background lights */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Brand, Description, Benefits & CTAs */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header Badge & Title */}
            <div>
              <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-xs">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  {t("mobilePromo.officialBadge", "OFFICIAL PDFSUN MOBILE APP")}
                </span>
                {isInstalled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t("mobilePromo.installed", "Installed")}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="p-1 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-md shrink-0">
                  <PDFSunLogoIcon variant="app-icon" size={48} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                    {t("mobilePromo.title", "PDFSun Mobile App")}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-blue-200">
                    {t("mobilePromo.tagline", "Your complete PDF workspace, right on your phone.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-blue-100/90 font-normal leading-relaxed max-w-2xl">
              {t(
                "mobilePromo.desc",
                "Fast, private and mobile-optimized access to PDFSun tools, AI document features and your everyday PDF workflow."
              )}
            </p>

            {/* Compact Benefit Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {benefitChips.map((chip, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-100 transition-colors"
                >
                  <span className="shrink-0">{chip.label.slice(0, 2)}</span>
                  <span className="truncate">{chip.label.slice(2).trim()}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap sm:flex-nowrap">
              {/* Install PWA Button */}
              <button
                type="button"
                id="promo-card-install-btn"
                onClick={handleInstall}
                disabled={isInstalling}
                className={`py-2.5 px-5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-75 ${
                  isInstalled
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/30 hover:scale-102"
                }`}
              >
                {isInstalled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>✓ {t("mobilePromo.appInstalled", "PDFSun App Installed")}</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 text-white" />
                    <span>
                      {isInstalling
                        ? t("mobilePromo.opening", "Opening...")
                        : t("mobilePromo.installBtn", "Install PDFSun App")}
                    </span>
                  </>
                )}
              </button>

              {/* Continue in Browser Button */}
              <button
                type="button"
                id="promo-card-browser-btn"
                onClick={handleContinueInBrowser}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Compass className="w-4 h-4 text-cyan-300" />
                <span>{t("mobilePromo.continueInBrowser", "Continue in Browser")}</span>
              </button>

              {/* How to Install & QR Link */}
              <button
                type="button"
                id="promo-card-guide-btn"
                onClick={handleOpenGuide}
                className="py-2 px-3 rounded-lg text-blue-200 hover:text-white font-medium text-xs flex items-center space-x-1.5 transition underline-offset-4 hover:underline cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{t("mobilePromo.howToInstall", "How to Install & QR")}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Scan QR Code Card */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20 text-center max-w-[260px] w-full">
              <div className="flex items-center justify-between mb-2.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                  <Smartphone className="w-3 h-3 text-blue-600" />
                  <span>Scan to Install</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200">
                  Mobile / PWA
                </span>
              </div>

              {/* QR Code Container with Center Logo Badge */}
              <div className="relative inline-block bg-white p-1.5 rounded-xl border border-slate-100 shadow-inner">
                <img
                  src={qrApiUrl}
                  alt="Scan to open PDFSun Mobile App"
                  width={150}
                  height={150}
                  className="rounded-md mx-auto"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200">
                    <PDFSunLogoIcon variant="app-icon" size={20} />
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-700 mt-2 leading-snug">
                Point your camera to open <br />
                <span className="text-blue-600 font-black break-all">{websiteUrl}</span>
              </p>

              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-2.5 w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                {copiedLink ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-600" />
                )}
                <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <InstallAppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
      />
    </section>
  );
};
