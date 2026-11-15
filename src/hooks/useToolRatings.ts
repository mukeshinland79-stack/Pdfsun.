import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "pdfsun_tool_ratings";

export interface ToolRatingState {
  avgRating: number;
  totalRatings: number;
  userRating?: number;
}

export function useToolRatings() {
  const [ratings, setRatings] = useState<Record<string, ToolRatingState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Failed to load tool ratings from localStorage:", err);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch (err) {
      console.warn("Failed to save tool ratings to localStorage:", err);
    }
  }, [ratings]);

  const rateTool = useCallback((toolId: string, rating: number) => {
    if (!toolId || rating < 1 || rating > 5) return;

    setRatings((prev) => {
      const current = prev[toolId] || { avgRating: 0, totalRatings: 0 };
      const previousUserRating = current.userRating;

      let newTotalRatings = current.totalRatings;
      let newSum = current.avgRating * current.totalRatings;

      if (previousUserRating !== undefined && newTotalRatings > 0) {
        newSum = newSum - previousUserRating + rating;
      } else {
        newTotalRatings += 1;
        newSum += rating;
      }

      const newAvg = newTotalRatings > 0 ? Number((newSum / newTotalRatings).toFixed(1)) : 0;

      return {
        ...prev,
        [toolId]: {
          avgRating: newAvg,
          totalRatings: newTotalRatings,
          userRating: rating,
        },
      };
    });
  }, []);

  const getToolRating = useCallback(
    (toolId: string): ToolRatingState => {
      const canonicalId = toolId === "ocr-pdf" || toolId === "ocr-image-to-text" ? "ai-ocr" : toolId;
      return (
        ratings[canonicalId] ||
        ratings[toolId] || {
          avgRating: 0,
          totalRatings: 0,
        }
      );
    },
    [ratings]
  );

  return {
    ratings,
    rateTool,
    getToolRating,
  };
}
