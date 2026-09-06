import React, { useState } from "react";
import {
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  AlertCircle,
  Lock,
} from "lucide-react";
import { PaymentProduct } from "../config/paymentProducts";

interface DynamicPaymentQRProps {
  product: PaymentProduct;
  currency: "INR" | "USD";
  userEmail?: string;
  onPaymentVerified?: (data: any) => void;
  onCancel?: () => void;
}

export const DynamicPaymentQR: React.FC<DynamicPaymentQRProps> = ({
  product,
  currency,
  userEmail,
  onPaymentVerified,
  onCancel,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Determine payable amount
  const displayAmount =
    currency === "INR"
      ? `₹${product.displayPriceINR.toLocaleString("en-IN")}`
      : `$${product.displayPriceUSD.toLocaleString("en-US")}`;

  // Build the authentic payment destination URL
  // If userEmail is provided, attach it as a reference query param for tracking
  const paymentUrl = React.useMemo(() => {
    const base = product.razorpayPaymentLink;
    if (!base) return "";
    try {
      const url = new URL(base);
      if (userEmail) {
        url.searchParams.set("email", userEmail);
      }
      return url.toString();
    } catch {
      return base;
    }
  }, [product.razorpayPaymentLink, userEmail]);

  const handleCopyLink = () => {
    if (!paymentUrl) return;
    navigator.clipboard.writeText(paymentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenCheckout = () => {
    if (!paymentUrl) return;
    // Persist last checkout intention for seamless reconciliation on return
    try {
      localStorage.setItem("pdfsun_last_checkout_plan", product.internalProductId);
      localStorage.setItem("pdfsun_last_checkout_plan_name", product.productName);
      localStorage.setItem("pdfsun_last_checkout_amount", String(product.displayPriceINR));
      sessionStorage.setItem("pdfsun_last_checkout_plan", product.internalProductId);
      sessionStorage.setItem("pdfsun_last_checkout_plan_name", product.productName);
      sessionStorage.setItem("pdfsun_last_checkout_amount", String(product.displayPriceINR));
    } catch {}

    window.open(paymentUrl, "_blank", "noopener,noreferrer");
  };

  const handleCheckStatus = async () => {
    if (!userEmail) {
      setStatusMessage("Please sign in with your email to check transaction status.");
      return;
    }
    setCheckingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/user/subscription?userId=${encodeURIComponent(userEmail)}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (data && data.success && data.isPro) {
        setStatusMessage("✓ Payment confirmed & account active!");
        if (onPaymentVerified) {
          onPaymentVerified(data);
        }
      } else {
        setStatusMessage("No completed payment detected yet. If you just paid, please allow a few seconds for webhook confirmation.");
      }
    } catch {
      setStatusMessage("Unable to reach verification server. Please retry in a moment.");
    } finally {
      setCheckingStatus(false);
    }
  };

  // Format obfuscated / privacy-safe account display
  const getAccountBoundDisplay = (email?: string) => {
    if (!email || email.includes("mukesh") || !email.includes("@")) {
      return "Pdfsun.in Account";
    }
    const parts = email.split("@");
    if (parts.length === 2) {
      const namePart = parts[0];
      const domainPart = parts[1];
      const maskedName =
        namePart.length > 2
          ? `${namePart[0]}***${namePart[namePart.length - 1]}`
          : `${namePart[0]}***`;
      return `Pdfsun.in User (${maskedName}@${domainPart})`;
    }
    return "Pdfsun.in Account";
  };

  return (
    <div className="bg-[#0f172a] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Razorpay Secure Checkout</h3>
            <p className="text-[11px] text-slate-400">Direct Online Payment Gateway</p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Plan Details Summary */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Selected Plan:</span>
          <span className="font-bold text-white text-sm">{product.productName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Payable Amount:</span>
          <span className="font-mono font-black text-amber-400 text-base">{displayAmount}</span>
        </div>
        {product.type === "one-time" && product.credits && (
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Included Quota:</span>
            <span className="font-bold text-purple-300">{product.credits} Lifetime PDF Credits</span>
          </div>
        )}
        {product.type === "subscription" && (
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Billing Duration:</span>
            <span className="font-bold text-emerald-400">
              {product.billingInterval === "yearly" ? "365 Days Access (Annual)" : "30 Days Access (Monthly)"}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">Account Bound:</span>
          <span className="font-semibold text-[11px] text-emerald-400 flex items-center gap-1.5 truncate max-w-[240px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span>{getAccountBoundDisplay(userEmail)}</span>
          </span>
        </div>
      </div>

      {/* Direct Payment Checkout Section (No QR or App Redirection warnings) */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Razorpay 256-Bit SSL Encrypted Gateway</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              100% Secure
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Clicking below opens the official Razorpay verified checkout page directly. Choose your preferred payment method seamlessly without any third-party app warnings.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["UPI (GPay / PhonePe / Paytm / BHIM)", "Credit & Debit Cards", "NetBanking (50+ Banks)", "Wallets"].map(
              (mode) => (
                <span
                  key={mode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[10px] font-semibold text-slate-300"
                >
                  {mode}
                </span>
              )
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleOpenCheckout}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl hover:scale-[1.01] active:scale-99 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Proceed to Razorpay Secure Checkout ({displayAmount}) →</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Official Link Copied to Clipboard!" : "Copy Official Payment Link"}</span>
          </button>
        </div>
      </div>

      {/* Verification / Polling status check section */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={checkingStatus}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-800 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? "animate-spin text-amber-400" : ""}`} />
          <span>{checkingStatus ? "Verifying with server..." : "I have completed payment — Check Activation Status"}</span>
        </button>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              statusMessage.includes("✓")
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Official Razorpay Verified Partner • 100% Bank Grade Security</span>
      </div>
    </div>
  );
};
