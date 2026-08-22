import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Plus,
  Trash2,
  Table as TableIcon,
  Check,
  Search,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { exportTableGridToSpreadsheet } from "../lib/pdfEngine";

interface TableGridPreviewModalProps {
  isOpen: boolean;
  initialData: string[][];
  fileName: string;
  onClose: () => void;
  onDownloadCustom?: (data: string[][], format: "xlsx" | "csv") => void;
}

export const TableGridPreviewModal: React.FC<TableGridPreviewModalProps> = ({
  isOpen,
  initialData,
  fileName,
  onClose,
  onDownloadCustom,
}) => {
  const [gridData, setGridData] = useState<string[][]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      // Deep clone initial data matrix to ensure clean editing state
      setGridData(initialData.map((row) => [...row]));
    } else {
      // Fallback empty structured template
      setGridData([
        ["Item / Description", "Category", "Quantity", "Unit Price", "Total Amount"],
        ["Sample Product Alpha", "Supplies", "2", "$45.00", "$90.00"],
        ["Consulting Services", "Services", "10", "$120.00", "$1,200.00"],
        ["Software License", "Digital", "1", "$299.00", "$299.00"],
      ]);
    }
    setHasChanges(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const maxCols = Math.max(...gridData.map((r) => r.length), 1);

  const getColumnLetter = (colIndex: number) => {
    let letter = "";
    let temp = colIndex;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setGridData((prev) => {
      const next = prev.map((r) => [...r]);
      while (next[rowIndex].length <= colIndex) {
        next[rowIndex].push("");
      }
      next[rowIndex][colIndex] = value;
      return next;
    });
    setHasChanges(true);
  };

  const handleAddRow = () => {
    setGridData((prev) => [...prev, new Array(maxCols).fill("")]);
    setHasChanges(true);
  };

  const handleDeleteRow = (index: number) => {
    if (gridData.length <= 1) return;
    setGridData((prev) => prev.filter((_, i) => i !== index));
    if (selectedRow === index) setSelectedRow(null);
    setHasChanges(true);
  };

  const handleAddColumn = () => {
    setGridData((prev) => prev.map((row) => [...row, ""]));
    setHasChanges(true);
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (maxCols <= 1) return;
    setGridData((prev) =>
      prev.map((row) => row.filter((_, idx) => idx !== colIndex))
    );
    setHasChanges(true);
  };

  const handleDownload = () => {
    setIsExporting(true);
    try {
      const cleanBaseName = fileName.replace(/\.[^/.]+$/, "");
      const res = exportTableGridToSpreadsheet(gridData, exportFormat, cleanBaseName);

      const blob = new Blob([res.bytes], {
        type:
          exportFormat === "csv"
            ? "text/csv;charset=utf-8"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onDownloadCustom) {
        onDownloadCustom(gridData, exportFormat);
      }
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const filteredRowIndices = gridData
    .map((row, idx) => ({ row, idx }))
    .filter(({ row, idx }) => {
      if (!searchQuery.trim()) return true;
      if (idx === 0) return true; // Always show headers
      return row.some((cell) =>
        (cell || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .map((item) => item.idx);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] max-h-[850px] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Interactive Table Matrix & Cell Editor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-500/30 uppercase tracking-wider">
                  Live OCR Grid
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect auto-detected rows and edit cell contents before exporting to Excel or CSV.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Editing Toolbar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>Add Row</span>
            </button>

            <button
              onClick={handleAddColumn}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>Add Column</span>
            </button>

            {selectedRow !== null && selectedRow >= 0 && (
              <button
                onClick={() => handleDeleteRow(selectedRow)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Row {selectedRow + 1}</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cell data..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 w-44"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Format Selector */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
              <button
                onClick={() => setExportFormat("xlsx")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  exportFormat === "xlsx"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                .XLSX (Excel)
              </button>
              <button
                onClick={() => setExportFormat("csv")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  exportFormat === "csv"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                .CSV (Text)
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {gridData.length} Rows × {maxCols} Cols
            </span>
          </div>
        </div>

        {/* Interactive Spreadsheet Grid Table Area */}
        <div className="flex-1 overflow-auto bg-slate-100/60 dark:bg-slate-950 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden inline-block min-w-full">
            <table className="w-full border-collapse text-left text-xs">
              {/* Table Column Header Letters (A, B, C, ...) */}
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 select-none">
                  <th className="w-12 px-2 py-2 text-center font-mono text-[10px] uppercase font-bold border-r border-slate-200 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800 sticky left-0 z-20">
                    #
                  </th>
                  {Array.from({ length: maxCols }).map((_, colIdx) => (
                    <th
                      key={colIdx}
                      className="px-3 py-2 font-mono text-[11px] font-extrabold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 group/th min-w-[140px]"
                    >
                      <div className="flex items-center justify-between">
                        <span>{getColumnLetter(colIdx)}</span>
                        <button
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="opacity-0 group-hover/th:opacity-100 p-0.5 hover:text-rose-500 rounded transition text-slate-400"
                          title={`Delete column ${getColumnLetter(colIdx)}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body Grid */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {gridData.map((row, rowIdx) => {
                  const isVisible = filteredRowIndices.includes(rowIdx);
                  if (!isVisible) return null;

                  const isHeaderRow = rowIdx === 0;
                  const isSelected = selectedRow === rowIdx;

                  return (
                    <tr
                      key={rowIdx}
                      onClick={() => setSelectedRow(rowIdx)}
                      className={`transition-colors ${
                        isHeaderRow
                          ? "bg-slate-50 dark:bg-slate-850/90 font-bold text-slate-900 dark:text-white"
                          : isSelected
                          ? "bg-emerald-500/10 dark:bg-emerald-950/30"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Row Index Column */}
                      <td
                        className={`w-12 px-2 py-1.5 text-center font-mono text-[11px] select-none border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 ${
                          isHeaderRow
                            ? "bg-slate-200/80 dark:bg-slate-800 font-extrabold text-emerald-600 dark:text-emerald-400"
                            : isSelected
                            ? "bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-850 text-slate-400"
                        }`}
                      >
                        {rowIdx + 1}
                      </td>

                      {/* Cell Content Inputs */}
                      {Array.from({ length: maxCols }).map((_, colIdx) => {
                        const cellValue = row[colIdx] || "";
                        const isNumeric = !isNaN(Number(cellValue.replace(/[$,€£%]/g, ""))) && cellValue.trim() !== "";

                        return (
                          <td
                            key={colIdx}
                            className="p-0 border-r border-slate-200 dark:border-slate-800"
                          >
                            <input
                              type="text"
                              value={cellValue}
                              onChange={(e) =>
                                handleCellChange(rowIdx, colIdx, e.target.value)
                              }
                              placeholder={isHeaderRow ? `Header ${colIdx + 1}` : "Empty"}
                              className={`w-full px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/40 focus:ring-1 focus:ring-emerald-500 transition ${
                                isHeaderRow
                                  ? "font-extrabold text-slate-900 dark:text-white"
                                  : isNumeric
                                  ? "text-right font-mono"
                                  : "text-left"
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>
              {hasChanges
                ? "Grid modified • Auto-fit and numeric formatting will be applied on export"
                : "Auto-detected structured OCR matrix • Click any cell to customize"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Building Spreadsheet...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {exportFormat.toUpperCase()} File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TableGridPreviewModal;
