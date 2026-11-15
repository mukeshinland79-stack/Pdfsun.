import React from "react";
import { Landmark, Shield, FileText, CheckCircle2, Award } from "lucide-react";

export interface GovtPreset {
  id: string;
  name: string;
  portal: string;
  targetSizeKB: number;
  description: string;
  badge: string;
}

export const INDIAN_GOVT_PRESETS: GovtPreset[] = [
  {
    id: "upsc-ssc-cert",
    name: "UPSC / SSC Marksheet & Degree",
    portal: "UPSC & SSC Portals",
    targetSizeKB: 100,
    description: "Strict under 100KB limit for educational certificates and marksheets without blur or broken signatures.",
    badge: "< 100 KB",
  },
  {
    id: "govt-id-200kb",
    name: "Govt ID & Category Certificate",
    portal: "State PSC / IBPS / RRB",
    targetSizeKB: 200,
    description: "Target under 200KB for caste, EWS, domicile certificates, and identity documents.",
    badge: "< 200 KB",
  },
  {
    id: "passport-seva",
    name: "Passport Seva Kendra Upload",
    portal: "Passport India Portal",
    targetSizeKB: 200,
    description: "Complies with Indian Passport online document upload caps with crisp resolution.",
    badge: "< 200 KB",
  },
  {
    id: "nta-neet-jee",
    name: "NTA / JEE / NEET Examination",
    portal: "National Testing Agency",
    targetSizeKB: 300,
    description: "Strict under 300KB for candidate application confirmation pages and admit card archives.",
    badge: "< 300 KB",
  },
  {
    id: "job-resume-ats",
    name: "Corporate Job Resume & CV",
    portal: "LinkedIn / Naukri / Indeed",
    targetSizeKB: 500,
    description: "Under 500KB for instant email delivery and seamless ATS parseability.",
    badge: "< 500 KB",
  },
];

interface IndianGovtPortalPresetSelectorProps {
  selectedPresetId?: string;
  onSelectPreset: (preset: GovtPreset) => void;
  className?: string;
}

export const IndianGovtPortalPresetSelector: React.FC<IndianGovtPortalPresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  className = "",
}) => {
  return (
    <div className={`rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
          Government & Recruitment Portal Quick Presets (India)
        </h4>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
          Portal Compliant
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {INDIAN_GOVT_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3 rounded-xl border transition-all text-xs ${
                isSelected
                  ? "border-amber-500 bg-amber-500/15 dark:bg-amber-500/20 text-amber-950 dark:text-amber-100 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-amber-400/60"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold truncate">{preset.name}</span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                  {preset.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
