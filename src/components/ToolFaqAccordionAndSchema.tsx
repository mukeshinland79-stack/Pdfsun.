import React, { useState, useMemo } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { ToolItem } from "../types";
import { getLocalizedToolFAQs, buildFaqJsonLd, ToolFAQ } from "../lib/toolFaqHelper";
import { useLanguage } from "../lib/i18n";

export interface ToolFaqAccordionAndSchemaProps {
  tool: ToolItem;
  customFaqs?: ToolFAQ[];
  className?: string;
  renderSchemaOnly?: boolean;
  title?: string;
}

export const ToolFaqAccordionAndSchema: React.FC<ToolFaqAccordionAndSchemaProps> = ({
  tool,
  customFaqs,
  className = "",
  renderSchemaOnly = false,
  title,
}) => {
  const { t, currentLanguage, getToolName, getToolDescription } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const localizedFaqs = useMemo(() => {
    const base = getLocalizedToolFAQs(tool, {
      t,
      currentLanguage,
      getToolName,
      getToolDescription,
    });
    if (customFaqs && customFaqs.length > 0) {
      // Deduplicate custom and base
      const seen = new Set<string>();
      const combined: ToolFAQ[] = [];
      for (const f of [...customFaqs, ...base]) {
        const k = f.question.toLowerCase().trim();
        if (!seen.has(k)) {
          seen.add(k);
          combined.push(f);
        }
      }
      return combined;
    }
    return base;
  }, [tool, customFaqs, t, currentLanguage, getToolName, getToolDescription]);

  const jsonLdData = useMemo(() => {
    return buildFaqJsonLd(localizedFaqs);
  }, [localizedFaqs]);

  const toolDisplayName = getToolName ? getToolName(tool) : tool.name;

  return (
    <>
      {/* Localized FAQPage Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdData),
        }}
      />

      {!renderSchemaOnly && localizedFaqs.length > 0 && (
        <div className={`pt-3 border-t border-[var(--border-color,rgba(255,255,255,0.1))] space-y-2.5 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-[var(--text-primary,#f8fafc)]">
                {title || t("faq.toolFaqBadge", `${toolDisplayName} FAQs`)}
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted,#64748b)] font-medium">
              {localizedFaqs.length} {t("faq.questionsAnswered", "questions answered")}
            </span>
          </div>

          <div className="space-y-1.5" itemScope itemType="https://schema.org/FAQPage">
            {localizedFaqs.map((faq, fIdx) => {
              const isOpen = openIdx === fIdx;
              return (
                <div
                  key={fIdx}
                  className="rounded-xl border border-[var(--border-color,rgba(255,255,255,0.1))] bg-[var(--bg-elevated,#16161a)] overflow-hidden transition-colors"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : fIdx)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs font-semibold text-[var(--text-primary,#f8fafc)] hover:text-orange-400 transition"
                  >
                    <span itemProp="name">{faq.question}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[var(--text-muted,#64748b)] transition-transform ${
                        isOpen ? "rotate-180 text-orange-500" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className="px-3.5 pb-3 text-[11px] text-[var(--text-secondary,#94a3b8)] border-t border-[var(--border-color,rgba(255,255,255,0.08))] pt-2 leading-relaxed bg-[var(--bg-surface,#111114)]/50"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <span itemProp="text">{faq.answer}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
