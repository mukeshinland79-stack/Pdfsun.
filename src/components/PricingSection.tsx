import React, { useState } from "react";
import { Check, Zap, Sparkles, ShieldCheck } from "lucide-react";
import { PRICING_PLANS } from "../data/toolsData";

export const PricingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-amber-400 text-xs font-bold">
          <Zap className="w-3.5 h-3.5" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Choose the Perfect PDFSun Plan
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Start for free with core PDF tools, or upgrade to Pro Sun for unlimited Gemini 3.6 AI processing and batch operations.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold mt-4">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-xl transition ${
              billingCycle === "monthly"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                : "text-slate-500"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-xl transition flex items-center space-x-1 ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                : "text-slate-500"
            }`}
          >
            <span>Yearly Billing</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 uppercase font-black">Save 25%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => {
          const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 bg-white dark:bg-slate-800 border transition duration-200 flex flex-col justify-between ${
                plan.popular
                  ? "border-orange-500 shadow-2xl shadow-orange-500/15 ring-2 ring-orange-500/50"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  MOST POPULAR FOR STUDENTS
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.tagline}</p>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">${price}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    / month {billingCycle === "yearly" && price > 0 ? "(billed annually)" : ""}
                  </span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => alert(`Selected ${plan.name} Plan on PDFSUN.COM`)}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-md ${
                    plan.popular
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-95"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
