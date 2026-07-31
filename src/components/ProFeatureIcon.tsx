import React from "react";
import { Star } from "lucide-react";

export interface ProFeatureIconProps {
  variant?: "badge" | "pill" | "icon-only" | "floating";
  size?: "xs" | "sm" | "md";
  className?: string;
  label?: string;
  tooltip?: string;
}

export const ProFeatureIcon: React.FC<ProFeatureIconProps> = ({
  variant = "badge",
  size = "sm",
  className = "",
  label = "PRO",
  tooltip = "Pro Feature - Powered by Enterprise Engine",
}) => {
  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  };

  const currentIconSize = iconSizes[size] || iconSizes.sm;

  if (variant === "icon-only") {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center justify-center rounded-full p-1 bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-xs hover:scale-110 transition-transform ${className}`}
      >
        <Star className={`${currentIconSize} fill-slate-950 stroke-slate-950`} />
      </span>
    );
  }

  if (variant === "pill") {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 shadow-2xs backdrop-blur-xs ${className}`}
      >
        <Star className={`${currentIconSize} text-amber-400 fill-amber-400 shrink-0 animate-pulse`} />
        <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-300 dark:to-yellow-300 bg-clip-text text-transparent font-black">
          {label}
        </span>
      </span>
    );
  }

  if (variant === "floating") {
    return (
      <div
        title={tooltip}
        className={`absolute -top-2.5 -right-2 z-10 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 border border-yellow-300/50 ring-2 ring-white dark:ring-slate-900 ${className}`}
      >
        <Star className="w-2.5 h-2.5 fill-slate-950 stroke-slate-950 shrink-0" />
        <span>{label}</span>
      </div>
    );
  }

  // Default 'badge' variant with golden gradient badge styling & golden Lucide Star
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30 hover:bg-amber-500/25 transition-colors ${className}`}
    >
      <Star className={`${currentIconSize} text-amber-400 fill-amber-400 shrink-0`} />
      <span className="font-black text-amber-700 dark:text-amber-300">{label}</span>
    </span>
  );
};

