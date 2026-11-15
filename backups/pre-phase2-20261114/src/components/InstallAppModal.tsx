import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  QrCode,
  Laptop,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Info,
  Loader2,
  RotateCw,
} from "lucide-react";
import { PDFSunLogoIcon } from "./PDFSunLogo";
import { usePWAStatus, BeforeInstallPromptEvent, getGlobalDeferredPrompt } from "../pwaRegister";
import { getQrCodeDataUrl } from "../lib/qrGenerator";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "install" | "ios" | "android" | "desktop" | "qr";
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  initialTab,
}) => {
  const {
    isInstalled: hookInstalled,
    hasNativePrompt: hookHasPrompt,
    platform,
    installPWA,
  } = usePWAStatus();

  // Local state for beforeinstallprompt event
  const [nativePromptEvent, setNativePromptEvent] = useState<BeforeInstallPromptEvent | null>(() => {
    return getGlobalDeferredPrompt() || (typeof window !== "undefined" ? (window as any).deferredPrompt || null : null);
  });
  const [isInstalledLocal, setIsInstalledLocal] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      hookInstalled ||
      localStorage.getItem("pdfsun_pwa_installed") === "true" ||
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  });

  // Listen directly to beforeinstallprompt and appinstalled events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvt = e as BeforeInstallPromptEvent;
      setNativePromptEvent(promptEvt);
      (window as any).deferredPrompt = promptEvt;
      console.log("[InstallAppModal] Captured beforeinstallprompt event inside modal");
    };

    const handleAppInstalled = () => {
      setNativePromptEvent(null);
      (window as any).deferredPrompt = null;
      setIsInstalledLocal(true);
      setInstallStatus("success");
      localStorage.setItem("pdfsun_pwa_installed", "true");
      console.log("[InstallAppModal] App installation confirmed via appinstalled event");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Sync if prompt is already present globally
    const existing = getGlobalDeferredPrompt() || (window as any).deferredPrompt;
    if (existing && !nativePromptEvent) {
      setNativePromptEvent(existing);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [nativePromptEvent]);

  // Auto-select tab based on device detection or prop
  const getInitialTab = () => {
    if (initialTab) return initialTab;
    if (platform.isIOS) return "ios";
    if (platform.isAndroid) return "android";
    if (platform.isMobile) return "install";
    return "qr";
  };

  const [activeTab, setActiveTab] = useState<"install" | "ios" | "android" | "desktop" | "qr">(getInitialTab);
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "success" | "dismissed" | "guide">("idle");
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const websiteUrl = "https://www.pdfsun.in/";

  useEffect(() => {
    let isMounted = true;
    getQrCodeDataUrl(websiteUrl, {
      size: 260,
      margin: 2,
      darkColor: "#0f172a",
      lightColor: "#ffffff",
      errorCorrectionLevel: "H",
    }).then((url) => {
      if (isMounted) {
        setQrDataUrl(url);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [websiteUrl]);

  const isActuallyInstalled = isInstalledLocal || hookInstalled;
  const hasPromptAvailable = Boolean(nativePromptEvent || hookHasPrompt || (typeof window !== "undefined" && (window as any).deferredPrompt));

  const handleTriggerInstall = async () => {
    const promptToUse = nativePromptEvent || getGlobalDeferredPrompt() || (typeof window !== "undefined" ? (window as any).deferredPrompt : null);

    if (promptToUse && typeof promptToUse.prompt === "function") {
      setInstallStatus("installing");
      try {
        console.log("[InstallAppModal] Triggering native browser install prompt dialog");
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        console.log("[InstallAppModal] User install choice outcome:", choice.outcome);

        if (choice.outcome === "accepted") {
          setInstallStatus("success");
          setNativePromptEvent(null);
          (window as any).deferredPrompt = null;
          setIsInstalledLocal(true);
          localStorage.setItem("pdfsun_pwa_installed", "true");
          setTimeout(() => {
            onClose();
          }, 2400);
        } else {
          setInstallStatus("dismissed");
        }
        return;
      } catch (err) {
        console.error("[InstallAppModal] Failed to trigger native install prompt:", err);
      }
    }

    // Fallback if beforeinstallprompt is not available on this browser/platform (e.g. iOS Safari)
    setInstallStatus("installing");
    const result = await installPWA();
    if (result === "accepted" || result === "already-installed") {
      setInstallStatus("success");
      setIsInstalledLocal(true);
      setTimeout(() => {
        onClose();
      }, 2400);
    } else if (result === "manual-guide") {
      setInstallStatus("guide");
      if (platform.isIOS) {
        setActiveTab("ios");
      } else if (platform.isAndroid) {
        setActiveTab("android");
      } else {
        setActiveTab("desktop");
      }
    } else {
      setInstallStatus("idle");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        >
          {/* Header Banner with App Identity */}
          <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 sm:p-6 text-white">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="shrink-0 p-1 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20 shadow-lg">
                <PDFSunLogoIcon variant="app-icon" size={60} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    Official PWA
                  </span>
                  {isActuallyInstalled ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Installed</span>
                    </span>
                  ) : hasPromptAvailable ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/20 text-sky-200 border border-sky-400/30 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Instant 1-Click Ready</span>
                    </span>
                  ) : null}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  PDFSun Mobile &amp; Desktop App
                </h2>
                <p className="text-xs sm:text-sm text-blue-100/90 font-medium truncate">
                  High-speed PDF suite installed directly to your device.
                </p>
              </div>
            </div>

            {/* Quick Feature Pills */}
            <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-blue-100">
              <div className="flex items-center justify-center space-x-1 bg-white/10 py-1.5 px-2 rounded-xl">
                <Zap className="w-3 h-3 text-amber-300 shrink-0" />
                <span>Instant Launch</span>
              </div>
              <div className="flex items-center justify-center space-x-1 bg-white/10 py-1.5 px-2 rounded-xl">
                <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center justify-center space-x-1 bg-white/10 py-1.5 px-2 rounded-xl">
                <Sparkles className="w-3 h-3 text-sky-300 shrink-0" />
                <span>Offline-Ready</span>
              </div>
            </div>
          </div>

          {/* Navigation Device Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 sm:px-6 overflow-x-auto scrollbar-none gap-1 py-2">
            <button
              type="button"
              onClick={() => setActiveTab("install")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "install"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Direct Install</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ios")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "ios"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>🍎 iPhone / iPad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("android")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "android"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>🤖 Android</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "qr"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Phone QR Scan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("desktop")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "desktop"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>PC / Mac</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* TAB: DIRECT INSTALL */}
            {activeTab === "install" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white font-bold block mb-1">
                      Native Progressive Web App — Zero Storage Waste
                    </strong>
                    Install PDFSun directly to your home screen or desktop launcher without needing Google Play or Apple App Store.
                  </div>
                </div>

                {isActuallyInstalled ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                      PDFSun App is installed on this device!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      You can launch it anytime from your home screen, app drawer, or desktop menu.
                    </p>
                  </div>
                ) : installStatus === "success" ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
                    <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                      🎉 Installation Accepted!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      PDFSun has been added to your device. Closing in a moment...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleTriggerInstall}
                      disabled={installStatus === "installing"}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer active:scale-98 disabled:opacity-75"
                    >
                      {installStatus === "installing" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Triggering Browser Install Dialog...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span>
                            {hasPromptAvailable
                              ? "Install PDFSun App (Native Prompt)"
                              : "Install PDFSun App"}
                          </span>
                        </>
                      )}
                    </button>

                    {installStatus === "dismissed" && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                        <span>Installation prompt was cancelled. You can try again anytime.</span>
                        <button
                          type="button"
                          onClick={handleTriggerInstall}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 flex items-center space-x-1 cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick device shortcut guides */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ios")}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>iPhone / iPad Setup</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Scan Phone QR</span>
                    <QrCode className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: iOS (SAFARI) INSTRUCTIONS */}
            {activeTab === "ios" && (
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Add PDFSun to iPhone &amp; iPad Home Screen
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Apple requires adding PWAs via Safari in 3 easy steps:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span>Tap the Share Button</span>
                        <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        In Safari bottom toolbar (or top bar on iPad), tap the square icon with an upward arrow.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span>Select &quot;Add to Home Screen&quot;</span>
                        <PlusSquare className="w-3.5 h-3.5 text-amber-500" />
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Scroll down the share sheet and tap &quot;Add to Home Screen&quot; (➕).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span>Tap &quot;Add&quot; in Top Right</span>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Confirm the name &quot;PDFSun&quot; and tap <strong>Add</strong>. The official app icon will appear on your home screen!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANDROID INSTRUCTIONS */}
            {activeTab === "android" && (
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Install on Android (Chrome / Edge / Samsung)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Fast 1-tap installation directly from browser:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  disabled={installStatus === "installing"}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  {installStatus === "installing" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {hasPromptAvailable
                      ? "Show Native Android Install Prompt"
                      : "Tap Here to Install PDFSun on Android"}
                  </span>
                </button>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Click &quot;Install App&quot; Button Above
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Or tap the 3 dots (⋮) in Chrome menu and choose &quot;Install app&quot; or &quot;Add to Home screen&quot;.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Confirm Installation
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Tap &quot;Install&quot;. The app icon will be pinned to your launcher and home screen instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: QR CODE PHONE SCAN */}
            {activeTab === "qr" && (
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Scan with Your Phone Camera
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Open your iPhone Camera or Google Lens on Android to install PDFSun on mobile:
                  </p>
                </div>

                <div className="relative inline-block bg-white p-3 rounded-2xl border border-slate-200 shadow-md min-w-[200px] min-h-[200px] flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="PDFSun App Installation QR Code"
                      width={200}
                      height={200}
                      className="mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-1.5 rounded-xl shadow-md border border-slate-200">
                      <PDFSunLogoIcon variant="app-icon" size={28} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedLink ? "Link Copied" : "Copy Website URL"}</span>
                  </button>

                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                  >
                    <span>Visit Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB: DESKTOP PC / MAC */}
            {activeTab === "desktop" && (
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Install on Windows PC, Mac &amp; Chromebook
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Launch PDFSun as a standalone desktop application:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  disabled={installStatus === "installing"}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  {installStatus === "installing" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {hasPromptAvailable
                      ? "Show Native Desktop Install Dialog"
                      : "Trigger Desktop Install Prompt"}
                  </span>
                </button>

                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <strong className="font-bold text-slate-900 dark:text-white block">
                      Google Chrome &amp; Microsoft Edge:
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Look at the top URL address bar and click the <strong>Install Icon (⤓ or 💻)</strong> on the right side of the address bar, then click &quot;Install&quot;.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <strong className="font-bold text-slate-900 dark:text-white block">
                      Apple Safari on macOS Sonoma+:
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Click <strong>File</strong> in the top menu bar &gt; <strong>Add to Dock...</strong> &gt; Confirm &quot;PDFSun&quot;.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

