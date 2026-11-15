import React, { useState, useEffect } from "react";
import {
  Play,
  Sparkles,
  Loader2,
  Download,
  CheckCircle2,
  Star,
  ThumbsUp,
  Share2,
  RotateCcw,
  X,
  ShieldCheck,
} from "lucide-react";

export type ToolActionBarState = "idle" | "processing" | "ready" | "downloaded";

export interface UniversalToolActionBarProps {
  /** The human-readable name of the tool, e.g. "Merge PDF", "PDF to Word" */
  toolName: string;
  /** Name of the generated file (used for extension badge & download), e.g. "document.docx" */
  outputFileName?: string;
  /** Primary trigger to execute the tool process (State 1 -> State 2) */
  onProcess: () => void | Promise<void>;
  /** Trigger to cancel the running operation or reset back to initial file select */
  onReset?: () => void;
  /** Explicit override for lifecycle state if parent manages it */
  state?: ToolActionBarState;
  /** True while local client-side WASM/JS engine is compiling or executing */
  isProcessing?: boolean;
  /** True when conversion has produced a downloadable output */
  isReady?: boolean;
  /** True when user has triggered the browser download */
  isDownloaded?: boolean;
  /** Disables the primary action button (e.g. no files selected, validation error) */
  disabled?: boolean;
  /** Optional custom download handler. If omitted, onProcess or default download is called */
  onDownload?: () => void | Promise<void>;
  /** Rating score shown in the center section (default: 4.9) */
  rating?: number;
  /** Total user reviews count (default: 128) */
  reviewsCount?: number;
  /** Current like count (default: 48) */
  likeCount?: number;
  /** Whether the active user has liked this tool */
  hasLiked?: boolean;
  /** Callback when user clicks the Like button */
  onToggleLike?: () => void;
  /** Callback to open the review/rating modal */
  onOpenReview?: () => void;
  /** Callback to open the share modal */
  onOpenShare?: () => void;
  /** Optional custom class name for the wrapper */
  className?: string;
  /** Whether the action bar should be sticky to viewport bottom (default: false / dockable) */
  sticky?: boolean;
  /** Optional processing status message e.g. "Reconstructing OpenXML layers..." */
  statusMessage?: string;
}

export const UniversalToolActionBar: React.FC<UniversalToolActionBarProps> = ({
  toolName,
  outputFileName,
  onProcess,
  onReset,
  state: controlledState,
  isProcessing = false,
  isReady = false,
  isDownloaded = false,
  disabled = false,
  onDownload,
  rating = 4.9,
  reviewsCount = 128,
  likeCount: controlledLikeCount = 48,
  hasLiked: controlledHasLiked = false,
  onToggleLike,
  onOpenReview,
  onOpenShare,
  className = "",
  sticky = false,
  statusMessage,
}) => {
  // Internal state tracking if not explicitly provided
  const [internalState, setInternalState] = useState<ToolActionBarState>("idle");
  const [internalLiked, setInternalLiked] = useState<boolean>(controlledHasLiked);
  const [internalLikes, setInternalLikes] = useState<number>(controlledLikeCount);

  // Sync internal likes if parent props change
  useEffect(() => {
    setInternalLiked(controlledHasLiked);
    setInternalLikes(controlledLikeCount);
  }, [controlledHasLiked, controlledLikeCount]);

  // Derive active lifecycle state machine
  const computedState: ToolActionBarState = React.useMemo(() => {
    if (controlledState) return controlledState;
    if (isProcessing) return "processing";
    if (isDownloaded) return "downloaded";
    if (isReady) return "ready";
    return internalState;
  }, [controlledState, isProcessing, isReady, isDownloaded, internalState]);

  // Extract file extension for dynamic badge (e.g., .DOCX, .PDF, .XLSX)
  const dynamicExtension = React.useMemo(() => {
    if (!outputFileName) return "";
    const match = outputFileName.match(/\.([0-9a-z]+)$/i);
    return match ? `.${match[1].toUpperCase()}` : "";
  }, [outputFileName]);

  // Handle Like trigger with micro-animation
  const handleLikeClick = () => {
    if (onToggleLike) {
      onToggleLike();
    } else {
      setInternalLiked((prev) => {
        const next = !prev;
        setInternalLikes((c) => (next ? c + 1 : Math.max(0, c - 1)));
        return next;
      });
    }
  };

  // Primary action button click router based on current state
  const handlePrimaryAction = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (computedState === "idle") {
      setInternalState("processing");
      try {
        await onProcess();
      } catch {
        setInternalState("idle");
      }
    } else if (computedState === "ready") {
      if (onDownload) {
        await onDownload();
      } else {
        await onProcess();
      }
      setInternalState("downloaded");
    }
  };

  // Reset or Cancel click router
  const handleResetOrCancel = () => {
    if (computedState === "downloaded" || computedState === "ready") {
      setInternalState("idle");
    }
    if (onReset) {
      onReset();
    }
  };

  // Label and icon resolution per State Machine rule
  const renderPrimaryAction = () => {
    switch (computedState) {
      case "processing":
        return (
          <button
            type="button"
            disabled
            aria-busy="true"
            aria-label="Processing document locally"
            className="w-full sm:w-auto min-w-[210px] px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#ff5722] to-[#f57c00] opacity-80 cursor-not-allowed shadow-md animate-pulse flex items-center justify-center gap-2 select-none"
          >
            <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
            <span className="truncate">{statusMessage || "Processing..."}</span>
          </button>
        );

      case "ready":
        return (
          <button
            type="button"
            onClick={handlePrimaryAction}
            aria-label={`Download converted file ${dynamicExtension || ""}`}
            className="w-full sm:w-auto min-w-[210px] px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all duration-200 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40 hover:ring-emerald-400 animate-pulse flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <Download className="w-4 h-4 text-white shrink-0" />
            <span className="truncate">
              Download {dynamicExtension ? dynamicExtension : ""}
            </span>
          </button>
        );

      case "downloaded":
        return (
          <button
            type="button"
            onClick={handleResetOrCancel}
            aria-label="File downloaded successfully. Click to process another document."
            className="w-full sm:w-auto min-w-[210px] px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 shadow-inner cursor-pointer transition-all flex items-center justify-center gap-2 select-none"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20 shrink-0" />
            <span>Downloaded ✓ (New File)</span>
          </button>
        );

      case "idle":
      default:
        return (
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={disabled}
            aria-label={`Run ${toolName}`}
            className={`w-full sm:w-auto min-w-[210px] px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
              disabled
                ? "bg-slate-400 dark:bg-slate-700 opacity-50 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-[#ff5722] to-[#f57c00] hover:from-[#f4511e] hover:to-[#e65100] hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 cursor-pointer"
            }`}
          >
            <Play className="w-4 h-4 fill-white text-white shrink-0 ml-0.5" />
            <span className="truncate">Run {toolName}</span>
          </button>
        );
    }
  };

  const leftButtonLabel = () => {
    if (computedState === "processing") return "Cancel Operation";
    if (computedState === "ready" || computedState === "downloaded") return "Reset & New File";
    return "Cancel";
  };

  const leftButtonIcon = () => {
    if (computedState === "processing") return <X className="w-3.5 h-3.5 text-rose-500" />;
    if (computedState === "ready" || computedState === "downloaded") return <RotateCcw className="w-3.5 h-3.5 text-slate-500" />;
    return null;
  };

  return (
    <footer
      role="region"
      aria-label="Tool Action Bar"
      className={`universal-tool-action-bar w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-800 dark:text-slate-100 transition-all ${
        sticky ? "sticky bottom-0 z-40 shadow-2xl" : ""
      } ${className}`}
    >
      {/* Left Section: Clean Cancel / Reset button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleResetOrCancel}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-orange-500"
        >
          {leftButtonIcon()}
          <span>{leftButtonLabel()}</span>
        </button>

        {/* Local WASM Privacy Badge Indicator */}
        <span
          className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg"
          title="100% Client-Side WebAssembly processing. No document data ever leaves your device."
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local WASM Safe</span>
        </span>
      </div>

      {/* Center Section: Rating score badge (4.9 ★), Like count trigger (👍 48), and Share action trigger */}
      <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs">
        {/* Star Rating & Reviews Trigger */}
        <button
          type="button"
          onClick={onOpenReview}
          className="px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
          title={`Rating: ${rating} / 5 based on ${reviewsCount} verified user ratings`}
          aria-label={`View user ratings: ${rating} out of 5 stars`}
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
          <span>{rating}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
            ({reviewsCount})
          </span>
        </button>

        <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />

        {/* Like Toggle Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
            internalLiked
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Like this tool"
          aria-label={`Like this tool (${internalLikes} likes)`}
        >
          <ThumbsUp
            className={`w-3.5 h-3.5 ${
              internalLiked ? "fill-amber-500 text-amber-500" : ""
            }`}
          />
          <span>{internalLikes}</span>
        </button>

        <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />

        {/* Quick Share Trigger */}
        <button
          type="button"
          onClick={onOpenShare}
          className="px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
          title="Share this tool"
          aria-label="Share this tool"
        >
          <Share2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="hidden xs:inline">Share</span>
        </button>
      </div>

      {/* Right Section: Dynamic Primary Action Button (State 1 -> State 2 -> State 3 -> State 4) */}
      <div className="flex items-center w-full sm:w-auto">
        {renderPrimaryAction()}
      </div>
    </footer>
  );
};
export default UniversalToolActionBar;
