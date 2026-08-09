import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  AlertCircle,
  Clock,
  Mail,
  Wrench,
  ThumbsUp,
  ShieldCheck,
  Download,
  Award
} from "lucide-react";
import {
  fetchAllToolFeedbackFromFirestore,
  approveToolFeedbackInFirestore,
  deleteToolFeedbackFromFirestore,
  updateToolFeedbackHelpfulInFirestore,
  ToolFeedbackItemRecord
} from "../lib/firebase";

export const AdminFeedbackModeration: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<ToolFeedbackItemRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [helpfulFilter, setHelpfulFilter] = useState<"all" | "has_votes" | "popular_votes" | "zero_votes">("all");
  const [sortBy, setSortBy] = useState<
    "date_desc" | "date_asc" | "helpful_desc" | "helpful_asc" | "rating_desc" | "rating_asc" | "tool_asc" | "tool_desc"
  >("date_desc");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const items = await fetchAllToolFeedbackFromFirestore();
      setFeedbackList(items);
    } catch (err) {
      console.error("Error loading tool_feedback from Firestore:", err);
      setNotification({ type: "error", message: "Failed to fetch feedback entries from Firestore." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleExportCSV = () => {
    if (feedbackList.length === 0) {
      setNotification({ type: "error", message: "No feedback data available to export." });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const headers = ["Document ID", "Tool ID", "Rating", "Helpful Votes", "Status", "Timestamp", "User Email", "Comment"];
    const rows = feedbackList.map((item) => {
      const escape = (val: any) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };
      return [
        escape(item.id),
        escape(item.toolId),
        item.rating,
        item.helpfulCount || 0,
        escape(item.status || "pending"),
        escape(item.timestamp),
        escape(item.userEmail || ""),
        escape(item.comment)
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent([headers.join(","), ...rows].join("\n"));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", csvContent);
    const dateStr = new Date().toISOString().split("T")[0];
    downloadAnchor.setAttribute("download", `tool_feedback_collection_${dateStr}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    setNotification({
      type: "success",
      message: `Successfully exported ${feedbackList.length} feedback items to CSV!`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const success = await approveToolFeedbackInFirestore(id);
      if (success) {
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
        );
        setNotification({ type: "success", message: "Feedback approved successfully!" });
      } else {
        setNotification({ type: "error", message: "Failed to approve feedback in Firestore." });
      }
    } catch (err) {
      setNotification({ type: "error", message: "An error occurred while approving." });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback entry from Firestore?")) {
      return;
    }
    setActionLoadingId(id);
    try {
      const success = await deleteToolFeedbackFromFirestore(id);
      if (success) {
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
        setNotification({ type: "success", message: "Feedback deleted successfully from Firestore!" });
      } else {
        setNotification({ type: "error", message: "Failed to delete feedback entry." });
      }
    } catch (err) {
      setNotification({ type: "error", message: "An error occurred while deleting." });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleVoteHelpful = async (id: string, currentVotes: number) => {
    const newVotes = currentVotes + 1;
    setFeedbackList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, helpfulCount: newVotes } : item))
    );
    try {
      await updateToolFeedbackHelpfulInFirestore(id, newVotes);
      setNotification({ type: "success", message: "Helpful vote recorded successfully!" });
      setTimeout(() => setNotification(null), 2500);
    } catch (err) {
      console.error("Failed to update helpful votes:", err);
    }
  };

  const filteredAndSortedItems = feedbackList
    .filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.toolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.userEmail || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && item.status === "approved") ||
        (statusFilter === "pending" && (item.status === "pending" || !item.status));

      const votes = item.helpfulCount || 0;
      const matchesHelpful =
        helpfulFilter === "all" ||
        (helpfulFilter === "has_votes" && votes > 0) ||
        (helpfulFilter === "popular_votes" && votes >= 3) ||
        (helpfulFilter === "zero_votes" && votes === 0);

      return matchesSearch && matchesStatus && matchesHelpful;
    })
    .sort((a, b) => {
      if (sortBy === "helpful_desc") {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      if (sortBy === "helpful_asc") {
        return (a.helpfulCount || 0) - (b.helpfulCount || 0);
      }
      if (sortBy === "date_desc") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === "rating_desc") {
        return b.rating - a.rating;
      }
      if (sortBy === "rating_asc") {
        return a.rating - b.rating;
      }
      if (sortBy === "tool_asc") {
        return a.toolId.localeCompare(b.toolId);
      }
      if (sortBy === "tool_desc") {
        return b.toolId.localeCompare(a.toolId);
      }
      return 0;
    });

  const totalCount = feedbackList.length;
  const pendingCount = feedbackList.filter((i) => i.status === "pending" || !i.status).length;
  const approvedCount = feedbackList.filter((i) => i.status === "approved").length;
  const totalHelpfulVotes = feedbackList.reduce((acc, curr) => acc + (curr.helpfulCount || 0), 0);
  const avgRating =
    totalCount > 0
      ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalCount).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-base font-black text-white">Tool Feedback Moderation</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase border border-emerald-500/30 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Firestore Collection: tool_feedback</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-extrabold text-[10px] border border-orange-500/30 flex items-center space-x-1">
                <Mail className="w-3 h-3 text-orange-400" />
                <span>Email Alerts & Direct Action Links</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Review, moderate, and filter user comments based on approval status and <strong className="text-blue-300 font-semibold">'Helpful' votes</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={loading || feedbackList.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-md disabled:opacity-50"
            title="Download tool_feedback collection as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={loadFeedback}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center space-x-2 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Firestore</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2 animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Feedback</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold uppercase text-amber-500">Pending Review</div>
          <div className="text-xl font-black text-amber-500 mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold uppercase text-emerald-500">Approved</div>
          <div className="text-xl font-black text-emerald-500 mt-1">{approvedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold uppercase text-blue-400">Helpful Votes</div>
          <div className="text-xl font-black text-blue-400 mt-1 flex items-center space-x-1.5">
            <ThumbsUp className="w-4 h-4 text-blue-400" />
            <span>{totalHelpfulVotes}</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold uppercase text-amber-400">Average Rating</div>
          <div className="text-xl font-black text-amber-400 mt-1 flex items-center space-x-1">
            <span>{avgRating}</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tool ID, comment, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved Only</option>
            </select>
          </div>

          {/* Helpful Votes Filter */}
          <div className="flex items-center space-x-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-slate-400">Helpful Votes:</span>
            <select
              value={helpfulFilter}
              onChange={(e) => setHelpfulFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="all">All Comments</option>
              <option value="has_votes">Has Helpful Votes (&gt; 0)</option>
              <option value="popular_votes">Highly Helpful (3+ Votes)</option>
              <option value="zero_votes">No Votes Yet (0 Votes)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="helpful_desc">Helpful Votes: Most First</option>
              <option value="helpful_asc">Helpful Votes: Least First</option>
              <option value="rating_desc">Rating: Highest First</option>
              <option value="rating_asc">Rating: Lowest First</option>
              <option value="tool_asc">Tool Name: A to Z</option>
              <option value="tool_desc">Tool Name: Z to A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Moderation List / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-xs font-bold">Loading tool feedback documents from Firestore...</p>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-500 opacity-50" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Tool Feedback Documents Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all" || helpfulFilter !== "all"
              ? "No feedback entries match your search criteria, helpful votes filter, or status."
              : "When users submit ratings or comments on PDF tools, they will appear here from the 'tool_feedback' Firestore collection."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Tool ID</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5 max-w-md">Comment & User</th>
                <th className="p-3.5 text-center">Helpful Votes</th>
                <th className="p-3.5">Submitted</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-200">
              {filteredAndSortedItems.map((item) => {
                const isApproved = item.status === "approved";
                const isActioning = actionLoadingId === item.id;
                const votes = item.helpfulCount || 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold">
                      <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                        <Wrench className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono">{item.toolId}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= item.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-700"
                            }`}
                          />
                        ))}
                        <span className="ml-1 font-bold text-[11px] text-slate-600 dark:text-slate-400">
                          ({item.rating}/5)
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 max-w-md space-y-1">
                      <p className="text-slate-900 dark:text-white font-medium text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        "{item.comment}"
                      </p>
                      {item.userEmail && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{item.userEmail}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800/60">
                        <ThumbsUp className={`w-3.5 h-3.5 ${votes > 0 ? "text-blue-500 fill-blue-500/20" : "text-slate-400"}`} />
                        <span className="font-bold text-xs text-blue-700 dark:text-blue-300">{votes}</span>
                        <button
                          onClick={() => handleVoteHelpful(item.id, votes)}
                          className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-md transition"
                          title="Add +1 Helpful Vote"
                        >
                          +1
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {isApproved ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase border border-emerald-500/30 flex items-center space-x-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-[10px] uppercase border border-amber-500/30 flex items-center space-x-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {!isApproved && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={isActioning}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isActioning}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30 transition flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
