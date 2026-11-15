import React, { useState } from "react";
import { X, Command, Keyboard, RotateCcw, Edit2, Check, Zap, Sparkles } from "lucide-react";
import { ShortcutDefinition } from "../hooks/useKeyboardShortcutsManager";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: ShortcutDefinition[];
  shortcutsEnabled?: boolean;
  onToggleEnabled?: () => void;
  onUpdateShortcut?: (id: string, newKeyCombo: string) => void;
  onResetToDefaults?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts = [],
  shortcutsEnabled = true,
  onToggleEnabled,
  onUpdateShortcut,
  onResetToDefaults,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComboValue, setEditComboValue] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (!isOpen) return null;

  const handleStartEdit = (s: ShortcutDefinition) => {
    setEditingId(s.id);
    setEditComboValue(s.keyCombo);
  };

  const handleSaveEdit = (id: string) => {
    if (editComboValue.trim() && onUpdateShortcut) {
      onUpdateShortcut(id, editComboValue.trim());
    }
    setEditingId(null);
  };

  const filteredShortcuts = shortcuts.filter((s) => {
    if (activeCategory === "all") return true;
    return s.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Keyboard className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Power-User Key Bindings</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Customizable
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Trigger tools and actions instantly with key combinations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Shortcuts Enable Toggle & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onToggleEnabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                shortcutsEnabled ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  shortcutsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {shortcutsEnabled ? "Key Bindings Active" : "Key Bindings Disabled"}
            </span>
          </div>

          {onResetToDefaults && (
            <button
              onClick={onResetToDefaults}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 flex items-center space-x-1.5 transition"
              title="Reset all shortcuts to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          {[
            { id: "all", label: "All Shortcuts" },
            { id: "tools", label: "PDF Tools" },
            { id: "navigation", label: "Navigation" },
            { id: "general", label: "General" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                activeCategory === cat.id
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredShortcuts.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400/40 transition"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {s.name}
                  </span>
                  {s.actionSlug && (
                    <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      /{s.actionSlug}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {s.description}
                </p>
              </div>

              {/* Key Combination or Editor */}
              <div className="flex items-center space-x-2 shrink-0">
                {editingId === s.id ? (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={editComboValue}
                      onChange={(e) => setEditComboValue(e.target.value)}
                      placeholder="e.g. Alt+M"
                      className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-amber-400 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(s.id)}
                      className="p-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <kbd className="px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-amber-400 font-mono text-xs font-black shadow-xs">
                      {s.keyCombo}
                    </kbd>
                    {onUpdateShortcut && (
                      <button
                        onClick={() => handleStartEdit(s)}
                        className="p-1 text-slate-400 hover:text-amber-500 transition"
                        title="Edit key binding"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Power Tip: Hold <kbd className="font-mono font-bold">Alt</kbd> + shortcut key</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black rounded-xl shadow-md hover:scale-105 active:scale-95 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
