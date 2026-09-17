import React from "react";

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = "" }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentTable: string[][] = [];

  const flushList = () => {
    if (!currentList) return;
    const isOrdered = currentList.type === "ol";
    elements.push(
      isOrdered ? (
        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-2 pl-2 text-slate-200">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 pl-1 text-slate-200">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
              <span>{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      )
    );
    currentList = null;
  };

  const flushTable = () => {
    if (currentTable.length === 0) return;
    const header = currentTable[0];
    const rows = currentTable.slice(1);
    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto my-3 rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-xs text-left">
          <thead className="bg-slate-900/90 text-amber-400 font-bold uppercase tracking-wider">
            <tr>
              {header.map((col, cIdx) => (
                <th key={cIdx} className="px-3 py-2">
                  {renderInlineFormatting(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-900/40 transition">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-slate-300">
                    {renderInlineFormatting(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block fences
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushList();
        flushTable();
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="p-3 my-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Markdown Table lines
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      // Skip separator rows like |---|---|
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue;
      }
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      currentTable.push(cells);
      continue;
    } else if (currentTable.length > 0) {
      flushTable();
    }

    // Empty lines
    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      flushTable();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="text-sm font-bold text-amber-300 mt-4 mb-1.5 flex items-center space-x-1.5">
          <span>{renderInlineFormatting(trimmed.replace(/^###\s+/, ""))}</span>
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      flushTable();
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="text-base font-extrabold text-orange-400 mt-5 mb-2 pb-1 border-b border-orange-500/20 flex items-center space-x-2"
        >
          <span>{renderInlineFormatting(trimmed.replace(/^##\s+/, ""))}</span>
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      flushTable();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-lg font-black text-amber-400 mt-6 mb-2">
          {renderInlineFormatting(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      flushTable();
      elements.push(
        <div
          key={`quote-${elements.length}`}
          className="p-3 my-2 border-l-3 border-amber-500 bg-amber-500/10 rounded-r-xl text-amber-200 text-xs italic"
        >
          {renderInlineFormatting(trimmed.replace(/^>\s+/, ""))}
        </div>
      );
      continue;
    }

    // Bullet Lists (* or -)
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      flushTable();
      const text = trimmed.replace(/^[\*\-]\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [text] };
      } else {
        currentList.items.push(text);
      }
      continue;
    }

    // Numbered Lists (1., 2.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushTable();
      const text = numMatch[2];
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [text] };
      } else {
        currentList.items.push(text);
      }
      continue;
    }

    // Regular paragraph
    flushList();
    flushTable();
    elements.push(
      <p key={`p-${elements.length}`} className="text-xs text-slate-300 leading-relaxed my-2">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};

// Helper for bold (**text**), italics (*text*), inline code (`code`)
function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return "";

  // Split by inline code, bold, italics
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-amber-300">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return (
        <em key={idx} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}
