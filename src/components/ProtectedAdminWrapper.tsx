import React, { useEffect, useState, useMemo } from "react";
import { ShieldAlert, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { UserProfile } from "../types";
import {
  validateAdminSession,
  verifyAdminSessionWithServer,
  getStoredAdminToken,
  getStoredAdminSecretKey,
  AdminSessionValidationResult,
} from "../middleware/adminAuth";

export interface ProtectedAdminWrapperProps {
  canAccessAdmin: boolean;
  userProfile?: UserProfile | null;
  isLoading?: boolean;
  onUnauthorized: () => void;
  children: React.ReactNode;
}

/**
 * Protective Admin Wrapper Component for PDFSun
 * 
 * Enforces dual verification:
 * 1. Checks React RBAC permission state (`canAccessAdmin`).
 * 2. Actively validates session tokens, cryptographic owner identity, and ADMIN_SECRET_KEY
 *    via `middleware/adminAuth.ts` against the server to ensure administrative actions cannot be executed
 *    without a verified, non-spoofed admin session.
 */
export const ProtectedAdminWrapper: React.FC<ProtectedAdminWrapperProps> = ({
  canAccessAdmin,
  userProfile = null,
  isLoading = false,
  onUnauthorized,
  children,
}) => {
  const [sessionValidation, setSessionValidation] = useState<AdminSessionValidationResult>(() => {
    return validateAdminSession(userProfile, getStoredAdminToken(), getStoredAdminSecretKey());
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Synchronize and run server-backed session verification
  useEffect(() => {
    let isCancelled = false;

    // 1. Initial fast local validation check
    const localResult = validateAdminSession(
      userProfile,
      getStoredAdminToken(),
      getStoredAdminSecretKey()
    );
    setSessionValidation(localResult);

    if (!localResult.isValid || !canAccessAdmin) {
      if (!isLoading) {
        onUnauthorized();
      }
      return;
    }

    // 2. Active server verification with adminAuth middleware utility
    setIsVerifyingSession(true);
    verifyAdminSessionWithServer({
      userProfile,
      token: getStoredAdminToken(),
      adminSecretKey: getStoredAdminSecretKey(),
    })
      .then((serverResult) => {
        if (isCancelled) return;
        setSessionValidation(serverResult);
        if (!serverResult.isValid) {
          setVerificationError(
            serverResult.reason || "Server rejected admin session verification."
          );
          onUnauthorized();
        } else {
          setVerificationError(null);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn("[ProtectedAdminWrapper] Verification check notice:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsVerifyingSession(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [canAccessAdmin, userProfile, isLoading, onUnauthorized]);

  // Handle loading state
  if (isLoading || isVerifyingSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
        <div className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in max-w-xs text-center">
          <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>Verifying Admin Credentials</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Validating session token and ADMIN_SECRET_KEY...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthorized state
  if (!canAccessAdmin || !sessionValidation.isValid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
        <div className="flex flex-col items-center text-center space-y-3.5 p-6 max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 shadow-2xl animate-fade-in">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Admin Session Required
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {verificationError ||
                "Access to this administrative suite requires verified Co-Owner or Admin credentials and a valid ADMIN_SECRET_KEY session token."}
            </p>
          </div>

          <div className="w-full pt-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={onUnauthorized}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Authenticate as Admin / Owner</span>
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Protected by Zero-Trust RBAC & Session Cloaking
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render children only when fully authorized and cryptographically verified
  return <>{children}</>;
};

/**
 * Higher-Order Component (HOC) for protecting components with the admin auth middleware
 */
export function withAdminProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  getCanAccess: (props: P) => boolean,
  onUnauthorized: (props: P) => void,
  getUserProfile?: (props: P) => UserProfile | null
) {
  return function ProtectedAdminComponent(props: P) {
    const canAccess = getCanAccess(props);
    const profile = getUserProfile ? getUserProfile(props) : null;

    return (
      <ProtectedAdminWrapper
        canAccessAdmin={canAccess}
        userProfile={profile}
        onUnauthorized={() => onUnauthorized(props)}
      >
        <WrappedComponent {...props} />
      </ProtectedAdminWrapper>
    );
  };
}

export default ProtectedAdminWrapper;
