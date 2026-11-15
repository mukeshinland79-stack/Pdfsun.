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
        <p><strong>Effective Date: 2026 • Canonical Domain: https://www.pdfsun.in/</strong></p>
        <p>At <strong>PDFSun (pdfsun.in)</strong>, owned and operated by <strong>Mukesh Kalonia</strong>, we treat user privacy, document confidentiality, and data minimization as foundational engineering principles.</p>
        
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Local Client-Side Processing (Zero Server Ingress)</h4>
        <p>All core PDF utilities (including Merge, Split, Compress, Rotate, Protect, Watermark, Add Page Numbers, Edit Metadata, and Reorder) execute 100% locally inside your web browser sandbox using compiled WebAssembly (WASM). Your original documents, file bytes, and processed outputs are never transmitted to, processed by, or stored on our servers.</p>
        
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. AI Document Processing &amp; Transient In-Memory Inference</h4>
        <p>When you explicitly utilize Gemini AI utilities (such as AI Chat with PDF, AI Summarizer, or AI Document Translation), document text passages are transmitted securely over encrypted TLS HTTPS strictly for ephemeral computational inference. PDFSun enforces zero server-side disk persistence: text passages are immediately purged from memory upon completion and are never used to train public foundation models.</p>
        
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. Google AdSense &amp; Third-Party Advertising Cookies</h4>
        <p>PDFSun partners with third-party advertising vendors, including <strong>Google AdSense</strong>, to display non-intrusive advertisements across the platform:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Third-party vendors, including Google, use cookies (such as the DoubleClick cookie) to serve advertisements based on a user&apos;s prior visits to this website or other websites across the Internet.</li>
          <li>Google&apos;s use of advertising cookies enables it and its certified partners to serve relevant ads based on browsing history.</li>
          <li><strong>Document Privacy Guarantee:</strong> Advertisers and advertising cookies have <strong>absolute zero access</strong> to your uploaded files, document contents, filenames, or extracted text. Document manipulation is strictly sandboxed in local browser memory.</li>
          <li><strong>Opt-Out Rights:</strong> Users may opt out of personalized advertising at any time by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Google Ads Settings</a>. Alternatively, you can opt out of third-party vendor cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">www.aboutads.info</a>.</li>
        </ul>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">4. Cookies &amp; Local Storage</h4>
        <p>PDFSun uses first-party browser local storage strictly for essential user preferences: saving your active theme (light/dark/eye-protection), tool favorites, and recent local activity history. We do not sell or monetize personal browsing history.</p>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">5. Contact Support &amp; Grievance Redressal</h4>
        <p>For any privacy-related inquiries, data rights requests, or feedback, you can reach Platform Operator Mukesh Kalonia directly at <a href="mailto:mukeshinland79@gmail.com" className="text-blue-600 dark:text-blue-400 font-bold underline font-mono">mukeshinland79@gmail.com</a> or <a href="mailto:mukeshkalonia241@gmail.com" className="text-blue-600 dark:text-blue-400 font-bold underline font-mono">mukeshkalonia241@gmail.com</a>.</p>
      </div>
    );
  } else if (policy === "terms") {
    title = "Terms & Conditions - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p>By accessing or using <strong>PDFSun (https://www.pdfsun.in/)</strong>, you agree to comply with and be bound by these Terms & Conditions established for PDFSun platform services.</p>
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
        <p><strong>Effective Date: 2026 • PDFSun (pdfsun.in)</strong></p>
        <p>This Cookie Policy explains how PDFSun uses cookies and similar client-side storage technologies to ensure seamless platform operation and support our free online services.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Essential Local Storage</h4>
        <p>We use browser local storage exclusively to save your interface preferences (such as dark mode, eye protection theme), language selection, and your offline tool conversion history. These preferences never leave your device.</p>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. Advertising &amp; Analytics Cookies</h4>
        <p>Third-party partners, including Google AdSense, may place and read cookies on your browser to measure ad impressions and serve contextual advertisements. You can control or disable advertising cookies via your browser settings or by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Ads Settings</a> and <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">aboutads.info</a>.</p>
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
    title = "About PDFSun - Mission & Leadership";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p><strong>PDFSun (pdfsun.in)</strong> is an independent, high-performance web document platform engineered to provide individuals, students, researchers, and global enterprises with fast, secure, and intuitive PDF productivity utilities.</p>
        
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Our Mission</h4>
        <p>Most traditional online PDF converters upload sensitive user documents, personal tax forms, and medical records to remote cloud servers for processing. At PDFSun, our core design philosophy is <strong>100% In-Browser Privacy</strong>. We leverage state-of-the-art WebAssembly (WASM) and multi-threaded Web Workers to execute document merges, splits, compressions, and conversions directly on your local device CPU, eliminating server data leaks entirely.</p>
        
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Founder &amp; Engineering Leadership</h4>
        <p>PDFSun was founded and is actively maintained by <strong>Mukesh Kalonia</strong>, a Senior Software Engineer specializing in modern WebAssembly runtimes, high-throughput distributed systems, and AI-assisted workflows. Based in India, Mukesh leads all platform architecture, algorithmic optimizations, and security audits for PDFSun.</p>
        
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Core Technology Stack</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Client-Side Engine:</strong> Custom WebAssembly (pdf-lib, pdfjs-dist, and Tesseract OCR) executing entirely offline in the browser.</li>
          <li><strong>AI Document Intelligence:</strong> Google Gemini 3.6 API integration for natural language summaries, research Q&amp;A, and multilingual document translation.</li>
          <li><strong>Infrastructure &amp; Uptime:</strong> Globally distributed Cloud Run edge containers with automated HTTPS/TLS encryption and 99.98% target availability.</li>
        </ul>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Editorial &amp; Quality Commitment</h4>
        <p>Every tool, step-by-step tutorial, and technical article on PDFSun is researched, written, and verified by our engineering team to ensure zero misleading claims, accurate file fidelity, and compliance with Google Webmaster and AdSense Quality Guidelines.</p>
      </div>
    );
  } else if (policy === "contact") {
    title = "Contact Us & Grievance Support - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p>We welcome your questions, partnership inquiries, bug reports, and feedback. Our dedicated support team responds to all inquiries within <strong>24 business hours</strong>.</p>
        
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-3">
          <div className="flex items-start space-x-3 text-sm font-bold text-slate-900 dark:text-white">
            <Mail className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="block text-slate-900 dark:text-white">Official Support &amp; Privacy Email:</span>
              <a href="mailto:mukeshkalonia241@gmail.com" className="text-orange-600 dark:text-orange-400 underline font-mono text-xs">mukeshkalonia241@gmail.com</a>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <User className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="block text-slate-900 dark:text-white font-bold">Platform Founder &amp; Operator:</span>
              <span>Mukesh Kalonia (Headquarters: Rajasthan, India)</span>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="block text-slate-900 dark:text-white font-bold">Statutory Grievance Officer (IT Rules, India):</span>
              <span>Mukesh Kalonia • Response SLA: Within 48 hours</span>
            </div>
          </div>
        </div>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Customer Support Inquiries</h4>
        <p>For billing inquiries regarding PDFSun Pro subscriptions, Razorpay transaction verification, or commercial API access, please include your transaction ID or registered account email in your message.</p>
      </div>
    );
  } else if (policy === "disclaimer") {
    title = "Disclaimer & Fair Use Policy - PDFSun";
    content = (
      <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <p><strong>Last Updated: 2026</strong></p>
        <p>The information, tools, and utilities provided on <strong>PDFSun (pdfsun.in)</strong> are offered for general document processing, educational, and professional productivity purposes on an "as is" and "as available" basis.</p>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. File Ownership &amp; User Responsibility</h4>
        <p>Users retain 100% intellectual property ownership of all files and content manipulated through PDFSun. By using our utilities, you represent and warrant that you possess all requisite legal rights, permissions, and authorizations to process, alter, or convert the uploaded files. PDFSun disclaims any liability for unauthorized use of copyrighted or proprietary content.</p>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. AI Output &amp; Accuracy Disclaimer</h4>
        <p>PDFSun integrates Google Gemini AI models for document summarization, language translation, and conversational queries. While we implement strict quality controls, AI-generated outputs are probabilistic and may occasionally contain inaccuracies. Users must verify all critical legal, medical, or financial information independently.</p>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. Third-Party Trademarks &amp; Non-Affiliation</h4>
        <p>PDF, Adobe, Microsoft Word, Excel, PowerPoint, Google, and related brand names or trademarks referenced on this website belong to their respective copyright holders. PDFSun is an independent web application and is not sponsored, endorsed, or affiliated with Adobe Systems Inc. or Microsoft Corporation.</p>

        <h4 className="font-bold text-sm text-slate-900 dark:text-white">4. Limitation of Liability</h4>
        <p>Under no circumstances shall PDFSun or its operator Mukesh Kalonia be liable for any incidental, indirect, consequential, or punitive damages resulting from the use or inability to use our tools, including data corruption or file loss. We strongly recommend keeping original backups of all critical files prior to processing.</p>
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
