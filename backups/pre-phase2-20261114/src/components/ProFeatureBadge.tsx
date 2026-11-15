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
      className={`inline-flex items-center space-x-1 font-black uppercase tracking-widest rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] shadow-2xs dark:bg-gradient-to-r dark:from-amber-500/20 dark:via-yellow-500/25 dark:to-amber-400/20 dark:text-amber-300 dark:border-amber-400/40 dark:shadow-[0_0_12px_rgba(251,191,36,0.4)] backdrop-blur-xs transition-all hover:scale-105 ${sizeClasses[size]} ${className}`}
    >
      <Star className="w-2.5 h-2.5 text-[#92400E] fill-[#92400E] dark:text-amber-400 dark:fill-amber-400 shrink-0" />
      <span className="font-black text-[#92400E] dark:bg-gradient-to-r dark:from-amber-300 dark:via-yellow-200 dark:to-amber-400 dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">
        PRO
      </span>
    </span>
  );
};
