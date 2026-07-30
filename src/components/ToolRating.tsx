import React, { useState } from "react";
import { Star, CheckCircle2, Sparkles, X } from "lucide-react";

export interface ToolRatingProps {
  toolId: string;
  toolName?: string;
  avgRating: number;
  totalRatings: number;
  userRating?: number;
  onRate: (toolId: string, rating: number) => void;
  size?: "sm" | "md" | "lg";
  showPopoverOnClick?: boolean;
}

export const ToolRating: React.FC<ToolRatingProps> = ({
  toolId,
  toolName,
  avgRating,
  totalRatings,
  userRating,
  onRate,
  size = "sm",
  showPopoverOnClick = true,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isOpenPopover, setIsOpenPopover] = useState(false);
  const [justRated, setJustRated] = useState(false);

  const handleStarClick = (e: React.MouseEvent, starValue: number) => {
    e.stopPropagation();
    onRate(toolId, starValue);
    setJustRated(true);
    setTimeout(() => {
      setJustRated(false);
      setIsOpenPopover(false);
    }, 1800);
  };

  const currentDisplayStars = hoverRating ?? userRating ?? Math.round(avgRating);

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {/* Badge Button showing Average Rating */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (showPopoverOnClick) {
            setIsOpenPopover(!isOpenPopover);
          }
        }}
        className={`inline-flex items-center space-x-1 rounded-full font-bold transition-all shadow-2xs ${
          userRating
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25"
            : "bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-amber-400"
        } ${
          size === "sm"
            ? "px-2 py-0.5 text-[10px]"
            : size === "md"
            ? "px-2.5 py-1 text-xs"
            : "px-3 py-1.5 text-sm"
        }`}
        title="Click to rate this tool"
      >
        <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
        <span>{avgRating.toFixed(1)}</span>
        <span className="text-slate-400 font-normal">({totalRatings})</span>
      </button>

      {/* Interactive Rating Popover */}
      {isOpenPopover && (
        <div
          className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-2.5 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Rate {toolName || "Tool"}</span>
            </span>
            <button
              onClick={() => setIsOpenPopover(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {justRated ? (
            <div className="py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center space-x-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Thank you for your rating!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                How satisfied are you with this tool?
              </p>

              {/* 5 Stars Bar */}
              <div
                className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl"
                onMouseLeave={() => setHoverRating(null)}
              >
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onClick={(e) => handleStarClick(e, starVal)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        starVal <= currentDisplayStars
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {userRating && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold text-center">
                  Your current rating: {userRating} ★
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
