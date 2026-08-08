import React, { useState, useEffect, useRef, useMemo } from "react";
import { ToolItem } from "../types";
import { ToolCard } from "./ToolCard";

interface VirtualizedToolGridProps {
  tools: ToolItem[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
  onSelectTool: (tool: ToolItem) => void;
  isMostPopular: (toolId: string) => boolean;
  getFormattedUsage: (toolId: string) => string;
  getToolRating: (toolId: string) => any;
  onRateTool: (toolId: string, rating: number) => void;
  height?: number;
}

export const VirtualizedToolGrid: React.FC<VirtualizedToolGridProps> = ({
  tools,
  favorites,
  onToggleFavorite,
  onSelectTool,
  isMostPopular,
  getFormattedUsage,
  getToolRating,
  onRateTool,
  height = 680,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<number>(4);
  const [scrollTop, setScrollTop] = useState<number>(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (!scrollRef.current) return;
      const width = scrollRef.current.clientWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else if (width < 1280) setColumns(3);
      else setColumns(4);
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (scrollRef.current) {
      observer.observe(scrollRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const cardRowHeight = 210; // Height per row including spacing
  const totalRows = Math.ceil(tools.length / columns);
  const totalHeight = totalRows * cardRowHeight;

  const OVERSCAN = 2; // Buffer rows above/below viewport
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / cardRowHeight) - OVERSCAN);
  const visibleEndIndex = Math.min(
    totalRows,
    Math.ceil((scrollTop + height) / cardRowHeight) + OVERSCAN
  );

  const visibleRows = useMemo(() => {
    const rows = [];
    for (let rowIndex = visibleStartIndex; rowIndex < visibleEndIndex; rowIndex++) {
      const startIdx = rowIndex * columns;
      const rowTools = tools.slice(startIdx, startIdx + columns);
      rows.push({ rowIndex, rowTools });
    }
    return rows;
  }, [visibleStartIndex, visibleEndIndex, columns, tools]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{
        height: Math.min(height, Math.max(240, totalHeight)),
        overflowY: "auto",
      }}
      className="w-full relative scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 rounded-2xl pr-1"
    >
      <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
        {visibleRows.map(({ rowIndex, rowTools }) => (
          <div
            key={rowIndex}
            style={{
              position: "absolute",
              top: rowIndex * cardRowHeight,
              left: 0,
              right: 0,
              height: cardRowHeight - 16,
            }}
          >
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {rowTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelectTool={onSelectTool}
                  isMostPopular={isMostPopular(tool.id) || tool.isPopular}
                  usageFormatted={getFormattedUsage(tool.id)}
                  ratingState={getToolRating(tool.id)}
                  onRateTool={onRateTool}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
