import React, { useState } from "react";

export interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState({ loading: false, success: false, ticketId: "" });
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, ticketId: "" });
    setErrorMessage("");

    try {
      const csrfCookieMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|;\s*)pdfsun_csrf_token=([^;]+)/)
          : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfCookieMatch?.[1]) {
        headers["x-csrf-token"] = decodeURIComponent(csrfCookieMatch[1]);
      }

      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success || !data?.ticketId) {
        throw new Error(data?.message || data?.error || "Failed to submit support inquiry.");
      }

      setStatus({
        loading: false,
        success: true,
        ticketId: String(data.ticketId),
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      setStatus({ loading: false, success: false, ticketId: "" });
      setErrorMessage(error?.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Contact Support Modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="mb-5 pr-8">
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🛡️</span> Contact &amp; Support Center
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Official <span className="text-amber-400 font-medium">Pdfsun Support Channel</span>
          </p>
          <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs text-slate-300">
            <span className="font-semibold text-white">Direct Assistance:</span> Reach us at{" "}
            <a href="mailto:support@pdfsun.in" className="text-sky-400 hover:underline">
              support@pdfsun.in
            </a>
          </div>
        </div>

        {/* Inline Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2"
          >
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        {status.success ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 text-center animate-fade-in my-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
              ✓
            </div>
            <h4 className="text-base font-semibold text-emerald-300">Message Sent Successfully!</h4>
            <p className="text-xs text-slate-400 mt-1.5">
              Ticket ID{" "}
              <span className="font-mono text-emerald-400 font-bold">{status.ticketId}</span> has
              been created. Our team will get back to you via email shortly.
            </p>
            <div className="mt-5 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setStatus({ loading: false, success: false, ticketId: "" })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200 transition-colors"
              >
                Send Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-xs font-semibold rounded-xl text-slate-950 transition-colors"
              >
                Close Modal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                maxLength={254}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject / Inquiry Topic
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., PDF to Word formatting issue / Payment query"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Message Details
              </label>
              <textarea
                required
                minLength={10}
                maxLength={4000}
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe how we can help you with Pdfsun tools..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {status.loading ? "Submitting Ticket..." : "Submit Support Ticket"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ContactSupportModal;
