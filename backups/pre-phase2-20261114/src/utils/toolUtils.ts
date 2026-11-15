import { ALL_TOOLS } from "../data/toolsData";

/**
 * Central utility function to calculate the current total number of registered tools.
 */
export function getToolCount(): number {
  return ALL_TOOLS.length;
}

/**
 * Utility function to get a formatted tool count string.
 * @param label Suffix label, e.g. "Tools", "Pro PDF Utilities", "Working Tools".
 */
export function getFormattedToolCount(label: string = "Tools"): string {
  return `${ALL_TOOLS.length} ${label}`;
}
