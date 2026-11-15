import React, { useState } from "react";
import { X, Clock, FileCheck, Trash2, Copy, Download, Check, FileText } from "lucide-react";
import { ToolHistoryItem } from "../types";

interface RecentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ToolHistoryItem[];
  onClearHistory: () => void;
}

export const RecentHistoryModal: React.FC<RecentHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDownloadSnippet = (fileName: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const targetName = fileName
      ? `${fileName.replace(/\.[^/.]+$/, "")}_OCR_Text.txt`
      : "PDFSun_OCR_Recognized_Text.txt";

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Conversions & Downloads</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p>No conversions performed yet in this session.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{item.toolName}</span>
                      {item.snippet && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          OCR SNIPPET
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.fileName} • {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                    COMPLETED
                  </span>
                </div>

                {/* OCR Text Snippet Container */}
                {item.snippet && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Recognized Text Snippet</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleCopySnippet(item.id, item.snippet!)}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center space-x-1"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownloadSnippet(item.fileName, item.snippet!)}
                          className="px-2 py-0.5 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 transition flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download .txt</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                      {item.snippet}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="flex items-center space-x-1 text-xs text-rose-500 font-bold hover:underline disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>

          <button onClick={onClose} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
