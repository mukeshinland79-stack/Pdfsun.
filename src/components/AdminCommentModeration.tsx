import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  Ban,
  Search,
  Filter,
  RefreshCw,
  Mail,
  AlertTriangle,
  Star,
  Check,
  ExternalLink,
  Shield,
  Layers
} from "lucide-react";
import { UserComment } from "../types";

export interface AdminCommentModerationProps {
  currentUserEmail?: string;
}

export const AdminCommentModeration: React.FC<AdminCommentModerationProps> = ({
  currentUserEmail = "mukeshinland79@gmail.com"
}) => {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pendingCount: 0,
    approvedCount: 0,
    spamCount: 0,
    bannedIpCount: 0
  });
  const [bannedIps, setBannedIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusTab, setStatusTab] = useState<"pending" | "approved" | "spam" | "all" | "banned_ips">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action status message
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email Alert Modal state
  const [showEmailTestModal, setShowEmailTestModal] = useState(false);

  // Fetch comments from Admin API
  const fetchAdminComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?status=${statusTab === "banned_ips" ? "all" : statusTab}`, {
        headers: {
          "x-user-email": currentUserEmail.toLowerCase().trim(),
          "x-admin-token": "12345"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setComments(data.comments || []);
          if (data.metrics) setMetrics(data.metrics);
          if (data.bannedIps) setBannedIps(data.bannedIps);
        }
      }
    } catch (err) {
      console.error("Failed to load admin comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminComments();
  }, [statusTab]);

  // Execute One-Click Action
  const handleCommentAction = async (commentId: string, action: "approve" | "reject" | "delete" | "ban_ip", ipToBan?: string) => {
    try {
      const res = await fetch("/api/admin/comments/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUserEmail.toLowerCase().trim(),
          "x-admin-token": "12345"
        },
        body: JSON.stringify({ commentId, action, ipToBan })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: "success", text: data.message });
        setTimeout(() => setActionMsg(null), 3000);
        fetchAdminComments();
      } else {
        setActionMsg({ type: "error", text: data.message || "Action failed." });
      }
    } catch (err) {
      console.error("Error performing moderation action:", err);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: "approve" | "reject" | "delete") => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/admin/comments/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUserEmail.toLowerCase().trim(),
          "x-admin-token": "12345"
        },
        body: JSON.stringify({ ids: selectedIds, action })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: "success", text: data.message });
        setTimeout(() => setActionMsg(null), 3000);
        setSelectedIds([]);
        fetchAdminComments();
      }
    } catch (err) {
      console.error("Error performing bulk action:", err);
    }
  };

  // Unban IP
  const handleUnbanIp = async (ip: string) => {
    try {
      const res = await fetch("/api/admin/comments/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUserEmail.toLowerCase().trim(),
          "x-admin-token": "12345"
        },
        body: JSON.stringify({ action: "unban_ip", ipToBan: ip })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: "success", text: `Unbanned IP: ${ip}` });
        setTimeout(() => setActionMsg(null), 3000);
        fetchAdminComments();
      }
    } catch (err) {
      console.error("Error unbanning IP:", err);
    }
  };

  // Checkbox select handler
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredComments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComments.map((c) => c.id));
    }
  };

  // Filter list by Search
  const filteredComments = comments.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.comment.toLowerCase().includes(q) ||
      c.userName.toLowerCase().includes(q) ||
      (c.userEmail || "").toLowerCase().includes(q) ||
      c.toolName.toLowerCase().includes(q) ||
      c.ipHash.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Metrics Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl text-white">
        <div>
          <h2 className="text-lg font-black text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Comments & Reviews Moderation Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time control over user feedback, profanity filtering, XSS protection, and IP ban actions.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowEmailTestModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Simulate Admin Email Alert</span>
          </button>
          
          <button
            onClick={fetchAdminComments}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center space-x-2 animate-in fade-in ${
            actionMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics.total}</div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Approval</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{metrics.pendingCount}</div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Published Live</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.approvedCount}</div>
        </div>

        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Quarantined / Spam</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{metrics.spamCount}</div>
        </div>

        <div className="p-4 bg-slate-800 text-white border border-slate-700 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Banned IP Addresses</div>
          <div className="text-2xl font-black text-white mt-1">{metrics.bannedIpCount}</div>
        </div>
      </div>

      {/* 2. Navigation Status Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
        
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-bold scrollbar-none w-full sm:w-auto">
          <button
            onClick={() => setStatusTab("pending")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
              statusTab === "pending"
                ? "bg-amber-500 text-white font-black shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Pending Queue</span>
            {metrics.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-600 text-[10px] font-black">
                {metrics.pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusTab("approved")}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              statusTab === "approved"
                ? "bg-emerald-600 text-white font-black shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Approved
          </button>

          <button
            onClick={() => setStatusTab("spam")}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              statusTab === "spam"
                ? "bg-rose-600 text-white font-black shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Spam / Flagged
          </button>

          <button
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              statusTab === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Logs
          </button>

          <button
            onClick={() => setStatusTab("banned_ips")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shrink-0 ${
              statusTab === "banned_ips"
                ? "bg-slate-800 text-white font-black shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            <span>Banned IPs ({metrics.bannedIpCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search text, name, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 3. Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{selectedIds.length} review(s) selected for bulk action</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction("approve")}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition"
            >
              Approve All
            </button>
            <button
              onClick={() => handleBulkAction("reject")}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition"
            >
              Mark Spam
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg transition"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Data Table or Banned IP View */}
      {statusTab === "banned_ips" ? (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Ban className="w-4 h-4 text-rose-500" />
            <span>Restricted & Banned Network Addresses</span>
          </h3>

          {bannedIps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No IPs are currently restricted or banned.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {bannedIps.map((ip) => (
                <div key={ip} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ip}</span>
                    <span className="text-[10px] text-slate-400">Blocked from submitting reviews</span>
                  </div>
                  <button
                    onClick={() => handleUnbanIp(ip)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition"
                  >
                    Unban IP
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredComments.length && filteredComments.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Tool</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Review Text</th>
                  <th className="p-3">Spam Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">One-Click Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500 mb-2" />
                      Fetching review entries...
                    </td>
                  </tr>
                ) : filteredComments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No review comments found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredComments.map((cmt) => (
                    <tr
                      key={cmt.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(cmt.id)}
                          onChange={() => toggleSelectRow(cmt.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{cmt.userName || "Anonymous"}</div>
                        {cmt.userEmail && <div className="text-[10px] text-slate-400 font-mono">{cmt.userEmail}</div>}
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">IP: {cmt.ipHash}</div>
                      </td>

                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {cmt.toolName}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center space-x-1 font-bold text-amber-500">
                          <span>{cmt.rating}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2 text-xs leading-relaxed">
                          {cmt.comment}
                        </p>
                        {cmt.flaggedReason && (
                          <div className="text-[9px] text-rose-500 font-bold mt-1">
                            Flagged: {cmt.flaggedReason}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            (cmt.spamScore || 0) >= 50
                              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                              : (cmt.spamScore || 0) >= 20
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {cmt.spamScore || 0}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            cmt.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : cmt.status === "pending"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {cmt.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {cmt.status !== "approved" && (
                            <button
                              onClick={() => handleCommentAction(cmt.id, "approve")}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg transition"
                              title="Approve Review"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleCommentAction(cmt.id, "delete")}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleCommentAction(cmt.id, "ban_ip", cmt.ipHash)}
                            className="p-1.5 bg-slate-800 hover:bg-black text-rose-400 hover:text-white rounded-lg transition"
                            title="Block / Ban IP"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Email Alert Simulator Modal */}
      {showEmailTestModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>Instant Admin Email Notification Preview</span>
              </h3>
              <button
                onClick={() => setShowEmailTestModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="text-[10px] text-slate-400 font-mono">From: alerts@pdfsun.in → {currentUserEmail}</div>
              <div className="font-bold text-slate-900 dark:text-white">
                [PDFSun Alert] New Review Submission on Merge PDF Tool
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">User: Rohit S.</span>
                  <span className="text-amber-500 font-bold">5 ★★★★★</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  "Awesome performance! Saved me so much time today."
                </p>
                <div className="text-[10px] text-slate-400 font-mono">IP: 103.24.xx.xx (Clean)</div>
              </div>

              <div className="flex items-center justify-around pt-2">
                <button
                  onClick={() => {
                    alert("Simulated [Approve] clicked from Email!");
                    setShowEmailTestModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 transition"
                >
                  [Approve Live]
                </button>
                <button
                  onClick={() => {
                    alert("Simulated [Delete] clicked from Email!");
                    setShowEmailTestModal(false);
                  }}
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-500 transition"
                >
                  [Delete Review]
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Direct quick-action buttons inside emails allow instant 1-click approvals without logging in.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
