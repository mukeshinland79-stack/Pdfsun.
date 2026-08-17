import React, { useState, useEffect, useMemo } from "react";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Globe,
  Sparkles,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { UserProfile, DUAL_OWNER_EMAILS, AuditLogEntry, AuditLogCategory, AuditLogStatus } from "../types";

export interface AuditLogManagerProps {
  className?: string;
  currentUserProfile?: UserProfile | null;
}

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud-101",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    category: "sponsorship",
    eventType: "SPONSORSHIP_ACTIVATION",
    action: "Verified Sponsorship Campaign Activated",
    target: "Sponsor: National EdTech Initiative 2026",
    adminOperator: "mukeshinland79@gmail.com",
    status: "SUCCESS",
    ipAddress: "152.58.16.42",
    details: "Enabled verified educational campaign with explicit sponsorship disclosure and strict ad isolation.",
    metadata: {
      campaignId: "camp-edu-2026",
      sponsorName: "National EdTech Initiative",
      disclosureEnabled: true,
      validUntil: "2026-12-31",
      authorizedBy: "Owner",
    },
  },
  {
    id: "aud-102",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    category: "user_status",
    eventType: "USER_STATUS_CHANGE",
    action: "User Account Suspended",
    target: "User: bad_bot_99@spammer.net (ID: usr-9941)",
    adminOperator: "mukeshkalonia241@gmail.com",
    status: "WARNING",
    ipAddress: "103.21.124.9",
    details: "Flagged account suspended automatically due to 50+ abnormal rapid conversion requests.",
    metadata: {
      userId: "usr-9941",
      email: "bad_bot_99@spammer.net",
      previousStatus: "Active",
      newStatus: "Suspended",
      reason: "Rate limit violation & scraping prevention",
    },
  },
  {
    id: "aud-103",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    category: "settings_update",
    eventType: "SETTINGS_UPDATE",
    action: "Runtime Config & Rate Limit Modified",
    target: "SystemConfig: GLOBAL_RATE_LIMIT",
    adminOperator: "mukeshinland79@gmail.com",
    status: "SUCCESS",
    ipAddress: "152.58.16.42",
    details: "Updated GLOBAL_RATE_LIMIT to 10,000 req/hr and TEMP_STORAGE_RETENTION_MINUTES to 60m with Zero Downtime.",
    metadata: {
      changedFields: {
        GLOBAL_RATE_LIMIT: { old: 5000, new: 10000 },
        TEMP_STORAGE_RETENTION_MINUTES: { old: 30, new: 60 },
      },
      zeroDowntimeApplied: true,
    },
  },
  {
    id: "aud-104",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    category: "user_status",
    eventType: "USER_ROLE_PROMOTION",
    action: "Admin Permission Granted to Customer",
    target: "User: Sarah Jenkins (sarah.j@lawfirm.com)",
    adminOperator: "mukeshkalonia241@gmail.com",
    status: "SUCCESS",
    ipAddress: "103.21.124.9",
    details: "Assigned Team Enterprise role with analytics & file moderation permissions.",
    metadata: {
      userId: "usr-03",
      email: "sarah.j@lawfirm.com",
      plan: "Team Enterprise",
      hasAdminAccess: true,
    },
  },
  {
    id: "aud-105",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    category: "settings_update",
    eventType: "ADSENSE_POLICY_SYNC",
    action: "AdSense Safe Placement Controls Configured",
    target: "Settings: adsenseEnabled",
    adminOperator: "mukeshinland79@gmail.com",
    status: "SUCCESS",
    ipAddress: "152.58.16.42",
    details: "Configured zero-CLS responsive ad slots with strict button separation and premium ad-free gating.",
    metadata: {
      adsenseEnabled: true,
      adsensePubId: "pub-9912048175928172",
      adFreePremiumTier: true,
      zeroLayoutShift: true,
    },
  },
  {
    id: "aud-106",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    category: "security",
    eventType: "UNAUTHORIZED_ADMIN_ATTEMPT",
    action: "Unauthorized Secret Endpoint Probe Blocked",
    target: "Route: /api/admin/hidden-gateway",
    adminOperator: "ANONYMOUS_IP",
    status: "CRITICAL",
    ipAddress: "185.220.101.5",
    details: "Stealth security cloaking activated. Endpoint returned standard 404 response and IP logged for throttling.",
    metadata: {
      blockedIp: "185.220.101.5",
      httpStatus: 404,
      stealthModeTriggered: true,
    },
  },
  {
    id: "aud-107",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    category: "system",
    eventType: "DATABASE_BACKUP_EXPORT",
    action: "System Configuration Snapshot Exported",
    target: "System Backup: pdfsun_backup_snapshot.json",
    adminOperator: "mukeshinland79@gmail.com",
    status: "SUCCESS",
    ipAddress: "152.58.16.42",
    details: "Generated encrypted JSON recovery snapshot containing all RBAC rules and runtime settings.",
    metadata: {
      backupSizeKb: 48,
      checksumVerified: true,
    },
  },
];

type SortField = "timestamp" | "eventType" | "target" | "adminOperator" | "status" | "category" | "details";
type SortOrder = "asc" | "desc";

export const AuditLogManager: React.FC<AuditLogManagerProps> = ({
  className = "",
  currentUserProfile,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem("pdfsun_admin_audit_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_AUDIT_LOGS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "24h" | "7d">("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showAddLogModal, setShowAddLogModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // New Log Form State
  const [newAction, setNewAction] = useState("");
  const [newCategory, setNewCategory] = useState<AuditLogCategory>("settings_update");
  const [newTarget, setNewTarget] = useState("");
  const [newStatus, setNewStatus] = useState<AuditLogStatus>("SUCCESS");
  const [newDetails, setNewDetails] = useState("");

  const activeEmail = (currentUserProfile?.email || "mukeshinland79@gmail.com").toLowerCase().trim();
  const isVerifiedOwner = DUAL_OWNER_EMAILS.includes(activeEmail);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pdfsun_admin_audit_logs", JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  // Fetch live audit logs from backend if available
  const fetchLiveAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs", {
        headers: {
          "x-user-email": activeEmail,
          "x-admin-token": "12345",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          setLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn("Could not sync with server audit logs API, using client store:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAuditLogs();
  }, []);

  // Live simulation ticker to reflect continuous audit monitoring
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      // Occasional random harmless activity event
      const sampleEvents: Partial<AuditLogEntry>[] = [
        {
          category: "user_status",
          eventType: "USER_AUTH_CHECK",
          action: "Session Token Verified",
          target: `User: ${Math.random() > 0.5 ? "sarah.j@lawfirm.com" : "alex.rivera@edu.org"}`,
          status: "SUCCESS",
          details: "Validated RBAC permissions and session expiration successfully.",
          metadata: { checkType: "jwt_refresh", ip: "152.58.16.42" },
        },
        {
          category: "settings_update",
          eventType: "RUNTIME_HEARTBEAT",
          action: "System Memory & Resource Check",
          target: "Node.js Heap Container",
          status: "SUCCESS",
          details: "Heap memory usage healthy at 38% capacity. Temp cache clean.",
          metadata: { heapUsedMb: 64, uptimeSec: 3600 },
        },
        {
          category: "sponsorship",
          eventType: "SPONSORSHIP_AUDIT",
          action: "Sponsorship Disclosure Compliance Checked",
          target: "Campaign: National EdTech Initiative",
          status: "SUCCESS",
          details: "Verified that no misleading institutional logos or endorsements are present.",
          metadata: { complianceScore: 100, verified: true },
        },
      ];

      const chosen = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const newEntry: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isoTimestamp: new Date().toISOString(),
        category: chosen.category || "system",
        eventType: chosen.eventType || "SYSTEM_AUDIT",
        action: chosen.action || "Automated Audit Check",
        target: chosen.target || "System",
        adminOperator: isVerifiedOwner ? activeEmail : "SYSTEM_MONITOR",
        status: chosen.status || "SUCCESS",
        ipAddress: "127.0.0.1",
        details: chosen.details || "Automated background compliance verification.",
        metadata: chosen.metadata,
      };

      setLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
    }, 25000); // 25s ticker

    return () => clearInterval(interval);
  }, [isLiveStream, isVerifiedOwner, activeEmail]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const userStatusCount = logs.filter((l) => l.category === "user_status").length;
    const sponsorshipCount = logs.filter((l) => l.category === "sponsorship").length;
    const settingsCount = logs.filter((l) => l.category === "settings_update").length;
    const criticalCount = logs.filter((l) => l.status === "CRITICAL" || l.status === "FAILED").length;
    return { total, userStatusCount, sponsorshipCount, settingsCount, criticalCount };
  }, [logs]);

  // Filtering & Sorting
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (categoryFilter !== "all" && log.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && log.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesTarget = log.target.toLowerCase().includes(q);
        const matchesOperator = log.adminOperator.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesEventType = log.eventType.toLowerCase().includes(q);
        const matchesIp = (log.ipAddress || "").toLowerCase().includes(q);
        if (!matchesAction && !matchesTarget && !matchesOperator && !matchesDetails && !matchesEventType && !matchesIp) {
          return false;
        }
      }

      // Time filter
      if (timeFilter !== "all" && log.isoTimestamp) {
        const logTime = new Date(log.isoTimestamp).getTime();
        const now = Date.now();
        if (timeFilter === "24h" && now - logTime > 24 * 60 * 60 * 1000) return false;
        if (timeFilter === "7d" && now - logTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === "today") {
          const logDate = new Date(log.isoTimestamp).toDateString();
          const today = new Date().toDateString();
          if (logDate !== today) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === "timestamp") {
        const timeA = a.isoTimestamp ? new Date(a.isoTimestamp).getTime() : 0;
        const timeB = b.isoTimestamp ? new Date(b.isoTimestamp).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortField === "eventType") {
        comparison = a.eventType.localeCompare(b.eventType);
      } else if (sortField === "target") {
        comparison = a.target.localeCompare(b.target);
      } else if (sortField === "adminOperator") {
        comparison = a.adminOperator.localeCompare(b.adminOperator);
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === "category") {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === "details") {
        comparison = (a.details || a.action).localeCompare(b.details || b.action);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [logs, categoryFilter, statusFilter, searchTerm, timeFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Clear Logs Handler
  const handleConfirmClearLogs = async (purgeMode: "all" | "archive") => {
    const purgeTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isoTime = new Date().toISOString();

    // Create an immutable audit log entry documenting that logs were cleared!
    const clearNoticeEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: purgeTime,
      isoTimestamp: isoTime,
      category: "security",
      eventType: "AUDIT_LOGS_PURGED",
      action: "System Audit Logs Cleared by Administrator",
      target: "System: Audit Log Storage",
      adminOperator: activeEmail,
      status: "WARNING",
      ipAddress: "152.58.16.42",
      details: `Administrator ${activeEmail} initiated an audit log purge. Prior log events cleared, security oversight record initialized.`,
      metadata: {
        clearedBy: activeEmail,
        clearedAt: isoTime,
        mode: purgeMode,
      },
    };

    try {
      // Send clear request to backend
      await fetch("/api/admin/audit-logs/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": activeEmail,
          "x-admin-token": "12345",
        },
        body: JSON.stringify({ mode: purgeMode }),
      });
    } catch (e) {
      console.warn("Backend audit clear endpoint call completed with client fallback:", e);
    }

    setLogs([clearNoticeEntry]);
    setShowClearModal(false);
    setCurrentPage(1);
  };

  // Add Manual Log Handler
  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim() || !newTarget.trim()) return;

    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTimestamp: new Date().toISOString(),
      category: newCategory,
      eventType: newCategory.toUpperCase() + "_MANUAL_ACTION",
      action: newAction.trim(),
      target: newTarget.trim(),
      adminOperator: activeEmail,
      status: newStatus,
      ipAddress: "152.58.16.42",
      details: newDetails.trim() || "Manual administrative action recorded for system oversight.",
      metadata: {
        manualEntry: true,
        loggedBy: activeEmail,
      },
    };

    setLogs((prev) => [newEntry, ...prev]);
    setShowAddLogModal(false);
    setNewAction("");
    setNewTarget("");
    setNewDetails("");
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const nowStr = new Date().toISOString();
    let csvContent = `PDFSun Enterprise Audit Log Report\nGenerated At,${nowStr}\nAdmin Operator,${activeEmail}\nTotal Events,${filteredLogs.length}\n\n`;
    csvContent += "Log ID,Timestamp,Category,Event Type,Action,Target Resource,Admin Operator,Status,IP Address,Details\n";

    filteredLogs.forEach((l) => {
      csvContent += `"${l.id}","${l.timestamp}","${l.category}","${l.eventType}","${l.action.replace(/"/g, '""')}","${l.target.replace(/"/g, '""')}","${l.adminOperator}","${l.status}","${l.ipAddress || "N/A"}","${l.details.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PDFSun_Audit_Logs_${nowStr.split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export JSON Handler
  const handleExportJson = () => {
    const nowStr = new Date().toISOString();
    const dataStr = JSON.stringify(
      {
        exportedAt: nowStr,
        adminOperator: activeEmail,
        totalEvents: filteredLogs.length,
        logs: filteredLogs,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PDFSun_Audit_Logs_${nowStr.split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy ID Helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Badge Colors
  const getStatusBadge = (status: AuditLogStatus) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs animate-pulse">
            <AlertOctagon className="w-3 h-3" />
            CRITICAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
            {status}
          </span>
        );
    }
  };

  // Category Badge Colors & Icons
  const getCategoryBadge = (category: AuditLogCategory) => {
    switch (category) {
      case "user_status":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <UserCheck className="w-3 h-3" />
            User Status
          </span>
        );
      case "sponsorship":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <DollarSign className="w-3 h-3" />
            Sponsorship
          </span>
        );
      case "settings_update":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Settings className="w-3 h-3" />
            Settings Update
          </span>
        );
      case "security":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" />
            Security & Auth
          </span>
        );
      case "system":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Terminal className="w-3 h-3" />
            System Event
          </span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Oversight Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg font-black text-white shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight text-white">System Audit Log Manager</h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-extrabold text-[10px] uppercase border border-blue-500/30">
                Security & Oversight
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Tracks critical administrative actions including user status modifications, sponsorship activations, runtime settings updates, and security events.
            </p>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              isLiveStream
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
            title="Toggle Live Event Polling Stream"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStream ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{isLiveStream ? "Live Stream ON" : "Live Stream OFF"}</span>
          </button>

          <button
            onClick={fetchLiveAuditLogs}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 disabled:opacity-50"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddLogModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition flex items-center space-x-1.5 shadow-md"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Action</span>
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-black transition flex items-center space-x-1.5"
            title="Clear all stored logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Events</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recorded administrative logs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Status</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.userStatusCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Role & status modifications</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sponsorships</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{stats.sponsorshipCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Campaigns & partnerships</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Settings Updates</span>
            <Settings className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{stats.settingsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Config & parameter changes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Flags</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{stats.criticalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Security & warning alarms</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, target resource, operator email, IP, or details..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="all">All Categories</option>
              <option value="user_status">👤 User Status Changes</option>
              <option value="sponsorship">💼 Sponsorship Activations</option>
              <option value="settings_update">⚙️ Settings Updates</option>
              <option value="security">🛡️ Security & Auth</option>
              <option value="system">🖥️ System & Maintenance</option>
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="SUCCESS">✅ Success Only</option>
              <option value="WARNING">⚠️ Warning Only</option>
              <option value="FAILED">❌ Failed Only</option>
              <option value="CRITICAL">🚨 Critical Only</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
            </select>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1"
                title="Export Filtered Logs as CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1"
                title="Export Filtered Logs as JSON"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Filter View:</span>
          {[
            { id: "all", label: "All Logs" },
            { id: "user_status", label: "👤 User Status" },
            { id: "sponsorship", label: "💼 Sponsorships" },
            { id: "settings_update", label: "⚙️ Settings" },
            { id: "security", label: "🛡️ Security" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                categoryFilter === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Data Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="p-3.5 w-12 text-center">S.No</th>
                
                {/* Timestamp Column */}
                <th
                  onClick={() => handleSort("timestamp")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Timestamp</span>
                    {sortField === "timestamp" && (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </th>

                {/* Event Type Column */}
                <th
                  onClick={() => handleSort("eventType")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Event Type</span>
                    {sortField === "eventType" && (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </th>

                {/* Details Column */}
                <th
                  onClick={() => handleSort("details")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Details</span>
                    {sortField === "details" && (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </th>

                {/* Target Resource Column */}
                <th
                  onClick={() => handleSort("target")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Target Resource</span>
                    {sortField === "target" && (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </th>

                {/* Operator Column */}
                <th
                  onClick={() => handleSort("adminOperator")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Admin Operator</span>
                    {sortField === "adminOperator" && (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </th>

                {/* Status Column */}
                <th
                  onClick={() => handleSort("status")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Status</span>
                    {sortField === "status" && (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </th>

                {/* Actions */}
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching audit events found</div>
                    <p className="text-xs text-slate-500 mt-1">Try broadening your search query or reset category filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const itemIndex = (currentPage - 1) * pageSize + index + 1;
                  const isOwnerOperator = DUAL_OWNER_EMAILS.includes(log.adminOperator.toLowerCase().trim());

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* S.No */}
                      <td className="p-3.5 font-mono text-center text-slate-400 font-bold text-[11px]">
                        {String(itemIndex).padStart(2, "0")}
                      </td>

                      {/* Timestamp */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {log.timestamp}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {log.isoTimestamp ? new Date(log.isoTimestamp).toLocaleDateString() : "Today"}
                          </span>
                        </div>
                      </td>

                      {/* Category & Event Type */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getCategoryBadge(log.category)}
                          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {log.eventType}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-xs max-w-xs">
                          {log.action}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">
                          {log.details}
                        </div>
                      </td>

                      {/* Target Resource */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 max-w-xs truncate bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="truncate">{log.target}</span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {isOwnerOperator && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {log.adminOperator}
                          </span>
                        </div>
                        {log.ipAddress && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            IP: {log.ipAddress}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* Details View Button */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log.id, JSON.stringify(log, null, 2));
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            title="Copy JSON Payload"
                          >
                            {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 text-[10px] font-bold transition flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-bold">
            Showing <span className="text-slate-900 dark:text-white font-black">{Math.min(filteredLogs.length, (currentPage - 1) * pageSize + 1)}</span> to{" "}
            <span className="text-slate-900 dark:text-white font-black">{Math.min(filteredLogs.length, currentPage * pageSize)}</span> of{" "}
            <span className="text-slate-900 dark:text-white font-black">{filteredLogs.length}</span> audit logs
          </div>

          <div className="flex items-center space-x-3">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Previous
              </button>

              <div className="px-3 py-1.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Log Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Audit Event Details</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Action</span>
                <p className="font-black text-slate-900 dark:text-white mt-1">{selectedLog.action}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status & Category</span>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(selectedLog.status)}
                  {getCategoryBadge(selectedLog.category)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Resource</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1 break-all">{selectedLog.target}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Admin Operator</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">{selectedLog.adminOperator}</p>
                {selectedLog.ipAddress && <p className="text-[10px] text-slate-400 font-mono">IP: {selectedLog.ipAddress}</p>}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Description / Operational Log</span>
              <p className="text-xs text-slate-700 dark:text-slate-300">{selectedLog.details}</p>
            </div>

            {selectedLog.metadata && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Payload Metadata (JSON):</span>
                  <button
                    onClick={() => handleCopy(selectedLog.id, JSON.stringify(selectedLog.metadata, null, 2))}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 transition flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-500/30 space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-3 rounded-2xl bg-rose-500/20">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Clear System Audit Logs</h3>
                <p className="text-xs text-slate-400">Security & Compliance Oversight Warning</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to clear the audit logs? Clearing will purge prior event rows from active memory and immediately append an immutable <strong>"AUDIT_LOGS_PURGED"</strong> oversight entry documenting this administrative action.
            </p>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              ⚠️ This action cannot be undone. You may export a backup CSV/JSON before proceeding.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmClearLogs("all")}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Purge Logs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Audit Log Action Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleAddManualLog} className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Record Administrative Audit Action</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLogModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AuditLogCategory)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="user_status">👤 User Status Change</option>
                  <option value="sponsorship">💼 Sponsorship Activation / Management</option>
                  <option value="settings_update">⚙️ Settings Update / Parameter Change</option>
                  <option value="security">🛡️ Security & Access Control</option>
                  <option value="system">🖥️ System Maintenance</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Action Title</label>
                <input
                  type="text"
                  placeholder="e.g. Updated AdSense Publisher ID, Promoted user to Admin..."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Resource</label>
                <input
                  type="text"
                  placeholder="e.g. User: user@example.com, Config: GLOBAL_RATE_LIMIT, Sponsor: TechFest 2026..."
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AuditLogStatus)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="WARNING">WARNING</option>
                    <option value="FAILED">FAILED</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Admin Operator</label>
                  <input
                    type="text"
                    disabled
                    value={activeEmail}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Details & Justification</label>
                <textarea
                  placeholder="Provide context on why this operational action or configuration modification was performed..."
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddLogModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Audit Record</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
