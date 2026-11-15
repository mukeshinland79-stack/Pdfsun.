import React, { useState, useEffect, useRef } from "react";
import { ToolItem } from "../types";
import { ToolCard } from "./ToolCard";

interface LazyToolCardProps {
  tool: ToolItem;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
  onSelectTool: (tool: ToolItem) => void;
  isMostPopular?: boolean;
  usageFormatted?: string;
  ratingState?: {
    avgRating: number;
    totalRatings: number;
    userRating?: number;
  };
  onRateTool?: (toolId: string, rating: number) => void;
}

export const LazyToolCard: React.FC<LazyToolCardProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver isn't supported, render immediately
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (cardRef.current) {
            observer.unobserve(cardRef.current);
          }
        }
      },
      {
        root: null,
        rootMargin: "250px 0px", // Pre-load 250px before entering viewport
        threshold: 0.01,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className="h-[180px] bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 p-5 flex flex-col justify-between animate-pulse"
      >
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700/60" />
          <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700/60" />
        </div>
        <div className="space-y-2">
          <div className="w-3/4 h-4 rounded bg-slate-200 dark:bg-slate-700/60" />
          <div className="w-full h-3 rounded bg-slate-200 dark:bg-slate-700/40" />
        </div>
        <div className="pt-3 border-t border-slate-200/40 dark:border-slate-700/40 flex justify-between">
          <div className="w-16 h-3 rounded bg-slate-200 dark:bg-slate-700/40" />
          <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-700/40" />
        </div>
      </div>
    );
  }

  return <ToolCard {...props} />;
};
