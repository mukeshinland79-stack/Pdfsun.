import React from "react";
import { Star } from "lucide-react";

export interface ProFeatureBadgeProps {
  className?: string;
  tooltip?: string;
  size?: "xs" | "sm" | "md";
}

export const ProFeatureBadge: React.FC<ProFeatureBadgeProps> = ({
  className = "",
  tooltip = "Pro Enterprise Feature",
  size = "xs",
}) => {
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[9px]",
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-[11px]",
  };

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center space-x-1 font-black uppercase tracking-widest rounded-md bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.35)] dark:shadow-[0_0_12px_rgba(251,191,36,0.4)] backdrop-blur-xs transition-all hover:scale-105 ${sizeClasses[size]} ${className}`}
    >
      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
      <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 dark:from-amber-300 dark:via-yellow-200 dark:to-amber-400 bg-clip-text text-transparent font-black drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">
        PRO
      </span>
    </span>
  );
};
