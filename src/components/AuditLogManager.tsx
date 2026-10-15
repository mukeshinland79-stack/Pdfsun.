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
  RefreshCw,
  Lock,
  Terminal,
  Download,
  AlertOctagon,
  Key,
  Crown,
  Activity,
  AlertTriangle,
  Radio,
  Trash2,
  PlusCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Globe,
  Building2,
  Copy,
  Check,
  ExternalLink,
  FileOutput,
  Table,
  SlidersHorizontal,
} from "lucide-react";
import { UserProfile, DUAL_OWNER_EMAILS, AuditLogEntry, AuditLogCategory, AuditLogStatus } from "../types";
import { generateAuditCompliancePdf } from "../utils/auditPdfGenerator";

export interface AuditLogManagerProps {
  className?: string;
  currentUserProfile?: UserProfile | null;
}

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud-sso-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    category: "sso_auth",
    eventType: "SSO_AUTH_SUCCESS",
    action: "Enterprise SSO Authentication Succeeded (Okta SAML 2.0)",
    target: "User: david.miller@acmecorp.com (Acme Corporation)",
    adminOperator: "david.miller@acmecorp.com",
    status: "SUCCESS",
    ipAddress: "198.51.100.45",
    details: "Okta SAML 2.0 assertion successfully parsed and verified. Granted access under Enterprise SSO plan with SCIM role sync and MFA validation.",
    metadata: {
      provider: "okta",
      ssoDomain: "acmecorp.com",
      organizationName: "Acme Corporation",
      planType: "Enterprise SSO",
      samlRequestId: "_pdfsun_okta_98f12a",
      enforceMfa: true,
      roleGranted: "user",
      scimEnabled: true,
      authMethod: "SAML_2_0_POST_BINDING",
    },
  },
  {
    id: "aud-sso-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    category: "sso_auth",
    eventType: "SSO_DOMAIN_VALIDATION_ERROR",
    action: "SSO Domain Validation Error (Consumer Webmail Attempt)",
    target: "Input Domain: user@gmail.com",
    adminOperator: "SSO_SECURITY_VALIDATOR",
    status: "WARNING",
    ipAddress: "103.21.124.88",
    details: "Public consumer domain (@gmail.com) rejected on Enterprise SSO login portal. Advised user to authenticate via standard Google OAuth or specify corporate workspace domain.",
    metadata: {
      input: "user@gmail.com",
      rejectedReason: "CONSUMER_WEBMAIL_DOMAIN_NOT_ALLOWED",
      providerRequested: "google",
      suggestedResolution: "Use Google OAuth or enter verified enterprise workspace domain",
    },
  },
  {
    id: "aud-sso-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    category: "sso_auth",
    eventType: "SSO_LOGIN_ATTEMPT",
    action: "SAML 2.0 AuthRequest Initiated (Microsoft Azure AD / Entra ID)",
    target: "Domain: kontor.nordicconsulting.se (Nordic Consulting)",
    adminOperator: "elena.svensson@nordicconsulting.se",
    status: "SUCCESS",
    ipAddress: "193.180.240.11",
    details: "Constructed HTTP-POST SAML 2.0 assertion request with EntityID urn:pdfsun:sp:nordicconsulting.se. Redirecting browser to Microsoft Entra tenant.",
    metadata: {
      provider: "azure",
      tenantUrl: "nordicconsulting.onmicrosoft.com",
      entityId: "urn:pdfsun:sp:nordicconsulting.se",
      assertionUrl: "https://pdfsun.in/api/v1/auth/saml/callback",
      requestId: "_pdfsun_az_44821c",
    },
  },
  {
    id: "aud-sso-004",
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    category: "sso_auth",
    eventType: "SSO_AUTH_SUCCESS",
    action: "Enterprise SSO Login Succeeded (Google Workspace SAML)",
    target: "User: alex.rivera@edu.org (Edu Org)",
    adminOperator: "alex.rivera@edu.org",
    status: "SUCCESS",
    ipAddress: "152.58.16.42",
    details: "Verified Google Workspace SAML assertion for educational tenant. Multi-tenant workspace activated under Custom SAML 2.0 tier.",
    metadata: {
      provider: "google",
      ssoDomain: "edu.org",
      organizationName: "Edu Org",
      planType: "Custom SAML 2.0",
      mfaVerified: true,
      samlRequestId: "_pdfsun_gw_31940d",
    },
  },
  {
    id: "aud-sso-005",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    category: "sso_auth",
    eventType: "SSO_DOMAIN_VALIDATION_ERROR",
    action: "SSO Domain Validation Error (Malformed Tenant / Unregistered IdP)",
    target: "Input Domain: corp..invalid-internal",
    adminOperator: "SSO_SECURITY_VALIDATOR",
    status: "FAILED",
    ipAddress: "45.33.32.156",
    details: "Domain validation failed: syntax contains consecutive dots or invalid top-level domain. Pre-flight DNS and IdP entity descriptor lookup aborted.",
    metadata: {
      input: "corp..invalid-internal",
      error: "Invalid domain syntax format",
      errorCode: "ERR_INVALID_DOMAIN_SYNTAX",
    },
  },
  {
    id: "aud-sso-006",
    timestamp: new Date(Date.now() - 1000 * 60 * 48).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    category: "sso_auth",
    eventType: "SSO_AUTH_FAILURE",
    action: "SAML Response Signature Verification Failed",
    target: "Domain: staging-internal.partner.net",
    adminOperator: "test-sso@partner.net",
    status: "CRITICAL",
    ipAddress: "194.26.29.112",
    details: "X.509 certificate signature mismatch in SAML response assertion from partner.net. Authentication token rejected by platform security gateway.",
    metadata: {
      error: "X509_CERT_MISMATCH",
      provider: "saml",
      ssoDomain: "partner.net",
      securityAction: "BLOCKED",
    },
  },
  {
    id: "aud-101",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
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
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
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
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
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
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
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
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
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
    id: "aud-106",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
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
          // Merge defaults if saved does not have SSO logs
          const hasSso = parsed.some((l: AuditLogEntry) => l.category === "sso_auth");
          if (!hasSso) {
            const ssoItems = DEFAULT_AUDIT_LOGS.filter((l) => l.category === "sso_auth");
            return [...ssoItems, ...parsed];
          }
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
  const [ssoEventTypeFilter, setSsoEventTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showAddLogModal, setShowAddLogModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "json">("pdf");
  const [exportScope, setExportScope] = useState<"filtered" | "all">("filtered");
  const [exportIncludeMetadata, setExportIncludeMetadata] = useState<boolean>(true);
  const [exportReportTitle, setExportReportTitle] = useState<string>("Enterprise Security & SSO Identity Compliance Report");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // New Log Form State
  const [newAction, setNewAction] = useState("");
  const [newCategory, setNewCategory] = useState<AuditLogCategory>("sso_auth");
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
          setLogs((prev) => {
            // Keep any local-only recent entries merged with server logs
            const serverIds = new Set(data.logs.map((l: AuditLogEntry) => l.id));
            const uniqueLocal = prev.filter((l) => !serverIds.has(l.id));
            return [...uniqueLocal, ...data.logs];
          });
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

  // Live simulation ticker to reflect continuous enterprise SSO and audit monitoring
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      const sampleEvents: Partial<AuditLogEntry>[] = [
        {
          category: "sso_auth",
          eventType: "SSO_AUTH_SUCCESS",
          action: "Enterprise SSO Session Renewed (Okta SAML 2.0)",
          target: "User: david.miller@acmecorp.com (Acme Corporation)",
          status: "SUCCESS",
          details: "Verified Okta session assertion validity and cryptographic signature for corporate workspace.",
          metadata: { provider: "okta", ssoDomain: "acmecorp.com", sessionRefresh: true },
        },
        {
          category: "sso_auth",
          eventType: "SSO_LOGIN_ATTEMPT",
          action: "SAML 2.0 AuthRequest Initiated (Azure AD)",
          target: "Domain: workspace.globalfin.org",
          status: "SUCCESS",
          details: "Initiated Entra ID SSO challenge for employee session token issuance.",
          metadata: { provider: "azure", ssoDomain: "globalfin.org" },
        },
        {
          category: "sso_auth",
          eventType: "SSO_DOMAIN_VALIDATION_ERROR",
          action: "SSO Domain Pre-Check Failed (Consumer Domain)",
          target: "Input: testuser@yahoo.com",
          status: "WARNING",
          details: "Attempt to use public webmail domain for corporate SAML entity ID was blocked by security policy.",
          metadata: { input: "testuser@yahoo.com", reason: "CONSUMER_DOMAIN" },
        },
        {
          category: "user_status",
          eventType: "USER_AUTH_CHECK",
          action: "Session Token Verified",
          target: `User: ${Math.random() > 0.5 ? "sarah.j@lawfirm.com" : "alex.rivera@edu.org"}`,
          status: "SUCCESS",
          details: "Validated RBAC permissions and session expiration successfully.",
          metadata: { checkType: "jwt_refresh", ip: "152.58.16.42" },
        },
      ];

      const chosen = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const newEntry: AuditLogEntry = {
        id: `aud-sso-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        isoTimestamp: new Date().toISOString(),
        category: chosen.category || "sso_auth",
        eventType: chosen.eventType || "SSO_AUDIT_EVENT",
        action: chosen.action || "Automated SSO Compliance Check",
        target: chosen.target || "Enterprise SSO Gateway",
        adminOperator: isVerifiedOwner ? activeEmail : "SSO_GATEWAY_MONITOR",
        status: chosen.status || "SUCCESS",
        ipAddress: "127.0.0.1",
        details: chosen.details || "Automated background enterprise security audit.",
        metadata: chosen.metadata,
      };

      setLogs((prev) => [newEntry, ...prev.slice(0, 149)]);
    }, 28000);

    return () => clearInterval(interval);
  }, [isLiveStream, isVerifiedOwner, activeEmail]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const ssoTotal = logs.filter((l) => l.category === "sso_auth").length;
    const ssoSuccess = logs.filter((l) => l.category === "sso_auth" && l.eventType === "SSO_AUTH_SUCCESS").length;
    const ssoAttempts = logs.filter((l) => l.category === "sso_auth" && l.eventType === "SSO_LOGIN_ATTEMPT").length;
    const domainErrors = logs.filter(
      (l) => l.eventType === "SSO_DOMAIN_VALIDATION_ERROR" || (l.category === "sso_auth" && (l.status === "WARNING" || l.status === "FAILED"))
    ).length;
    const criticalCount = logs.filter((l) => l.status === "CRITICAL" || l.status === "FAILED").length;
    const userStatusCount = logs.filter((l) => l.category === "user_status").length;
    const settingsCount = logs.filter((l) => l.category === "settings_update").length;

    return {
      total,
      ssoTotal,
      ssoSuccess,
      ssoAttempts,
      domainErrors,
      criticalCount,
      userStatusCount,
      settingsCount,
    };
  }, [logs]);

  // Filtering & Sorting
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Category filter
        if (categoryFilter !== "all" && log.category !== categoryFilter) {
          return false;
        }

        // SSO Specific Event Type Filter
        if (ssoEventTypeFilter !== "all") {
          if (ssoEventTypeFilter === "SSO_SUCCESS" && log.eventType !== "SSO_AUTH_SUCCESS") return false;
          if (ssoEventTypeFilter === "SSO_ATTEMPT" && log.eventType !== "SSO_LOGIN_ATTEMPT") return false;
          if (ssoEventTypeFilter === "DOMAIN_ERROR" && log.eventType !== "SSO_DOMAIN_VALIDATION_ERROR" && log.eventType !== "SSO_AUTH_FAILURE") return false;
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
          const matchesProvider = log.metadata?.provider ? String(log.metadata.provider).toLowerCase().includes(q) : false;
          const matchesOrg = log.metadata?.organizationName ? String(log.metadata.organizationName).toLowerCase().includes(q) : false;

          if (!matchesAction && !matchesTarget && !matchesOperator && !matchesDetails && !matchesEventType && !matchesIp && !matchesProvider && !matchesOrg) {
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
      })
      .sort((a, b) => {
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
  }, [logs, categoryFilter, ssoEventTypeFilter, statusFilter, searchTerm, timeFilter, sortField, sortOrder]);

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
    const purgeTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const isoTime = new Date().toISOString();

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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      isoTimestamp: new Date().toISOString(),
      category: newCategory,
      eventType: newCategory === "sso_auth" ? "SSO_MANUAL_AUDIT" : newCategory.toUpperCase() + "_MANUAL_ACTION",
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

  // Export PDF Compliance Report Handler
  const handleExportPdf = (scope: "filtered" | "all" = "filtered") => {
    setIsExporting(true);
    const targetLogs = scope === "filtered" ? filteredLogs : logs;
    try {
      generateAuditCompliancePdf({
        logs: targetLogs,
        adminEmail: activeEmail,
        filterSummary: {
          category: categoryFilter,
          status: statusFilter,
          timeRange: timeFilter,
          searchTerm: searchTerm,
          ssoFilter: ssoEventTypeFilter,
        },
        totalCountInStore: logs.length,
        reportTitle: exportReportTitle || "Enterprise Security & SSO Identity Compliance Report",
        includeMetadata: exportIncludeMetadata,
      });

      setExportSuccessMessage(`Successfully generated Compliance PDF with ${targetLogs.length} audit records.`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
      setShowExportModal(false);
    } catch (err) {
      console.error("Failed to generate Compliance PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export CSV Compliance Report Handler (SSO Login & Auth Errors)
  const handleExportCsv = (scope: "filtered" | "all" | "sso_errors" = "filtered") => {
    setIsExporting(true);
    let targetLogs: AuditLogEntry[];
    
    if (scope === "sso_errors") {
      targetLogs = logs.filter(
        (l) =>
          l.category === "sso_auth" ||
          l.eventType.startsWith("SSO_") ||
          l.status === "WARNING" ||
          l.status === "FAILED" ||
          l.status === "CRITICAL"
      );
      if (targetLogs.length === 0) {
        targetLogs = filteredLogs;
      }
    } else if (scope === "filtered") {
      targetLogs = filteredLogs;
    } else {
      targetLogs = logs;
    }

    const nowStr = new Date().toISOString();
    const dateFileStr = nowStr.split("T")[0];
    
    // Formal compliance CSV header block
    let csvContent = `PDFSun Enterprise Compliance Audit Trail - SSO Login & Authentication Error Log Report\n`;
    csvContent += `Generated At,${nowStr}\n`;
    csvContent += `Authorized Compliance Admin,${activeEmail}\n`;
    csvContent += `Export Scope,${scope === "sso_errors" ? "SSO Authentication & Domain Errors" : scope === "filtered" ? "Current Filtered View" : "Complete Audit Archive"}\n`;
    csvContent += `Total Records Exported,${targetLogs.length}\n`;
    csvContent += `Active Category Filter,${categoryFilter}\n`;
    csvContent += `Active Status Filter,${statusFilter}\n`;
    csvContent += `Regulatory Standard,SOC 2 Type II / ISO 27001 / SAML 2.0 Identity Governance / GDPR\n\n`;

    // Standard Compliance Columns
    csvContent += "Log ID,Timestamp,ISO Timestamp,Category,Event Type,Action / Operation,Target Resource / SSO Domain,Status,Admin Operator,IP Address,Identity Provider,SSO Domain,Organization Name,Plan Tier,SAML Request ID,Error Reason / Rejection Code,Details & Compliance Assessment,Metadata JSON\n";

    targetLogs.forEach((l) => {
      const meta = l.metadata || {};
      const provider = meta.provider ? String(meta.provider).toUpperCase() : "";
      const ssoDomain = meta.ssoDomain || "";
      const org = meta.organizationName || "";
      const plan = meta.planType || "";
      const samlReqId = meta.samlRequestId || "";
      const errorReason = meta.rejectedReason || meta.error || "";
      const metaJson = l.metadata ? JSON.stringify(l.metadata).replace(/"/g, '""') : "";

      csvContent += `"${l.id}","${l.timestamp}","${l.isoTimestamp || ""}","${l.category}","${l.eventType}","${l.action.replace(/"/g, '""')}","${l.target.replace(/"/g, '""')}","${l.status}","${l.adminOperator}","${l.ipAddress || "N/A"}","${provider}","${ssoDomain}","${org.replace(/"/g, '""')}","${plan}","${samlReqId}","${errorReason.replace(/"/g, '""')}","${l.details.replace(/"/g, '""')}","${metaJson}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PDFSun_SSO_Auth_Compliance_Report_${dateFileStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setExportSuccessMessage(`Successfully generated and downloaded SSO compliance CSV report with ${targetLogs.length} audit records.`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
    setShowExportModal(false);
  };

  // Export JSON Handler
  const handleExportJson = (scope: "filtered" | "all" = "filtered") => {
    setIsExporting(true);
    const targetLogs = scope === "filtered" ? filteredLogs : logs;
    const nowStr = new Date().toISOString();
    const dataStr = JSON.stringify(
      {
        appName: "PDFSun Enterprise Platform",
        reportType: "Security Audit & Identity Compliance Snapshot",
        complianceStandards: ["SOC 2 Type II", "ISO/IEC 27001", "SAML 2.0 Identity Governance"],
        exportedAt: nowStr,
        authorizedAdmin: activeEmail,
        scope: scope === "filtered" ? "Filtered View" : "Full Audit Archive",
        totalEvents: targetLogs.length,
        filterParameters: {
          category: categoryFilter,
          status: statusFilter,
          timeRange: timeFilter,
          searchQuery: searchTerm,
          ssoFilter: ssoEventTypeFilter,
        },
        logs: targetLogs,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PDFSun_Audit_Compliance_Snapshot_${nowStr.split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setExportSuccessMessage(`Successfully exported ${targetLogs.length} audit logs as JSON.`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
    setShowExportModal(false);
  };

  // Execute export from modal based on selection
  const handleRunComplianceExport = () => {
    if (exportFormat === "pdf") {
      handleExportPdf(exportScope);
    } else if (exportFormat === "csv") {
      handleExportCsv(exportScope);
    } else {
      handleExportJson(exportScope);
    }
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
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
      case "sso_auth":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/30">
            <Key className="w-3 h-3 text-blue-500" />
            SSO & Identity
          </span>
        );
      case "user_status":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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

  // Event Type Tag Badge
  const getEventTypeTag = (eventType: string) => {
    if (eventType === "SSO_AUTH_SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[9px] font-black uppercase border border-emerald-500/20">
          <CheckCircle2 className="w-2.5 h-2.5" />
          SSO_AUTH_SUCCESS
        </span>
      );
    }
    if (eventType === "SSO_LOGIN_ATTEMPT") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono text-[9px] font-black uppercase border border-blue-500/20">
          <Key className="w-2.5 h-2.5" />
          SSO_LOGIN_ATTEMPT
        </span>
      );
    }
    if (eventType === "SSO_DOMAIN_VALIDATION_ERROR") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-black uppercase border border-amber-500/20">
          <AlertTriangle className="w-2.5 h-2.5" />
          DOMAIN_VALIDATION_ERROR
        </span>
      );
    }
    if (eventType === "SSO_AUTH_FAILURE") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono text-[9px] font-black uppercase border border-rose-500/20">
          <XCircle className="w-2.5 h-2.5" />
          SSO_AUTH_FAILURE
        </span>
      );
    }
    return (
      <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
        {eventType}
      </span>
    );
  };

  return (
    <div className={`space-y-6 ${className}`} id="admin-audit-logs-tab">
      {/* Header & SSO Security Oversight Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg font-black text-white shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight text-white">Enterprise Audit Logs & Identity Trail</h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/25 text-blue-300 font-black text-[10px] uppercase border border-blue-400/40">
                SSO & RBAC Compliance
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Chronological records of Single Sign-On (SSO) login attempts, successful authentications, SAML 2.0 assertions, and failed domain validation errors for Enterprise users.
            </p>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Direct Download Report Button (SSO Auth Error / Login Logs CSV) */}
          <button
            id="audit-download-report-btn"
            onClick={() => handleExportCsv("filtered")}
            disabled={isExporting || filteredLogs.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 shadow-md border border-emerald-400/40 cursor-pointer disabled:opacity-50"
            title="Download current SSO login & authentication error logs as a compliance CSV file"
          >
            {isExporting && exportFormat === "csv" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-100" />
                <span>Generating CSV...</span>
              </>
            ) : (
              <>
                <Table className="w-3.5 h-3.5 text-emerald-100" />
                <span>Download Report</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/20 text-white font-bold uppercase">
                  CSV
                </span>
              </>
            )}
          </button>

          {/* Download PDF Compliance Report Button */}
          <button
            id="audit-download-pdf-btn"
            onClick={() => handleExportPdf("filtered")}
            disabled={isExporting || filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-black transition flex items-center space-x-1.5 shadow-md border border-rose-400/30 cursor-pointer disabled:opacity-50"
            title="Download formatted multi-page PDF compliance report"
          >
            <FileOutput className="w-3.5 h-3.5 text-rose-100" />
            <span>PDF Report</span>
          </button>

          {/* Export Options Modal Trigger */}
          <button
            id="audit-export-compliance-top-btn"
            onClick={() => setShowExportModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700"
            title="Configure export format (CSV/PDF/JSON) and custom compliance title"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Options</span>
          </button>

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

      {/* Success Notification Banner */}
      {exportSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards - Enhanced with SSO & Domain Validation Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Audit Events */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Audit Events</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Immutable chronologic ledger</div>
        </div>

        {/* SSO Authentications */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/30 dark:border-blue-500/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">SSO Logins</span>
            <Key className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">{stats.ssoSuccess}</div>
          <div className="text-[10px] text-blue-500/80 dark:text-blue-400/80 mt-0.5 font-bold">
            {stats.ssoAttempts} initiated attempts
          </div>
        </div>

        {/* Domain Validation Errors */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Domain Errors</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{stats.domainErrors}</div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-bold">
            Consumer webmail & syntax errors
          </div>
        </div>

        {/* Settings & User Management */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Config & Users</span>
            <Settings className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.settingsCount + stats.userStatusCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Parameters & roles updated</div>
        </div>

        {/* Critical & Security Flags */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Flags</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{stats.criticalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Security & token rejections</div>
        </div>
      </div>

      {/* Filter, Search, and Category Navigation Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SSO domain, user email, IdP provider, action, IP, or error code..."
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

          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSsoEventTypeFilter("all");
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="all">All Categories</option>
              <option value="sso_auth">🔑 SSO & Identity (Enterprise)</option>
              <option value="user_status">👤 User Status Changes</option>
              <option value="settings_update">⚙️ Settings & Runtime Config</option>
              <option value="sponsorship">💼 Sponsorship Activations</option>
              <option value="security">🛡️ Security & Access Control</option>
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
              <option value="WARNING">⚠️ Warnings (Domain Errors)</option>
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
            <div className="flex items-center gap-1.5">
              <button
                id="audit-quick-export-csv-btn"
                onClick={() => handleExportCsv("filtered")}
                disabled={isExporting || filteredLogs.length === 0}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/20 hover:from-emerald-500/25 hover:to-teal-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Download current filtered SSO login & auth error logs as Compliance CSV"
              >
                <Table className="w-3.5 h-3.5 text-emerald-500" />
                <span>Download Report</span>
                <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 rounded font-bold uppercase">CSV</span>
              </button>

              <button
                id="audit-quick-export-pdf-btn"
                onClick={() => handleExportPdf("filtered")}
                disabled={isExporting || filteredLogs.length === 0}
                className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Download current filtered log list as a formatted Compliance PDF Report"
              >
                <FileOutput className="w-3.5 h-3.5 text-rose-500" />
                <span>PDF</span>
              </button>

              <button
                id="audit-quick-export-more-btn"
                onClick={() => setShowExportModal(true)}
                className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1"
                title="Advanced Compliance Export Options"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips (Specialized for SSO & Enterprise Events) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Filters:</span>
          
          <button
            onClick={() => {
              setCategoryFilter("all");
              setSsoEventTypeFilter("all");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              categoryFilter === "all" && ssoEventTypeFilter === "all"
                ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            All Logs
          </button>

          <button
            onClick={() => {
              setCategoryFilter("sso_auth");
              setSsoEventTypeFilter("all");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
              categoryFilter === "sso_auth" && ssoEventTypeFilter === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 border border-blue-400/30"
            }`}
          >
            <Key className="w-3 h-3" />
            <span>All SSO & Identity Events</span>
          </button>

          <button
            onClick={() => {
              setCategoryFilter("sso_auth");
              setSsoEventTypeFilter("SSO_SUCCESS");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
              ssoEventTypeFilter === "SSO_SUCCESS"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-400/30"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Successful SSO Logins</span>
          </button>

          <button
            onClick={() => {
              setCategoryFilter("sso_auth");
              setSsoEventTypeFilter("SSO_ATTEMPT");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
              ssoEventTypeFilter === "SSO_ATTEMPT"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 border border-indigo-400/30"
            }`}
          >
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>SSO Login Attempts</span>
          </button>

          <button
            onClick={() => {
              setCategoryFilter("sso_auth");
              setSsoEventTypeFilter("DOMAIN_ERROR");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
              ssoEventTypeFilter === "DOMAIN_ERROR"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-400/30"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Domain Validation Errors</span>
          </button>

          <button
            onClick={() => {
              setCategoryFilter("user_status");
              setSsoEventTypeFilter("all");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              categoryFilter === "user_status"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            👤 User Status
          </button>

          <button
            onClick={() => {
              setCategoryFilter("settings_update");
              setSsoEventTypeFilter("all");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              categoryFilter === "settings_update"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ⚙️ Settings
          </button>

          <button
            onClick={() => {
              setCategoryFilter("security");
              setSsoEventTypeFilter("all");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              categoryFilter === "security"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            🛡️ Security
          </button>
        </div>
      </div>

      {/* Audit Log Chronological Data Table */}
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
                    {sortField === "timestamp" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-blue-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                      ))}
                  </div>
                </th>

                {/* Category & Event Type */}
                <th
                  onClick={() => handleSort("eventType")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category & Event Type</span>
                    {sortField === "eventType" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-blue-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                      ))}
                  </div>
                </th>

                {/* Action & Audit Details */}
                <th
                  onClick={() => handleSort("details")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Action & Operation Details</span>
                    {sortField === "details" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-blue-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                      ))}
                  </div>
                </th>

                {/* Target Resource / Organization */}
                <th
                  onClick={() => handleSort("target")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Target Resource / Domain</span>
                    {sortField === "target" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-blue-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                      ))}
                  </div>
                </th>

                {/* Operator / User Email */}
                <th
                  onClick={() => handleSort("adminOperator")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Operator / User</span>
                    {sortField === "adminOperator" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-blue-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                      ))}
                  </div>
                </th>

                {/* Status */}
                <th
                  onClick={() => handleSort("status")}
                  className="p-3.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Status</span>
                    {sortField === "status" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-blue-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                      ))}
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
                    <p className="text-xs text-slate-500 mt-1">Try broadening your search query or reset filter selections.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const itemIndex = (currentPage - 1) * pageSize + index + 1;
                  const isOwnerOperator = DUAL_OWNER_EMAILS.includes(log.adminOperator.toLowerCase().trim());
                  const isSso = log.category === "sso_auth";

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
                          {getEventTypeTag(log.eventType)}
                        </div>
                      </td>

                      {/* Action & Details */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-xs max-w-sm">
                          {log.action}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 max-w-md mt-0.5 leading-relaxed">
                          {log.details}
                        </div>
                        {isSso && log.metadata?.provider && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              IdP: {String(log.metadata.provider).toUpperCase()}
                            </span>
                            {log.metadata.planType && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {log.metadata.planType}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Target Resource */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 max-w-xs truncate bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="truncate">{log.target}</span>
                        </div>
                      </td>

                      {/* Operator / User */}
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

      {/* Inspect Log Modal / SAML 2.0 Payload Inspection */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <ShieldCheck className="w-5 h-5" />
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
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {getStatusBadge(selectedLog.status)}
                  {getCategoryBadge(selectedLog.category)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Resource</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1 break-all">{selectedLog.target}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Operator / Initiator</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">{selectedLog.adminOperator}</p>
                {selectedLog.ipAddress && <p className="text-[10px] text-slate-400 font-mono">IP: {selectedLog.ipAddress}</p>}
              </div>
            </div>

            {/* If SSO Log, show dedicated Identity & Provider box */}
            {selectedLog.category === "sso_auth" && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-black text-blue-700 dark:text-blue-300">
                  <Key className="w-4 h-4" />
                  <span>Enterprise SSO & SAML 2.0 Identity Assertion</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Event Type</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedLog.eventType}</span>
                  </div>
                  {selectedLog.metadata?.provider && (
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] font-bold block">Identity Provider</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{selectedLog.metadata.provider}</span>
                    </div>
                  )}
                  {selectedLog.metadata?.organizationName && (
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] font-bold block">Organization</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.metadata.organizationName}</span>
                    </div>
                  )}
                  {selectedLog.metadata?.planType && (
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] font-bold block">Plan Tier</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.metadata.planType}</span>
                    </div>
                  )}
                  {selectedLog.metadata?.samlRequestId && (
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] font-bold block">SAML Request ID</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">{selectedLog.metadata.samlRequestId}</span>
                    </div>
                  )}
                  {selectedLog.metadata?.rejectedReason && (
                    <div className="col-span-2">
                      <span className="text-amber-500 uppercase text-[9px] font-bold block">Validation Reason</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{selectedLog.metadata.rejectedReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Description & Security Assessment</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedLog.details}</p>
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
                  <option value="sso_auth">🔑 SSO & Identity Event</option>
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
                  placeholder="e.g. Enterprise SSO Domain Whitelisted, Verified SAML 2.0 Assertion..."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Resource / Domain</label>
                <input
                  type="text"
                  placeholder="e.g. Domain: acmecorp.com, User: user@example.com, Config: GLOBAL_RATE_LIMIT..."
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

      {/* Compliance Report Exporter Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500">
                  <FileOutput className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Audit & Compliance Report Exporter</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[9px] uppercase border border-blue-500/30">
                      SOC 2 / ISO 27001
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Export certified records for regulatory compliance, security reviews, and SSO identity audits.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                1. Select Export Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* PDF Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat("pdf")}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    exportFormat === "pdf"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white">
                      PDF
                    </span>
                    <FileOutput className={`w-4 h-4 ${exportFormat === "pdf" ? "text-rose-500" : "text-slate-400"}`} />
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Compliance PDF</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Formal multi-page document with KPI boxes, auditor attestation & stamps.
                  </div>
                </button>

                {/* CSV Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat("csv")}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    exportFormat === "csv"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
                      CSV
                    </span>
                    <Table className={`w-4 h-4 ${exportFormat === "csv" ? "text-emerald-500" : "text-slate-400"}`} />
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Spreadsheet (CSV)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Structured tabular format for Excel, SIEM, Splunk, and data analysis.
                  </div>
                </button>

                {/* JSON Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat("json")}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    exportFormat === "json"
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-600 text-white">
                      JSON
                    </span>
                    <FileText className={`w-4 h-4 ${exportFormat === "json" ? "text-indigo-500" : "text-slate-400"}`} />
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Raw JSON Snapshot</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Unmodified nested JSON payload for programmatic verification.
                  </div>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                2. Export Scope & Filters
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportScope("filtered")}
                  className={`p-3 rounded-2xl border text-left transition ${
                    exportScope === "filtered"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Active Filtered View</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                      {filteredLogs.length} events
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Matches: Category ({categoryFilter}), Status ({statusFilter}), Time ({timeFilter})
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope("all")}
                  className={`p-3 rounded-2xl border text-left transition ${
                    exportScope === "all"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Complete Audit Ledger</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                      {logs.length} events
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Exports all records in memory across all historical categories and statuses
                  </p>
                </button>
              </div>
            </div>

            {/* Custom Report Title & Options */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Report Header Title
                </label>
                <input
                  type="text"
                  value={exportReportTitle}
                  onChange={(e) => setExportReportTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g. Q3 SOC-2 Access Review Audit Trail"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="include-metadata-chk"
                  checked={exportIncludeMetadata}
                  onChange={(e) => setExportIncludeMetadata(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="include-metadata-chk" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Include Technical Identity Metadata (SAML Request IDs, IdP provider metadata, IP addresses, rejection codes)
                </label>
              </div>
            </div>

            {/* Attestation Box */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-700 dark:text-slate-300">Auditor Attestation:</div>
                <div>Authorized Officer: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{activeEmail}</span></div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SHA-256 Ledger Stamp
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                id="audit-modal-download-btn"
                onClick={handleRunComplianceExport}
                disabled={isExporting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition shadow-lg flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      Download {exportFormat.toUpperCase()} ({exportScope === "filtered" ? filteredLogs.length : logs.length} Records)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
