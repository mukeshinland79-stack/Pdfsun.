import React, { useState, useEffect } from "react";
import {
  Download,
  Plus,
  Trash2,
  Search,
  FileSpreadsheet,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Maximize2,
  Check,
  RotateCcw,
  Layers,
  Filter,
} from "lucide-react";
import { exportTableGridToSpreadsheet } from "../lib/pdfEngine";

export interface LiveInteractiveTableGridProps {
  initialData: string[][];
  fileName: string;
  onDataChange?: (data: string[][]) => void;
  onDirectDownload?: (format: "xlsx" | "xls" | "csv") => void;
  onExpandFullscreen?: () => void;
  compact?: boolean;
}

export const LiveInteractiveTableGrid: React.FC<LiveInteractiveTableGridProps> = ({
  initialData,
  fileName,
  onDataChange,
  onDirectDownload,
  onExpandFullscreen,
  compact = false,
}) => {
  const [gridData, setGridData] = useState<string[][]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"xlsx" | "xls" | "csv">("xlsx");
  const [isExporting, setIsExporting] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setGridData(initialData.map((row) => [...row]));
    } else {
      // Default standard logistics/invoicing tabular layout matching enterprise standards
      setGridData([
        ["NO", "GC NUMBER", "DATE", "CHALLAN NO", "VEHICLE NO", "FROM", "TO", "AMOUNT"],
        ["1", "GC-884210", "2026-08-15", "CH-9021", "MH-04-AB-1290", "MUMBAI", "DELHI", "₹45,200"],
        ["2", "GC-884211", "2026-08-16", "CH-9022", "DL-01-XY-8841", "PUNE", "JAIPUR", "₹32,500"],
        ["3", "GC-884212", "2026-08-17", "CH-9023", "GJ-06-CD-4412", "SURAT", "BANGALORE", "₹58,900"],
        ["4", "GC-884213", "2026-08-18", "CH-9024", "KA-05-PQ-7721", "HYDERABAD", "CHENNAI", "₹24,800"],
      ]);
    }
    setHasChanges(false);
  }, [initialData]);

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

  const notifyChange = (updated: string[][]) => {
    setGridData(updated);
    setHasChanges(true);
    if (onDataChange) {
      onDataChange(updated);
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const next = gridData.map((r) => [...r]);
    while (next[rowIndex].length <= colIndex) {
      next[rowIndex].push("");
    }
    next[rowIndex][colIndex] = value;
    notifyChange(next);
  };

  const handleAddRow = () => {
    const next = [...gridData, new Array(maxCols).fill("")];
    notifyChange(next);
  };

  const handleDeleteRow = (index: number) => {
    if (gridData.length <= 1) return;
    const next = gridData.filter((_, i) => i !== index);
    if (selectedRow === index) setSelectedRow(null);
    notifyChange(next);
  };

  const handleAddColumn = () => {
    const next = gridData.map((row) => [...row, ""]);
    notifyChange(next);
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (maxCols <= 1) return;
    const next = gridData.map((row) => row.filter((_, idx) => idx !== colIndex));
    notifyChange(next);
  };

  const handleResetData = () => {
    if (initialData && initialData.length > 0) {
      notifyChange(initialData.map((r) => [...r]));
    }
    setHasChanges(false);
  };

  const triggerDownload = (format: "xlsx" | "xls" | "csv" = selectedFormat) => {
    setIsExporting(true);
    try {
      if (onDirectDownload) {
        onDirectDownload(format);
      } else {
        const cleanBaseName = fileName.replace(/\.[^/.]+$/, "") || "PDFSun_Extracted_Table";
        const res = exportTableGridToSpreadsheet(gridData, format, cleanBaseName);
        const mime =
          format === "csv"
            ? "text/csv;charset=utf-8"
            : format === "xls"
            ? "application/vnd.ms-excel"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        const blob = new Blob([res.bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = res.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setTimeout(() => setIsExporting(false), 400);
    }
  };

  const filteredRowIndices = gridData
    .map((row, idx) => ({ row, idx }))
    .filter(({ row, idx }) => {
      if (!searchQuery.trim()) return true;
      if (idx === 0) return true; // Always display header row
      return row.some((cell) =>
        (cell || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .map((item) => item.idx);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-left animate-in fade-in duration-200">
      {/* Table Toolbar Header */}
      <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/20">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Live Data Table Preview</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table..."
              className="pl-8 pr-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 w-36 sm:w-44 transition"
            />
          </div>

          <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Grid Modifiers */}
          <button
            type="button"
            onClick={handleAddRow}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center space-x-1"
            title="Add row at bottom"
          >
            <Plus className="w-3 h-3 text-emerald-500" />
            <span>Row</span>
          </button>

          <button
            type="button"
            onClick={handleAddColumn}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center space-x-1"
            title="Add column on right"
          >
            <Plus className="w-3 h-3 text-blue-500" />
            <span>Col</span>
          </button>

          {selectedRow !== null && selectedRow >= 0 && (
            <button
              type="button"
              onClick={() => handleDeleteRow(selectedRow)}
              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition flex items-center space-x-1"
              title={`Delete Row ${selectedRow + 1}`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Del #{selectedRow + 1}</span>
            </button>
          )}

          {hasChanges && (
            <button
              type="button"
              onClick={handleResetData}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition flex items-center space-x-1"
              title="Revert to original OCR extraction"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Right Side Actions & Download Dropdown */}
        <div className="flex items-center space-x-2">
          {onExpandFullscreen && (
            <button
              type="button"
              onClick={onExpandFullscreen}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title="Expand to Fullscreen Matrix"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Multi-Format Export Dropdown Button */}
          <div className="relative">
            <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-emerald-600">
              <button
                type="button"
                onClick={() => triggerDownload(selectedFormat)}
                disabled={isExporting}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download .{selectedFormat.toUpperCase()}</span>
              </button>

              <button
                type="button"
                onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                className="px-1.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white border-l border-emerald-500 transition"
                title="Choose Excel format"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Format Dropdown Menu */}
            {formatDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-30 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat("xlsx");
                    setFormatDropdownOpen(false);
                    triggerDownload("xlsx");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span className="font-bold">Excel (.XLSX)</span>
                  {selectedFormat === "xlsx" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat("xls");
                    setFormatDropdownOpen(false);
                    triggerDownload("xls");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>Legacy (.XLS)</span>
                  {selectedFormat === "xls" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat("csv");
                    setFormatDropdownOpen(false);
                    triggerDownload("csv");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>CSV (Text Grid)</span>
                  {selectedFormat === "csv" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Clean Spreadsheet HTML Grid */}
      <div className="overflow-x-auto max-h-[420px] bg-slate-50/50 dark:bg-slate-950 p-2.5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden inline-block min-w-full">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Header Row: Light grey #F9FAFB background, bold dark text */}
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 select-none">
                <th className="w-10 px-2 py-2 text-center font-mono text-[10px] uppercase font-bold border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 sticky left-0 z-10 text-slate-500">
                  #
                </th>
                {Array.from({ length: maxCols }).map((_, colIdx) => {
                  const headerText = gridData[0]?.[colIdx] || `COL ${getColumnLetter(colIdx)}`;
                  return (
                    <th
                      key={colIdx}
                      className="px-3 py-2 font-mono text-[11px] font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 group/th min-w-[130px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{headerText}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="opacity-0 group-hover/th:opacity-100 p-0.5 hover:text-rose-500 rounded transition text-slate-400"
                          title={`Delete Column ${colIdx + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Data Rows with subtle Zebra Striping */}
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
                        ? "bg-slate-50/90 dark:bg-slate-850/90 font-bold text-slate-900 dark:text-white"
                        : isSelected
                        ? "bg-emerald-500/10 dark:bg-emerald-950/30"
                        : "odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-850/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Row Index Column */}
                    <td
                      className={`w-10 px-2 py-1.5 text-center font-mono text-[11px] select-none border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 ${
                        isHeaderRow
                          ? "bg-slate-200/70 dark:bg-slate-800 font-extrabold text-emerald-600 dark:text-emerald-400"
                          : isSelected
                          ? "bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300"
                          : "bg-slate-100/90 dark:bg-slate-850 text-slate-400"
                      }`}
                    >
                      {rowIdx + 1}
                    </td>

                    {/* Dynamic Table Cells (Clickable & Editable) */}
                    {Array.from({ length: maxCols }).map((_, colIdx) => {
                      const cellValue = row[colIdx] || "";
                      const isNumeric =
                        !isNaN(Number(cellValue.replace(/[$,€£₹%]/g, ""))) &&
                        cellValue.trim() !== "";

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
                            placeholder={isHeaderRow ? `Header ${colIdx + 1}` : ""}
                            className={`w-full px-2.5 py-1.5 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/40 focus:ring-1 focus:ring-emerald-500 transition ${
                              isHeaderRow
                                ? "font-extrabold text-slate-900 dark:text-white uppercase"
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

      {/* Grid Footer Bar */}
      <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            {hasChanges
              ? "Edits synchronized • Auto-formats numbers & currencies on download"
              : "OCR Table Matrix • Click any cell to edit or refine values before download"}
          </span>
        </div>
        <div className="font-mono text-slate-400 shrink-0">
          {gridData.length} Rows × {maxCols} Cols
        </div>
      </div>
    </div>
  );
};
export default LiveInteractiveTableGrid;
