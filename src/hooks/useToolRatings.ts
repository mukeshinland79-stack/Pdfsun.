import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "pdfsun_tool_ratings";

export interface ToolRatingState {
  avgRating: number;
  totalRatings: number;
  userRating?: number;
}

// Seed ratings for realistic initial visual display
const DEFAULT_RATINGS: Record<string, { avgRating: number; totalRatings: number }> = {
  "merge-pdf": { avgRating: 4.9, totalRatings: 342 },
  "compress-pdf": { avgRating: 4.8, totalRatings: 289 },
  "pdf-to-word": { avgRating: 4.9, totalRatings: 275 },
  "ai-chat-pdf": { avgRating: 4.9, totalRatings: 310 },
  "annotate-pdf": { avgRating: 4.8, totalRatings: 198 },
  "split-pdf": { avgRating: 4.7, totalRatings: 164 },
  "edit-pdf": { avgRating: 4.8, totalRatings: 212 },
  "ocr-pdf": { avgRating: 4.7, totalRatings: 145 },
  "word-to-pdf": { avgRating: 4.8, totalRatings: 130 },
  "excel-to-pdf": { avgRating: 4.6, totalRatings: 98 },
  "pdf-to-jpg": { avgRating: 4.7, totalRatings: 112 },
  "protect-pdf": { avgRating: 4.9, totalRatings: 156 },
  "unlock-pdf": { avgRating: 4.8, totalRatings: 140 },
  "organize-pdf": { avgRating: 4.7, totalRatings: 88 },
  "watermark-pdf": { avgRating: 4.6, totalRatings: 76 },
  "ai-summarize-pdf": { avgRating: 4.9, totalRatings: 205 },
};

export function useToolRatings() {
  const [ratings, setRatings] = useState<Record<string, ToolRatingState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults
        const merged: Record<string, ToolRatingState> = {};
        Object.keys(DEFAULT_RATINGS).forEach((toolId) => {
          merged[toolId] = {
            ...DEFAULT_RATINGS[toolId],
            ...(parsed[toolId] || {}),
          };
        });
        // Include any additional tool IDs present in parsed
        Object.keys(parsed).forEach((toolId) => {
          if (!merged[toolId]) {
            merged[toolId] = parsed[toolId];
          }
        });
        return merged;
      }
    } catch (err) {
      console.warn("Failed to load tool ratings from localStorage:", err);
    }
    
    // Default fallback
    const initial: Record<string, ToolRatingState> = {};
    Object.keys(DEFAULT_RATINGS).forEach((toolId) => {
      initial[toolId] = { ...DEFAULT_RATINGS[toolId] };
    });
    return initial;
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
      const current = prev[toolId] || { avgRating: 4.8, totalRatings: 25 };
      const previousUserRating = current.userRating;

      let newTotalRatings = current.totalRatings;
      let newSum = current.avgRating * current.totalRatings;

      if (previousUserRating !== undefined) {
        // User is updating their previous rating
        newSum = newSum - previousUserRating + rating;
      } else {
        // User rating for the first time
        newTotalRatings += 1;
        newSum += rating;
      }

      const newAvg = Number((newSum / newTotalRatings).toFixed(1));

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
      return (
        ratings[toolId] || {
          avgRating: 4.8,
          totalRatings: 30,
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
