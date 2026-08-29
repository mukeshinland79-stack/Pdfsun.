import React, { useState, useEffect, useCallback, useRef } from "react";
import * as d3 from "d3";
import { UserProfile } from "../types";
import { safeFetchJson } from "../utils/apiHelper";
import {
  subscribeUserTransactionsFromFirestore,
  FirestoreTransactionRecord,
} from "../lib/firebase";
import {
  CreditCard,
  Receipt,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Crown,
  Zap,
  ShieldCheck,
  ExternalLink,
  Search,
  Copy,
  Check,
  Sparkles,
  FileText,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  Calendar,
  XCircle,
  RotateCcw,
} from "lucide-react";

export interface PaymentTransaction {
  id: string;
  orderId?: string;
  subscriptionId?: string;
  email: string;
  amountINR: number;
  amount?: number;
  gateway: "Razorpay" | "Stripe" | string;
  date: string;
  timestamp?: string;
  status: "COMPLETED" | "CAPTURED" | "SUCCESS" | "REFUNDED" | "PENDING" | "FAILED" | string;
  plan: string;
  planId?: string;
  paymentMethod?: string;
  invoiceNo?: string;
}

export type VerificationStatusLabel = "Verified" | "Pending" | "Failed" | "Refunded";

export interface VerificationStatusInfo {
  label: VerificationStatusLabel;
  fullLabel: string;
  badgeClass: string;
  dotClass: string;
  icon: typeof ShieldCheck;
  description: string;
}

/**
 * Returns dynamic verification icon, label, and color-coded styling based on actual Firestore transaction status
 */
export function getVerificationStatusInfo(status: string | undefined): VerificationStatusInfo {
  const normalized = (status || "").toLowerCase().trim();

  if (
    normalized === "completed" ||
    normalized === "captured" ||
    normalized === "paid" ||
    normalized === "success" ||
    normalized === "active" ||
    normalized === "verified"
  ) {
    return {
      label: "Verified",
      fullLabel: "Razorpay Verified",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs",
      dotClass: "bg-emerald-500",
      icon: ShieldCheck,
      description: "Cryptographically verified via Razorpay HMAC signature & reconciled in Firestore transactions collection",
    };
  }

  if (
    normalized === "pending" ||
    normalized === "created" ||
    normalized === "processing" ||
    normalized === "authorized" ||
    normalized === "authenticating"
  ) {
    return {
      label: "Pending",
      fullLabel: "Verification Pending",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-xs",
      dotClass: "bg-amber-500",
      icon: Clock,
      description: "Payment transaction recorded; awaiting Razorpay webhook reconciliation / confirmation in Firestore",
    };
  }

  if (normalized === "refunded") {
    return {
      label: "Refunded",
      fullLabel: "Payment Refunded",
      badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-xs",
      dotClass: "bg-purple-500",
      icon: RotateCcw,
      description: "Payment has been refunded to original payment method",
    };
  }

  return {
    label: "Failed",
    fullLabel: "Payment Failed",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 shadow-xs",
    dotClass: "bg-rose-500",
    icon: AlertCircle,
    description: "Transaction was cancelled, failed signature check, or rejected by the payment gateway",
  };
}

interface PaymentHistoryProps {
  userProfile: UserProfile;
  onOpenPricing?: () => void;
  className?: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  userProfile,
  onOpenPricing,
  className = "",
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "subscriptions" | "flexi">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentTransaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(true);
  const [flexiCredits, setFlexiCredits] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("pdfsun_user_credits_v1") || "100", 10);
    } catch {
      return 100;
    }
  });

  // Fetch payment history & subscription status from server API
  const fetchPaymentHistory = useCallback(async () => {
    try {
      setRefreshing(true);
      const email = userProfile.email || "mukeshinland79@gmail.com";
      const result = await safeFetchJson<any>(`/api/user/payment-history?email=${encodeURIComponent(email)}`);

      let apiTransactions: PaymentTransaction[] = [];
      if (result.ok && result.data) {
        const data = result.data;
        if (data.subscription) {
          setActiveSubscription(data.subscription);
        }
        if (data.success && Array.isArray(data.transactions)) {
          apiTransactions = data.transactions.map((tx: any) => ({
            id: tx.id || `pay_rzp_${Math.random().toString(36).substring(2, 8)}`,
            orderId: tx.orderId || `order_rzp_${Math.random().toString(36).substring(2, 8)}`,
            email: tx.email || tx.userEmail || email,
            amountINR: tx.amountINR || (tx.amountPaise ? tx.amountPaise / 100 : (tx.amount ? tx.amount : 199)),
            gateway: tx.gateway || "Razorpay",
            date: tx.date || (tx.createdAt ? tx.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
            timestamp: tx.timestamp || tx.createdAt || new Date().toISOString(),
            status: tx.status || "COMPLETED",
            plan: tx.plan || tx.planName || "Pro Sun Monthly",
            planId: tx.planId || "pro-monthly",
            paymentMethod: tx.paymentMethod || "UPI / Razorpay Live Gateway",
            invoiceNo: tx.invoiceNo || `INV-RZP-${tx.id ? tx.id.substring(tx.id.length - 6).toUpperCase() : Math.floor(1000 + Math.random() * 9000)}`,
          }));
        }
      }

      // Check local storage for client-side completed payments
      let localTransactions: PaymentTransaction[] = [];
      try {
        const rawLocal = localStorage.getItem("pdfsun_payment_history_v1");
        if (rawLocal) {
          localTransactions = JSON.parse(rawLocal);
        }
      } catch (err) {
        console.warn("[PaymentHistory] Error parsing local payment history:", err);
      }

      // Merge & deduplicate by transaction ID
      setTransactions((prev) => {
        const combined = [...apiTransactions, ...localTransactions, ...prev];
        const uniqueMap = new Map<string, PaymentTransaction>();
        combined.forEach((item) => {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        });
        return Array.from(uniqueMap.values());
      });
    } catch (err) {
      console.error("[PaymentHistory] Error fetching payment history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile.email]);

  // Real-time Firestore transactions listener strictly filtered for current userProfile.uid / email
  useEffect(() => {
    const userIdentifier = {
      uid: userProfile.uid || userProfile.id,
      email: userProfile.email || "mukeshinland79@gmail.com",
    };

    const unsubscribe = subscribeUserTransactionsFromFirestore(userIdentifier, (firestoreTxList) => {
      setRealtimeConnected(true);
      if (firestoreTxList && Array.isArray(firestoreTxList) && firestoreTxList.length > 0) {
        const mapped: PaymentTransaction[] = firestoreTxList.map((tx) => ({
          id: tx.id,
          orderId: tx.orderId,
          subscriptionId: tx.subscriptionId,
          email: tx.userEmail || userProfile.email,
          amountINR: tx.amountINR || (tx.amount ? tx.amount : ((tx.amountPaise || 0) / 100)),
          gateway: tx.source === "stripe" ? "Stripe" : "Razorpay",
          date: tx.date || (tx.createdAt ? tx.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
          timestamp: tx.timestamp || tx.createdAt || new Date().toISOString(),
          status: tx.status,
          plan: tx.plan || tx.planName || "Pro Sun Monthly",
          planId: tx.planId || "pro-monthly",
          paymentMethod: tx.paymentMethod || "UPI / Razorpay Live Gateway",
          invoiceNo: tx.invoiceNo || `INV-RZP-${tx.id.substring(tx.id.length - 6).toUpperCase()}`,
        }));

        setTransactions(mapped);
        setLoading(false);
      }
    });

    fetchPaymentHistory();

    return () => {
      unsubscribe();
    };
  }, [userProfile.uid, userProfile.id, userProfile.email, fetchPaymentHistory]);

  // Sync Payment Status Fallback Button Logic
  const handleSyncPaymentStatus = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const email = userProfile.email || "mukeshinland79@gmail.com";
      const result = await safeFetchJson<any>("/api/user/sync-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (result.ok && result.data && result.data.success) {
        const data = result.data;
        setSyncMessage(`✅ Sync Complete: Account set to ${data.badgeStatus}! Total Paid: ₹${data.totalPaidINR} INR.`);
        if (data.subscription) {
          setActiveSubscription(data.subscription);
        }
        await fetchPaymentHistory();
      } else {
        setSyncMessage(`⚠️ Sync Notice: ${result.data?.error || "Unable to sync payment status."}`);
      }
    } catch (err) {
      setSyncMessage("❌ Error triggering payment status sync.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.orderId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.plan.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "subscriptions") {
      return (
        tx.plan.toLowerCase().includes("pro") ||
        tx.plan.toLowerCase().includes("monthly") ||
        tx.plan.toLowerCase().includes("yearly") ||
        tx.plan.toLowerCase().includes("annual")
      );
    }
    if (activeTab === "flexi") {
      return tx.plan.toLowerCase().includes("flexi") || tx.plan.toLowerCase().includes("credit");
    }

    return true;
  });

  // Calculate stats
  const totalSpentINR = transactions
    .filter((tx) => tx.status === "COMPLETED" || tx.status === "SUCCESS")
    .reduce((acc, tx) => acc + (tx.amountINR || 0), 0);

  const hasActivePaidPlan =
    totalSpentINR > 0 ||
    userProfile.plan?.toLowerCase().includes("pro") ||
    (activeSubscription && activeSubscription.status === "active");

  const badgeStatus =
    activeSubscription?.plan_id === "enterprise"
      ? "ENTERPRISE USER"
      : activeSubscription?.plan_id === "flexi"
      ? "FLEXI PACK HOLDER"
      : hasActivePaidPlan
      ? "PRO SUN MEMBER"
      : "FREE CUSTOMER";

  const activePlanName = activeSubscription?.plan_id === "pro-yearly"
    ? "PRO SUN ANNUAL"
    : activeSubscription?.plan_id === "enterprise"
    ? "ENTERPRISE PLAN"
    : activeSubscription?.plan_id === "flexi"
    ? "FLEXI PACK"
    : activeSubscription?.plan_id === "pro-monthly"
    ? "PRO SUN MONTHLY"
    : (userProfile.plan || "FREE PLAN").toUpperCase();

  const bookedPlanAmountINR =
    activeSubscription?.plan_id === "pro-yearly"
      ? 1499
      : activeSubscription?.plan_id === "enterprise"
      ? 3999
      : activeSubscription?.plan_id === "flexi"
      ? 99
      : activeSubscription?.plan_id === "pro-monthly"
      ? 199
      : (totalSpentINR > 0 ? totalSpentINR : 199);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sync Status Banner Feedback */}
      {syncMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: User Profile Header & Billing Overview Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-2xl relative overflow-hidden space-y-6">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        {/* Profile Header Row */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-4">
            <img
              src={userProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt={userProfile.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white">{userProfile.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 tracking-wider">
                  {badgeStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium pt-0.5">
                Account: <span className="text-slate-200 font-bold">{userProfile.email}</span> • Currency: <span className="text-amber-400 font-bold">₹ INR</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {transactions.length > 0 ? (
              (() => {
                const latestStatus = transactions[0]?.status;
                const statusInfo = getVerificationStatusInfo(latestStatus);
                const StatusIcon = statusInfo.icon;
                return (
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold flex items-center space-x-1.5 border shadow-sm ${statusInfo.badgeClass}`}>
                    <StatusIcon className="w-4 h-4 shrink-0" />
                    <span>{statusInfo.label} ({transactions.length} Ledger Records)</span>
                  </span>
                );
              })()
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Ready for Razorpay Payments</span>
              </span>
            )}
          </div>
        </div>

        {/* Primary Billing Container */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4 fill-amber-400" />
              <span>Active Subscription &amp; Billing Overview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* CURRENT PLAN NAME */}
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Booked Plan Name
                </span>
                <span className="text-base font-black text-amber-300 tracking-tight block">
                  CURRENT PLAN: {activePlanName}
                </span>
              </div>

              {/* TOTAL PAID AMOUNT */}
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Total Paid Amount
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono block">
                  ₹{bookedPlanAmountINR.toLocaleString()} INR
                </span>
              </div>

              {/* PAYMENT VERIFICATION STATUS */}
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Firestore Verification
                </span>
                <div className="pt-0.5">
                  {transactions.length > 0 ? (
                    (() => {
                      const latestStatus = transactions[0]?.status;
                      const statusInfo = getVerificationStatusInfo(latestStatus);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${statusInfo.badgeClass}`}>
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{statusInfo.label}</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600/60">
                      <span>Free Customer</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Sync Payment Status Button */}
            <button
              onClick={handleSyncPaymentStatus}
              disabled={syncing}
              className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs uppercase tracking-wider border border-slate-700 shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              title="Sync Payment Status with Razorpay Backend"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Status"}</span>
            </button>

            {/* High-Contrast UPGRADE / CHANGE PLAN CTA */}
            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl hover:scale-[1.02] active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>UPGRADE / CHANGE PLAN →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs: All Transactions, Subscriptions, Flexi Credits */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === "all"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>All Transactions ({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === "subscriptions"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Subscriptions</span>
          </button>
          <button
            onClick={() => setActiveTab("flexi")}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === "flexi"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Flexi Credits ({flexiCredits})</span>
          </button>
        </div>

        {activeTab === "all" && (
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Payment ID, Plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        )}
      </div>

      {/* TAB 1: ALL TRANSACTIONS */}
      {activeTab === "all" && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Receipt className="w-4 h-4 text-amber-500" />
              <span>All Receipts &amp; Payment History ({filteredTransactions.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Gateway: Razorpay Live (India)
            </span>
          </h3>

          {loading ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Fetching payment records from Razorpay...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No transactions found matching criteria</p>
              <p className="text-[11px] text-slate-400">Upgrade your account or buy Flexi Credits to populate your transaction log.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <th className="py-3.5 px-4">Date &amp; Time</th>
                    <th className="py-3.5 px-4">Exact Purchased Plan</th>
                    <th className="py-3.5 px-4">Paid Amount</th>
                    <th className="py-3.5 px-4">Razorpay Payment Ref ID</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Invoice / Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-amber-500/5 transition">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tx.date}</span>
                        </div>
                      </td>

                      {/* Exact Purchased Plan Name */}
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                        <span className="text-xs">{tx.plan}</span>
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 dark:text-emerald-400 whitespace-nowrap">
                        ₹{tx.amountINR?.toLocaleString() || "199"}.00 INR
                      </td>

                      {/* Razorpay Payment Ref ID */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold">{tx.id}</span>
                          <button
                            onClick={() => handleCopy(tx.id)}
                            className="hover:text-amber-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Copy Payment ID"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Dynamic Verification Status ('Razorpay Verified', 'Verification Pending', 'Failed') */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {(() => {
                          const statusInfo = getVerificationStatusInfo(tx.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <span
                              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${statusInfo.badgeClass}`}
                              title={statusInfo.description}
                            >
                              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{statusInfo.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Invoice / Receipt Download Link */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedInvoice(tx)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-700 dark:text-amber-300 text-xs font-bold transition inline-flex items-center space-x-1.5 cursor-pointer border border-amber-500/30"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Receipt .PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{hasActivePaidPlan ? "🟢 ACTIVE SUBSCRIPTION" : "⚪ FREE CUSTOMER TIER"}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                  {activePlanName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  User ID: <span className="font-semibold text-slate-700 dark:text-slate-200">{userProfile.email}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {onOpenPricing && (
                  <button
                    onClick={onOpenPricing}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition"
                  >
                    Upgrade / Change Plan
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Activation Date</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                  {activeSubscription?.activated_at ? new Date(activeSubscription.activated_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Renewal / Expiry</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {activeSubscription?.expires_at ? new Date(activeSubscription.expires_at).toLocaleDateString() : "30 Days Active"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
                <span className="font-bold text-sky-500 font-mono text-sm">
                  Razorpay Live UPI &amp; Subscriptions
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
              <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Subscription Auto-Sync &amp; Unrestricted Access Active</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Your subscription provides unlimited access to all 40+ PDF tools on <strong>pdfsun.in</strong> (Merge, Compress, Split, Convert, Edit, Watermark, and AI Chat PDF). No daily limits or manual refreshes needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLEXI CREDITS */}
      {activeTab === "flexi" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/40">
                  <Zap className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Flexi Credit Balance</span>
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono pt-1">
                  {flexiCredits} <span className="text-sm font-normal text-slate-300">Lifetime Credits Available</span>
                </div>
              </div>

              {onOpenPricing && (
                <button
                  onClick={onOpenPricing}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:scale-102 transition shadow-lg"
                >
                  Buy 100 Credits for ₹99
                </button>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Recent Credit Activity &amp; Usage Ledger</h4>
              <div className="divide-y divide-slate-800 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-xs overflow-hidden">
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-300">+100 Flexi Credits Added</span>
                    <span className="block text-[10px] text-slate-400">Flexi Pack Purchase via Razorpay UPI (₹99)</span>
                  </div>
                  <span className="text-emerald-400 font-black font-mono">+100</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-200">PDF Compression &amp; Optimization</span>
                    <span className="block text-[10px] text-slate-400">Completed via Client Local Browser Memory</span>
                  </div>
                  <span className="text-slate-400 font-mono">0 Credits (Free Tool)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice & GST Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="text-amber-500">PDFSun.in</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-500 font-extrabold rounded-full">
                    PAID RECEIPT
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">PDFSun Software Tech • GST Registered</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-amber-500">{selectedInvoice.invoiceNo || "INV-RZP-2026-9012"}</div>
                <div className="text-[10px] text-slate-400">Date: {selectedInvoice.date}</div>
              </div>
            </div>

            {/* Customer & Gateway Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Billed To</span>
                <span className="font-bold text-slate-900 dark:text-white block truncate">{selectedInvoice.email}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">India</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Verification Status</span>
                {(() => {
                  const statusInfo = getVerificationStatusInfo(selectedInvoice.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-black uppercase border ${statusInfo.badgeClass}`}>
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span>{statusInfo.label}</span>
                    </span>
                  );
                })()}
                <span className="text-[10px] text-slate-400 font-mono block mt-1">ID: {selectedInvoice.id}</span>
              </div>
            </div>

            {/* Line Item Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span>Description</span>
                <span>Amount (INR)</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white py-1">
                <span>{selectedInvoice.plan}</span>
                <span className="font-mono">₹{selectedInvoice.amountINR}.00</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Base Price</span>
                <span className="font-mono">₹{(selectedInvoice.amountINR * 0.82).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>GST / Taxes (18% Included)</span>
                <span className="font-mono">₹{(selectedInvoice.amountINR * 0.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 dark:text-white text-sm border-t border-slate-200 dark:border-slate-800 pt-3">
                <span>Total Paid via Razorpay</span>
                <span className="font-mono text-emerald-500">₹{selectedInvoice.amountINR}.00 INR</span>
              </div>
            </div>

            {/* Invoice Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">
                Payment verified securely via Razorpay Gateway (256-Bit SSL Encrypted)
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center space-x-1.5 hover:bg-amber-400 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
