import React, { useState } from "react";
import {
  Check,
  X,
  Sparkles,
  Shield,
  Zap,
  Building2,
  Users,
  Lock,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PlanTier } from "./PricingSection";
import { useLanguage } from "../lib/i18n";

interface PricingCompareTableProps {
  currency: "INR" | "USD";
  onSelectPlan: (plan: PlanTier) => void;
  isProcessing: boolean;
  proYearlyPlan: PlanTier;
  businessPlan: PlanTier;
  enterprisePlan: PlanTier;
  freePlan: PlanTier;
}

interface FeatureRow {
  name: string;
  tooltip?: string;
  free: string | boolean;
  proYearly: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
  highlight?: boolean;
}

interface FeatureCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  features: FeatureRow[];
}

export const PricingCompareTable: React.FC<PricingCompareTableProps> = ({
  currency,
  onSelectPlan,
  isProcessing,
  proYearlyPlan,
  businessPlan,
  enterprisePlan,
  freePlan,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const comparisonCategories: FeatureCategory[] = [
    {
      category: t("pricing.matrix.cat1", "Document Processing & AI Capabilities"),
      icon: Sparkles,
      features: [
        {
          name: t("pricing.matrix.feat_daily", "Daily PDF Operations"),
          tooltip: t("pricing.matrix.feat_daily_tip", "Number of PDF documents you can convert, merge, compress, or edit per day"),
          free: t("pricing.matrix.free_daily", "3 Tasks / Day"),
          proYearly: t("pricing.matrix.unlimited", "Unlimited"),
          business: t("pricing.matrix.unlimited", "Unlimited"),
          enterprise: t("pricing.matrix.unlimited", "Unlimited"),
        },
        {
          name: t("pricing.matrix.feat_size", "Maximum Single File Size"),
          tooltip: t("pricing.matrix.feat_size_tip", "Max individual PDF file upload or in-browser memory buffer limit"),
          free: "15 MB",
          proYearly: "2 GB",
          business: "5 GB",
          enterprise: t("pricing.matrix.enterprise_size", "Unlimited / Custom"),
        },
        {
          name: t("pricing.matrix.feat_batch", "Batch Processing Queue"),
          tooltip: t("pricing.matrix.feat_batch_tip", "Process multiple PDFs simultaneously in a single click"),
          free: false,
          proYearly: t("pricing.matrix.up_to_50", "Up to 50 files"),
          business: t("pricing.matrix.up_to_250", "Up to 250 files"),
          enterprise: t("pricing.matrix.unlimited_queue", "Unlimited Queue"),
        },
        {
          name: t("pricing.matrix.feat_ocr", "Multilingual OCR Engine"),
          tooltip: t("pricing.matrix.feat_ocr_tip", "Extract editable text from scanned PDFs in 100+ languages"),
          free: t("pricing.matrix.basic_std", "Basic Standard"),
          proYearly: t("pricing.matrix.ai_ocr", "High-Speed AI OCR"),
          business: t("pricing.matrix.ai_ocr", "High-Speed AI OCR"),
          enterprise: t("pricing.matrix.dedicated_ocr", "Dedicated OCR Engine"),
        },
        {
          name: t("pricing.matrix.feat_gemini", "Gemini 3.6 Flash AI Document Chat"),
          tooltip: t("pricing.matrix.feat_gemini_tip", "Ask questions, extract data tables, and summarize multi-page contracts"),
          free: t("pricing.matrix.queries_5", "5 queries / day"),
          proYearly: t("pricing.matrix.unlimited_prio", "Unlimited Priority"),
          business: t("pricing.matrix.unlimited_prio", "Unlimited Priority"),
          enterprise: t("pricing.matrix.dedicated_thru", "Dedicated High-Throughput"),
          highlight: true,
        },
        {
          name: t("pricing.matrix.feat_privacy", "In-Browser Privacy & Zero Server Logs"),
          tooltip: t("pricing.matrix.feat_privacy_tip", "Files never leave your browser for standard WebAssembly operations"),
          free: true,
          proYearly: true,
          business: true,
          enterprise: t("pricing.matrix.privacy_sla", "100% Privacy SLA + Audit"),
        },
      ],
    },
    {
      category: t("pricing.matrix.cat2", "Single Sign-On (SSO) & Enterprise Identity"),
      icon: Lock,
      features: [
        {
          name: t("pricing.matrix.feat_google_ms", "Google Workspace & Microsoft 365 OAuth"),
          tooltip: t("pricing.matrix.feat_google_ms_tip", "Fast 1-click team sign in via Google or Microsoft corporate accounts"),
          free: false,
          proYearly: true,
          business: true,
          enterprise: true,
        },
        {
          name: t("pricing.matrix.feat_saml", "SAML 2.0 Enterprise SSO"),
          tooltip: t("pricing.matrix.feat_saml_tip", "Enterprise SSO support including Okta, Azure AD, PingIdentity, and Auth0"),
          free: false,
          proYearly: false,
          business: false,
          enterprise: t("pricing.matrix.full_saml", "Full SAML 2.0 Suite"),
          highlight: true,
        },
        {
          name: t("pricing.matrix.feat_autojoin", "Custom Corporate Domain Auto-Join"),
          tooltip: t("pricing.matrix.feat_autojoin_tip", "Automatically enroll team members with @yourcompany.com emails into your organization"),
          free: false,
          proYearly: false,
          business: false,
          enterprise: t("pricing.matrix.enforced_join", "Enforced Auto-Join"),
          highlight: true,
        },
        {
          name: t("pricing.matrix.feat_scim", "SCIM Automated User Provisioning"),
          tooltip: t("pricing.matrix.feat_scim_tip", "Automate employee onboarding & offboarding directly from your IdP directory"),
          free: false,
          proYearly: false,
          business: false,
          enterprise: t("pricing.matrix.full_scim", "Full SCIM 2.0 Sync"),
          highlight: true,
        },
      ],
    },
    {
      category: t("pricing.matrix.cat3", "Team Administration & Governance"),
      icon: Users,
      features: [
        {
          name: t("pricing.matrix.feat_seats", "Included User Seats"),
          tooltip: t("pricing.matrix.feat_seats_tip", "Number of active member accounts included under the subscription"),
          free: t("pricing.matrix.seat_1", "1 User (Individual)"),
          proYearly: t("pricing.matrix.seat_1", "1 User (Individual)"),
          business: t("pricing.matrix.seats_5", "5 Seats Included"),
          enterprise: t("pricing.matrix.seats_20", "Flat 20 Seats (Bulk Avail.)"),
          highlight: true,
        },
        {
          name: t("pricing.matrix.feat_admin", "Centralized Admin Console"),
          tooltip: t("pricing.matrix.feat_admin_tip", "Manage license seats, assign team roles, and view organization usage"),
          free: false,
          proYearly: false,
          business: true,
          enterprise: true,
        },
        {
          name: t("pricing.matrix.feat_rbac", "Granular Role-Based Access (RBAC)"),
          tooltip: t("pricing.matrix.feat_rbac_tip", "Configure Admin, Manager, Editor, and Viewer permissions per workspace"),
          free: false,
          proYearly: false,
          business: t("pricing.matrix.std_roles", "Standard Roles"),
          enterprise: t("pricing.matrix.custom_rbac", "Custom RBAC & Policies"),
        },
        {
          name: t("pricing.matrix.feat_audit", "Shared Compliance & Audit Logs"),
          tooltip: t("pricing.matrix.feat_audit_tip", "Download tamper-evident security audit logs with timestamps and IP records"),
          free: false,
          proYearly: false,
          business: t("pricing.matrix.logs_30d", "30-Day Logs"),
          enterprise: t("pricing.matrix.logs_1yr", "1-Year Immutable Ledger"),
        },
      ],
    },
    {
      category: t("pricing.matrix.cat4", "Billing, Invoicing & SLA Support"),
      icon: Shield,
      features: [
        {
          name: t("pricing.matrix.feat_billing_term", "Billing Term"),
          tooltip: t("pricing.matrix.feat_billing_term_tip", "Annual upfront discount schedule"),
          free: t("pricing.matrix.term_free", "Forever Free"),
          proYearly: t("pricing.matrix.term_pro", "Yearly (Save 40%)"),
          business: t("pricing.matrix.term_biz", "Yearly (Save 50%)"),
          enterprise: t("pricing.matrix.term_ent", "Yearly (Flat 20 Seats)"),
        },
        {
          name: t("pricing.matrix.feat_gst", "GST Compliant Tax Invoicing"),
          tooltip: t("pricing.matrix.feat_gst_tip", "Automated business tax invoices with GSTIN validation for input tax credits"),
          free: false,
          proYearly: true,
          business: true,
          enterprise: true,
        },
        {
          name: t("pricing.matrix.feat_support", "Customer Support Level"),
          tooltip: t("pricing.matrix.feat_support_tip", "Support channel and guaranteed response time SLA"),
          free: t("pricing.matrix.supp_comm", "Community"),
          proYearly: t("pricing.matrix.supp_email", "Priority Email (24h)"),
          business: t("pricing.matrix.supp_desk", "Priority Desk (8h SLA)"),
          enterprise: t("pricing.matrix.supp_sla", "2-Hour Dedicated SLA"),
          highlight: true,
        },
        {
          name: t("pricing.matrix.feat_mgr", "Dedicated Account Manager"),
          tooltip: t("pricing.matrix.feat_mgr_tip", "Direct relationship manager for onboarding, security questionnaires, and custom SLAs"),
          free: false,
          proYearly: false,
          business: false,
          enterprise: t("pricing.matrix.assigned_mgr", "Assigned Manager"),
        },
        {
          name: t("pricing.matrix.feat_refund", "Money-Back Guarantee"),
          tooltip: t("pricing.matrix.feat_refund_tip", "100% refund policy if not completely satisfied"),
          free: "N/A",
          proYearly: t("pricing.matrix.guarantee_7d", "7-Day Guarantee"),
          business: t("pricing.matrix.guarantee_7d", "7-Day Guarantee"),
          enterprise: t("pricing.matrix.guarantee_7d", "7-Day Guarantee"),
        },
      ],
    },
  ];

  const renderValue = (val: string | boolean, isEnterprise = false) => {
    if (typeof val === "boolean") {
      return val ? (
        <div className="flex justify-center items-center">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isEnterprise ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </span>
        </div>
      ) : (
        <div className="flex justify-center items-center">
          <span className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-200/50 dark:bg-slate-800 text-slate-400">
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
        </div>
      );
    }
    return (
      <span
        className={`text-xs font-semibold ${
          isEnterprise
            ? "text-emerald-300 font-bold"
            : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto my-12 px-4 sm:px-6">
      {/* Compare Plans Header Container */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
          <span>{t("pricing.matrix.badge", "Detailed Feature Matrix")}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {t("pricing.matrix.title", "Compare All Plans & Enterprise Benefits")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t("pricing.matrix.subtitle", "Transparent feature comparison across individual, team, and high-security enterprise tiers. Pick the right plan with zero hidden fees.")}
        </p>

        {/* Toggle Collapse Button for Mobile / Clean View */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            <span>{isExpanded ? t("pricing.matrix.collapse", "Collapse Comparison Table") : t("pricing.matrix.expand", "Expand Full Comparison Table")}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Responsive Scrollable Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              {/* Sticky Table Header */}
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-xs">
                  <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-2/6 min-w-[220px]">
                    {t("pricing.matrix.headerFeatures", "Plan Features & Limits")}
                  </th>

                  {/* Free Column */}
                  <th className="p-4 sm:p-5 text-center w-1/6 min-w-[130px] border-l border-slate-200 dark:border-slate-800/60">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        {freePlan.name}
                      </span>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {currency === "INR" ? "₹0" : "$0"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">{t("pricing.matrix.freeForever", "Free Forever")}</div>
                    </div>
                  </th>

                  {/* Pro Sun Annual Column */}
                  <th className="p-4 sm:p-5 text-center w-1/6 min-w-[140px] border-l border-slate-200 dark:border-slate-800/60 bg-amber-500/5 dark:bg-amber-500/10">
                    <div className="space-y-1">
                      <div className="inline-block px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wide">
                        {t("pricing.savePercent", "Save 40%")}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {proYearlyPlan.name}
                      </div>
                      <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                        {currency === "INR" ? "₹1,499" : "$24.99"}
                        <span className="text-[10px] font-normal text-slate-500">{t("pricing.matrix.perYear", "/yr")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectPlan(proYearlyPlan)}
                        disabled={isProcessing}
                        className="mt-2 w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{t("pricing.matrix.choose", "Choose")}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </th>

                  {/* Enterprise Plan (5 Seats) Column */}
                  <th className="p-4 sm:p-5 text-center w-1/6 min-w-[140px] border-l border-slate-200 dark:border-slate-800/60 bg-indigo-500/5 dark:bg-indigo-500/10">
                    <div className="space-y-1">
                      <div className="inline-block px-2 py-0.5 rounded-md bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wide">
                        {t("pricing.matrix.seats5", "5 Seats")}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {businessPlan.name}
                      </div>
                      <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {currency === "INR" ? "₹3,999" : "$59"}
                        <span className="text-[10px] font-normal text-slate-500">{t("pricing.matrix.perYear", "/yr")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectPlan(businessPlan)}
                        disabled={isProcessing}
                        className="mt-2 w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{t("pricing.matrix.choose", "Choose")}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </th>

                  {/* Enterprise SSO Unlimited Column */}
                  <th className="p-4 sm:p-5 text-center w-1/6 min-w-[160px] border-l border-indigo-500/30 bg-slate-950 text-white relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                      {t("pricing.matrix.seats20Inc", "20 Seats Included")}
                    </div>
                    <div className="space-y-1 mt-1">
                      <div className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{t("pricing.matrix.entSSO", "Enterprise SSO")}</span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-white">
                        {currency === "INR" ? "₹9,999" : "$149"}
                        <span className="text-[10px] font-normal text-slate-400">{t("pricing.matrix.perYear", "/yr")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectPlan(enterprisePlan)}
                        disabled={isProcessing}
                        className="mt-2 w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-[11px] font-black shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{t("pricing.matrix.getAccess", "Get Access")}</span>
                        <ArrowRight className="w-3 h-3 stroke-[3]" />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body Categories */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {comparisonCategories.map((cat, catIdx) => {
                  const CatIcon = cat.icon;
                  return (
                    <React.Fragment key={catIdx}>
                      {/* Section Category Header Row */}
                      <tr className="bg-slate-100/80 dark:bg-slate-800/60">
                        <td
                          colSpan={5}
                          className="px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
                        >
                          <CatIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                          <span>{cat.category}</span>
                        </td>
                      </tr>

                      {/* Section Feature Rows */}
                      {cat.features.map((feature, fIdx) => (
                        <tr
                          key={fIdx}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                            feature.highlight
                              ? "bg-amber-500/[0.03] dark:bg-amber-500/[0.05]"
                              : ""
                          }`}
                        >
                          {/* Feature Name & Tooltip Info */}
                          <td className="p-4 sm:p-5 text-xs font-medium text-slate-800 dark:text-slate-200">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {feature.name}
                              </span>
                              {feature.tooltip && (
                                <span
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help transition"
                                  title={feature.tooltip}
                                >
                                  <Info className="w-3.5 h-3.5 inline" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Free */}
                          <td className="p-4 sm:p-5 text-center border-l border-slate-200 dark:border-slate-800/60">
                            {renderValue(feature.free)}
                          </td>

                          {/* Pro Yearly */}
                          <td className="p-4 sm:p-5 text-center border-l border-slate-200 dark:border-slate-800/60 bg-amber-500/[0.02] dark:bg-amber-500/[0.04]">
                            {renderValue(feature.proYearly)}
                          </td>

                          {/* Business */}
                          <td className="p-4 sm:p-5 text-center border-l border-slate-200 dark:border-slate-800/60 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04]">
                            {renderValue(feature.business)}
                          </td>

                          {/* Enterprise SSO */}
                          <td className="p-4 sm:p-5 text-center border-l border-indigo-500/20 bg-slate-950/40">
                            {renderValue(feature.enterprise, true)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Table Footer Bottom CTAs */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90">
                  <td className="p-4 sm:p-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t("pricing.matrix.readyToScale", "Ready to scale your organization?")}
                  </td>
                  <td className="p-4 sm:p-5 text-center border-l border-slate-200 dark:border-slate-800/60">
                    <span className="text-[11px] font-bold text-slate-500">{t("pricing.matrix.freeTierActive", "Free Tier Active")}</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center border-l border-slate-200 dark:border-slate-800/60 bg-amber-500/5">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(proYearlyPlan)}
                      disabled={isProcessing}
                      className="w-full py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      {t("pricing.matrix.getProAnnual", "Get Pro Annual")}
                    </button>
                  </td>
                  <td className="p-4 sm:p-5 text-center border-l border-slate-200 dark:border-slate-800/60 bg-indigo-500/5">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(businessPlan)}
                      disabled={isProcessing}
                      className="w-full py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      {t("pricing.matrix.getBusinessTeam", "Get Business Team")}
                    </button>
                  </td>
                  <td className="p-4 sm:p-5 text-center border-l border-indigo-500/30 bg-slate-950">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(enterprisePlan)}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
                    >
                      {t("pricing.matrix.getEnterpriseSSO", "Get Enterprise SSO")}
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
