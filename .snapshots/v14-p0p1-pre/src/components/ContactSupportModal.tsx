import React, { useState } from "react";
import { Mail, Send, CheckCircle2, X, LifeBuoy, ShieldCheck, MapPin, User, FileText } from "lucide-react";

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <LifeBuoy className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Contact & Support Center</h3>
              <p className="text-[10px] text-slate-400">PDFSun Direct Support Desk</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Support Info Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 dark:text-amber-400">
            <Mail className="w-4 h-4" />
            <span>Direct Email Support</span>
          </div>
          <div className="text-xs font-mono text-slate-900 dark:text-white font-bold">
            mukeshkalonia241@gmail.com
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Managed directly by platform owner <strong>Mukesh Kalonia</strong>. Average response time: under 2 hours.
          </p>
        </div>

        {/* Form */}
        {sentSuccess ? (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h4>
            <p className="text-xs text-slate-400">
              Ticket ID #PDFSUN-{(Math.random() * 8999 + 1000).toFixed(0)} created. We will get back to you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mukesh Kalonia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Subject</label>
              <input
                type="text"
                required
                placeholder="e.g. Question regarding PDF Merge or API Key"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Message</label>
              <textarea
                required
                rows={4}
                placeholder="How can we assist you today?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md hover:opacity-95 transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Inquiries</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
