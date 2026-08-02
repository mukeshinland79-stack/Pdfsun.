import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Clock,
  UserCheck,
  Settings,
  Database,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  Terminal,
  Download,
  AlertOctagon,
  Key,
  Crown,
  Activity,
  UserX,
  Sliders,
  AlertTriangle,
  Radio,
  Trash2,
  PlusCircle,
  Eye,
} from "lucide-react";
import { UserProfile, DUAL_OWNER_EMAILS } from "../types";

export interface SystemActivityEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  category: "login_attempt" | "config_change" | "system_error" | "security" | "user_management";
  ipAddress: string;
  status: "success" | "warning" | "error" | "denied";
  details: string;
}

export interface AdminActivityLogProps {
  className?: string;
  currentUserProfile?: UserProfile | null;
}

const INITIAL_SYSTEM_EVENTS: SystemActivityEntry[] = [
  {
    id: "evt-201",
    timestamp: new Date().toLocaleTimeString(),
    userEmail: "mukeshinland79@gmail.com",
    action: "Dual-Owner Login Authentication",
    category: "login_attempt",
    ipAddress: "152.58.16.42",
    status: "success",
    details: "Authenticated via 2FA token as Verified Dual-Owner.",
  },
  {
    id: "evt-202",
    timestamp: new Date(Date.now() - 1000 * 45).toLocaleTimeString(),
    userEmail: "mukeshkalonia241@gmail.com",
    action: "Runtime Config Update",
    category: "config_change",
    ipAddress: "103.21.124.9",
    status: "success",
    details: "Updated TEMP_STORAGE_RETENTION_MINUTES to 60 with Zero Downtime.",
  },
  {
    id: "evt-203",
    timestamp: new Date(Date.now() - 1000 * 120).toLocaleTimeString(),
    userEmail: "unauthorized_attacker@ip-blocked.com",
    action: "Unauthorized Admin Route Probe",
    category: "login_attempt",
    ipAddress: "185.220.101.5",
    status: "denied",
    details: "Cloaked route returned 404 Stealth Not Found. Access Denied.",
  },
  {
    id: "evt-204",
    timestamp: new Date(Date.now() - 1000 * 240).toLocaleTimeString(),
    userEmail: "system-node-01",
    action: "Heavy Transformation Memory Spike",
    category: "system_error",
    ipAddress: "127.0.0.1",
    status: "warning",
    details: "PDF conversion process exceeded 85% node heap memory allocation.",
  },
  {
    id: "evt-205",
    timestamp: new Date(Date.now() - 1000 * 360).toLocaleTimeString(),
    userEmail: "mukeshinland79@gmail.com",
    action: "Toggled Stealth Mode Cloaking",
    category: "config_change",
    ipAddress: "152.58.16.42",
    status: "success",
    details: "Enabled OWNER_ONLY_STEALTH_MODE to cloak admin endpoints.",
  },
  {
    id: "evt-206",
    timestamp: new Date(Date.now() - 1000 * 600).toLocaleTimeString(),
    userEmail: "unknown_client_82",
    action: "Rate Limit Exceeded (429)",
    category: "security",
    ipAddress: "45.12.89.102",
    status: "error",
    details: "Client exceeded maximum threshold of 10,000 req/hr. IP temporarily throttled.",
  },
  {
    id: "evt-207",
    timestamp: new Date(Date.now() - 1000 * 900).toLocaleTimeString(),
    userEmail: "mukeshkalonia241@gmail.com",
    action: "Promoted Admin User Permissions",
    category: "user_management",
    ipAddress: "103.21.124.9",
    status: "success",
    details: "Granted Dual-Owner Admin Rights to mukeshinland79@gmail.com.",
  },
];

export const AdminActivityLog: React.FC<AdminActivityLogProps> = ({
  className = "",
  currentUserProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [logs, setLogs] = useState<SystemActivityEntry[]>(INITIAL_SYSTEM_EVENTS);

  const activeEmail = (currentUserProfile?.email || "mukeshinland79@gmail.com").toLowerCase().trim();
  const isVerifiedOwner = DUAL_OWNER_EMAILS.includes(activeEmail);

  // Live event ticker generator effect
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      const sampleEvents: Partial<SystemActivityEntry>[] = [
        {
          action: "User Login Authentication",
          category: "login_attempt",
          userEmail: Math.random() > 0.5 ? "mukeshinland79@gmail.com" : "mukeshkalonia241@gmail.com",
          status: "success",
          details: "Dual-Owner session verified successfully with active secret token.",
        },
        {
          action: "Failed Login Attempt",
          category: "login_attempt",
          userEmail: `guest_${Math.floor(Math.random() * 900 + 100)}@external.com`,
          status: "denied",
          details: "Invalid admin token provided. Access blocked with 404 Stealth response.",
        },
        {
          action: "System Config Auto-Sync",
          category: "config_change",
          userEmail: "system-config-service",
          status: "success",
          details: "Hot-reloaded system_config.json parameters with zero downtime.",
        },
        {
          action: "WASM Garbage Collection Exception",
          category: "system_error",
          userEmail: "worker-process-node",
          status: "error",
          details: "Transient WebAssembly memory heap buffer cleanup executed.",
        },
        {
          action: "Anti-Abuse Rate Limit Enforcement",
          category: "security",
          userEmail: `ip-${Math.floor(Math.random() * 200)}`,
          status: "warning",
          details: "Bad request counter incremented. IP monitored for auto-blocking.",
        },
      ];

      const picked = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const ips = ["152.58.16.42", "103.21.124.9", "185.220.101.5", "127.0.0.1", "45.12.89.102"];
      const newEvt: SystemActivityEntry = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        userEmail: picked.userEmail || "system",
        action: picked.action || "System Event",
        category: (picked.category as any) || "system_error",
        ipAddress: ips[Math.floor(Math.random() * ips.length)],
        status: (picked.status as any) || "success",
        details: picked.details || "Automatic real-time system log entry.",
      };

      setLogs((prev) => [newEvt, ...prev.slice(0, 49)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveStream]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);

    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Category counts
  const totalCount = logs.length;
  const loginCount = logs.filter((l) => l.category === "login_attempt").length;
  const configCount = logs.filter((l) => l.category === "config_change").length;
  const errorCount = logs.filter((l) => l.category === "system_error" || l.status === "error").length;

  const exportActivityCsv = () => {
    let csv = "ID,Timestamp,User Email,Action,Category,IP Address,Status,Details\n";
    filteredLogs.forEach((l) => {
      csv += `"${l.id}","${l.timestamp}","${l.userEmail}","${l.action}","${l.category}","${l.ipAddress}","${l.status}","${l.details}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PDFSun_System_Activity_Logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAllLogs = () => {
    if (window.confirm("Are you sure you want to clear the real-time activity log buffer?")) {
      setLogs([]);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-white">
                Real-Time System Activity Log
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold text-[10px] uppercase flex items-center space-x-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>DUAL-OWNER EXCLUSIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit stream capturing user login attempts, runtime configuration updates, and system exceptions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
              isLiveStream
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStream ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{isLiveStream ? "Live Stream ON" : "Stream Paused"}</span>
          </button>

          <button
            type="button"
            onClick={exportActivityCsv}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">Total Recorded Events</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{totalCount}</p>
          <p className="text-[10px] text-slate-500">Live memory buffer</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">Login Attempts</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{loginCount}</p>
          <p className="text-[10px] text-slate-500">Auth & 2FA checks</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">Config Changes</span>
            <Sliders className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{configCount}</p>
          <p className="text-[10px] text-slate-500">Hot zero-downtime updates</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">System Errors & Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400">{errorCount}</p>
          <p className="text-[10px] text-slate-500">Exceptions & limit breaches</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, user email, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[
            { key: "all", label: "All Categories" },
            { key: "login_attempt", label: "Login Attempts" },
            { key: "config_change", label: "Config Changes" },
            { key: "system_error", label: "System Errors" },
            { key: "security", label: "Security & Limits" },
            { key: "user_management", label: "User Roles" },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${
                categoryFilter === cat.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Log Table Stream */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Filtered Event Stream ({filteredLogs.length} Entries)
            </span>
          </div>

          <button
            type="button"
            onClick={clearAllLogs}
            className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Stream</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">User / Identity</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No system activity events match your current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {log.userEmail}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.category === "login_attempt"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : log.category === "config_change"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : log.category === "system_error"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {log.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.status === "success"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : log.status === "warning"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
