import React from "react";

export interface AdPlacementConfig {
  id: string;
  slotId: string;
  format: "banner" | "rectangle" | "leaderboard" | "native-feed" | "sticky-bottom" | "skyscraper" | "tool-result";
  minHeight: number;
  priority: number;
  shouldRender: boolean;
  label: string;
}

/**
 * Dynamically calculates up to 5 optimized Google AdSense placements based on content density and active tool state.
 * Prevents Cumulative Layout Shift (CLS) and ensures ads do not obscure active tool operations.
 */
export function calculateAdPlacements(
  toolCount: number,
  isToolActive: boolean,
  hasAnalytics: boolean,
  viewportWidth: number = 1200
): AdPlacementConfig[] {
  // Density factor based on number of tools displayed
  const contentDensity = Math.min(toolCount / 20, 1.5);

  const placements: AdPlacementConfig[] = [
    // Placement 1: Sub-Hero Leaderboard / Banner
    {
      id: "hero-sub-ad",
      slotId: "pdfsun-auto-hero-sub-01",
      format: viewportWidth < 640 ? "banner" : "leaderboard",
      minHeight: 90,
      priority: 1,
      shouldRender: true,
      label: "Top Hero Banner Ad",
    },

    // Placement 2: In-Content Grid Feed (Adjusted by tool density)
    {
      id: "incontent-grid-ad",
      slotId: "pdfsun-auto-incontent-02",
      format: "rectangle",
      minHeight: 250,
      priority: 2,
      shouldRender: contentDensity >= 0.2, // Only render if sufficient tools are visible
      label: "In-Content Grid Ad",
    },

    // Placement 3: Native Feed / Features Info Ad
    {
      id: "native-features-ad",
      slotId: "pdfsun-auto-native-03",
      format: "native-feed",
      minHeight: 250,
      priority: 3,
      shouldRender: hasAnalytics || toolCount > 10,
      label: "Native Feed Ad",
    },

    // Placement 4: Sticky Bottom Anchor Ad (Hidden when an interactive tool modal is actively occupying full screen focus)
    {
      id: "sticky-bottom-ad",
      slotId: "pdfsun-auto-sticky-04",
      format: "sticky-bottom",
      minHeight: 90,
      priority: 4,
      shouldRender: !isToolActive, // Hides bottom sticky anchor while editing/processing files to avoid obscuring action controls
      label: "Sticky Anchor Ad",
    },

    // Placement 5: Tool Completion / Result Ad
    {
      id: "tool-result-ad",
      slotId: "pdfsun-auto-tool-result-05",
      format: "tool-result",
      minHeight: 100,
      priority: 5,
      shouldRender: isToolActive, // Shows inside active tool result section upon document processing completion
      label: "Tool Result Ad",
    },
  ];

  return placements.filter((p) => p.shouldRender);
}
