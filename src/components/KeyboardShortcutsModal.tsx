import React from "react";
import { X, Command, Search } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Cmd + K / Ctrl + K", desc: "Open global 50+ PDF tools search" },
    { key: "Esc", desc: "Close active tool workspace or modal" },
    { key: "Drag & Drop", desc: "Drop files anywhere to auto-launch tool" },
    { key: "Click Star", desc: "Toggle favorite tool bookmarking" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Command className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
              <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono font-bold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
