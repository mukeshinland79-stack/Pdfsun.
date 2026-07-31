import React from "react";
import { X, ShieldCheck, Mail, User, FileText } from "lucide-react";
import { PolicyType } from "../types";

interface PolicyModalsProps {
  policy: PolicyType | null;
  onClose: () => void;
}

export const PolicyModals: React.FC<PolicyModalsProps> = ({ policy, onClose }) => {
  if (!policy) return null;

  let title = "PDFSun Document Policy";
  let content = <p>Default policy statement.</p>;

  if (policy === "privacy") {
    title = "Privacy Policy - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p><strong>Effective Date: 2026</strong></p>
        <p>At <strong>PDFSun</strong>, owned and operated by <strong>Mukesh Kalonia</strong>, we take user privacy and document confidentiality with top-tier enterprise care.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Local Client Processing</h4>
        <p>Whenever you merge, split, rotate, watermark, protect, or organize PDF files on PDFSun, the processing is performed 100% locally in your browser using client-side WebAssembly routines. Your document binary data never reaches our servers.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. AI Document Processing</h4>
        <p>When using Gemini AI tools (AI Chat, AI Summarizer, AI Translation, Flashcards), document text chunks are transmitted securely over TLS HTTPS strictly for inference. We do NOT retain, log, or train models on your uploaded documents.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. Auto-Deletion Guarantee</h4>
        <p>Temporary file caches associated with multi-file conversions or AI streams are automatically purged immediately upon task completion.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">4. Contact Support</h4>
        <p>For privacy inquiries, contact Owner Mukesh Kalonia at <a href="mailto:mukeshkalonia241@gmail.com" className="text-orange-500 font-bold underline">mukeshkalonia241@gmail.com</a>.</p>
      </div>
    );
  } else if (policy === "terms") {
    title = "Terms & Conditions - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p>By accessing or using <strong>PDFSun</strong>, you agree to comply with and be bound by these Terms & Conditions established for PDFSun platform services.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Acceptable Use</h4>
        <p>You agree not to upload malicious files, copyrighted material without permission, or attempt reverse engineering of PDFSun engines.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. Service Availability</h4>
        <p>While we guarantee maximum uptime and browser client stability, PDFSun is provided "as is".</p>
      </div>
    );
  } else if (policy === "cookie") {
    title = "Cookie Policy - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p>PDFSun uses essential local storage cookies solely to save your dark mode preference, recent tool conversion log, and favorite tool list on your local device.</p>
      </div>
    );
  } else if (policy === "refund") {
    title = "Refund Policy - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p>We offer a 14-day no-questions-asked refund policy for Pro Sun and Team Enterprise subscription purchases on PDFSun. Contact mukeshkalonia241@gmail.com for instant refund processing.</p>
      </div>
    );
  } else if (policy === "about") {
    title = "About PDFSun & Owner Mukesh Kalonia";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p><strong>PDFSun</strong> was created by <strong>Mukesh Kalonia</strong> to provide the world with a modern, fast, and 100% private PDF tools workspace integrated with next-gen Gemini 3.6 AI capabilities.</p>
      </div>
    );
  } else if (policy === "contact") {
    title = "Contact & Support - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p>Have questions, feature requests, or enterprise support inquiries?</p>
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
            <Mail className="w-4 h-4 text-orange-500" />
            <span>Support Email: mukeshkalonia241@gmail.com</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <User className="w-4 h-4 text-orange-500" />
            <span>Owner & Developer: Mukesh Kalonia</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2">{content}</div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
