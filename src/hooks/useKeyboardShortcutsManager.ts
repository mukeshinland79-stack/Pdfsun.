import { useState, useEffect, useCallback } from "react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  keyCombo: string; // e.g. "Alt+M", "Ctrl+K", "Escape", "Alt+C"
  category: "tools" | "navigation" | "general";
  actionSlug?: string;
}

export interface UseKeyboardShortcutsOptions {
  onSelectTool?: (tool: ToolItem) => void;
  onToggleSearch?: () => void;
  onToggleShortcutsModal?: () => void;
  onCloseActiveModalOrWorkspace?: () => void;
  onGoHome?: () => void;
  enabled?: boolean;
}

const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: "search",
    name: "Global Tool Search",
    description: `Open instant search bar for all ${ALL_TOOLS.length} PDF tools`,
    keyCombo: "Ctrl+K",
    category: "navigation",
  },
  {
    id: "merge-pdf",
    name: "Merge PDF",
    description: "Launch Merge PDF tool immediately",
    keyCombo: "Alt+M",
    category: "tools",
    actionSlug: "merge-pdf",
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Launch Compress PDF tool immediately",
    keyCombo: "Alt+C",
    category: "tools",
    actionSlug: "compress-pdf",
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    description: "Launch Split PDF tool immediately",
    keyCombo: "Alt+S",
    category: "tools",
    actionSlug: "split-pdf",
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    description: "Launch PDF to Word converter",
    keyCombo: "Alt+W",
    category: "tools",
    actionSlug: "pdf-to-word",
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Launch JPG to PDF converter",
    keyCombo: "Alt+J",
    category: "tools",
    actionSlug: "jpg-to-pdf",
  },
  {
    id: "ai-ocr",
    name: "OCR PDF",
    description: "Launch AI Optical Character Recognition tool",
    keyCombo: "Alt+O",
    category: "tools",
    actionSlug: "ai-ocr",
  },
  {
    id: "ai-summary",
    name: "AI Chat & Summary",
    description: "Launch AI Document Assistant",
    keyCombo: "Alt+A",
    category: "tools",
    actionSlug: "ai-summary",
  },
  {
    id: "go-home",
    name: "Return Home",
    description: "Close active workspace & return to homepage",
    keyCombo: "Alt+H",
    category: "navigation",
  },
  {
    id: "shortcuts-modal",
    name: "Shortcuts Cheat Sheet",
    description: "Toggle keyboard shortcuts help dialog",
    keyCombo: "Alt+?",
    category: "general",
  },
  {
    id: "escape",
    name: "Close / Dismiss",
    description: "Close any open modal or active tool workspace",
    keyCombo: "Escape",
    category: "general",
  },
];

const STORAGE_KEY = "pdfsun_custom_keyboard_shortcuts";
const ENABLED_STORAGE_KEY = "pdfsun_keyboard_shortcuts_enabled";

export function useKeyboardShortcutsManager(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onSelectTool,
    onToggleSearch,
    onToggleShortcutsModal,
    onCloseActiveModalOrWorkspace,
    onGoHome,
    enabled: initialEnabled = true,
  } = options;

  const [shortcutsEnabled, setShortcutsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(ENABLED_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : initialEnabled;
    } catch {
      return initialEnabled;
    }
  });

  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults in case new shortcuts were added
        return DEFAULT_SHORTCUTS.map((def) => {
          const match = parsed.find((p: ShortcutDefinition) => p.id === def.id);
          return match ? { ...def, keyCombo: match.keyCombo } : def;
        });
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_SHORTCUTS;
  });

  // Save custom shortcuts to localStorage
  const saveShortcuts = (updated: ShortcutDefinition[]) => {
    setShortcuts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save keyboard shortcuts:", e);
    }
  };

  const toggleShortcutsEnabled = (enabledValue?: boolean) => {
    const nextVal = enabledValue !== undefined ? enabledValue : !shortcutsEnabled;
    setShortcutsEnabled(nextVal);
    try {
      localStorage.setItem(ENABLED_STORAGE_KEY, JSON.stringify(nextVal));
    } catch (e) {
      console.error(e);
    }
  };

  const updateShortcutKeyCombo = (id: string, newCombo: string) => {
    const updated = shortcuts.map((s) => (s.id === id ? { ...s, keyCombo: newCombo } : s));
    saveShortcuts(updated);
  };

  const resetToDefaults = () => {
    saveShortcuts(DEFAULT_SHORTCUTS);
  };

  // Helper to parse key combination string into match criteria
  const matchEventWithCombo = (e: KeyboardEvent, combo: string): boolean => {
    const parts = combo.split("+").map((p) => p.trim().toLowerCase());
    const isAlt = parts.includes("alt");
    const isCtrl = parts.includes("ctrl") || parts.includes("cmd");
    const isShift = parts.includes("shift");

    // Check modifiers: allow Cmd (metaKey) or Ctrl interchangeably for ctrl/cmd shortcuts
    const altMatch = isAlt ? e.altKey : !e.altKey;
    const ctrlMatch = isCtrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
    const shiftMatch = isShift ? e.shiftKey : !e.shiftKey;

    // Get primary key
    const keyPart = parts.find((p) => !["alt", "ctrl", "cmd", "shift"].includes(p));
    if (!keyPart) return false;

    let eventKey = (e.key || "").toLowerCase();
    if (eventKey === " ") eventKey = "space";

    const keyMatch = eventKey === (keyPart || "").toLowerCase();

    return altMatch && ctrlMatch && shiftMatch && keyMatch;
  };

  // Global keydown event listener
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts if typing inside an editable field unless it's Escape or Cmd/Ctrl+K
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      for (const sc of shortcuts) {
        if (matchEventWithCombo(e, sc.keyCombo)) {
          // Exceptions for editable inputs: allow Escape and Cmd+K / Ctrl+K
          if (isEditable && sc.id !== "escape" && sc.id !== "search") {
            continue;
          }

          e.preventDefault();

          if (sc.id === "search") {
            onToggleSearch?.();
          } else if (sc.id === "go-home") {
            onGoHome?.();
          } else if (sc.id === "shortcuts-modal") {
            onToggleShortcutsModal?.();
          } else if (sc.id === "escape") {
            onCloseActiveModalOrWorkspace?.();
          } else if (sc.actionSlug) {
            const tool = ALL_TOOLS.find((t) => t.slug === sc.actionSlug || t.id === sc.actionSlug);
            if (tool) {
              onSelectTool?.(tool);
            }
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    shortcuts,
    shortcutsEnabled,
    onSelectTool,
    onToggleSearch,
    onToggleShortcutsModal,
    onCloseActiveModalOrWorkspace,
    onGoHome,
  ]);

  return {
    shortcuts,
    shortcutsEnabled,
    toggleShortcutsEnabled,
    updateShortcutKeyCombo,
    resetToDefaults,
  };
}
