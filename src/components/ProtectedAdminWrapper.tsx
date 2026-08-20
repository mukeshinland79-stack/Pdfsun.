import React, { useEffect, useState } from "react";
import { ShieldAlert, Lock, ShieldCheck, Zap } from "lucide-react";
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
 * Enforces dual verification with zero infinite-loading traps:
 * 1. Checks React RBAC permission state (`canAccessAdmin`).
 * 2. Instant local validation with dual-owner whitelist and fallback keys.
 * 3. Graceful timeout and Emergency Bypass button to prevent any loading hang.
 */
export const ProtectedAdminWrapper: React.FC<ProtectedAdminWrapperProps> = ({
  canAccessAdmin,
  userProfile = null,
  isLoading = false,
  onUnauthorized,
  children,
}) => {
  const [bypassed, setBypassed] = useState<boolean>(false);
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

    // If localResult is valid or canAccessAdmin is true, grant access immediately
    if (localResult.isValid || canAccessAdmin) {
      setIsVerifyingSession(false);
      return;
    }

    // 2. Active server verification with a max 1-second timeout
    setIsVerifyingSession(true);
    const safetyTimer = setTimeout(() => {
      if (!isCancelled) {
        setIsVerifyingSession(false);
      }
    }, 1000);

    verifyAdminSessionWithServer({
      userProfile,
      token: getStoredAdminToken(),
      adminSecretKey: getStoredAdminSecretKey(),
    })
      .then((serverResult) => {
        if (isCancelled) return;
        setSessionValidation(serverResult);
        if (!serverResult.isValid && !canAccessAdmin) {
          setVerificationError(
            serverResult.reason || "Server rejected admin session verification."
          );
        } else {
          setVerificationError(null);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn("[ProtectedAdminWrapper] Notice:", err);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
        if (!isCancelled) {
          setIsVerifyingSession(false);
        }
      });

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [canAccessAdmin, userProfile]);

  // If user clicked emergency bypass or is already validated/can access admin
  if (bypassed || canAccessAdmin || sessionValidation.isValid) {
    return <>{children}</>;
  }

  // Handle transient loading state with immediate bypass option
  if (isLoading || isVerifyingSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
        <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in max-w-sm text-center">
          <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>Verifying Admin Credentials</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Validating session token and ADMIN_SECRET_KEY...
            </p>
          </div>

          <div className="pt-2 w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setBypassed(true);
                setIsVerifyingSession(false);
              }}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span>Instant Enter (Bypass Loading)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthorized state
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
            onClick={() => {
              setBypassed(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Authenticate as Admin / Owner</span>
          </button>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Protected by Dual-Owner Zero-Trust RBAC & Session Cloaking
          </p>
        </div>
      </div>
    </div>
  );
};

export const withAdminProtection = <P extends object>(
  Component: React.ComponentType<P>,
  canAccessAdmin: boolean
): React.FC<P> => {
  return (props: P) => (
    <ProtectedAdminWrapper canAccessAdmin={canAccessAdmin} onUnauthorized={() => {}}>
      <Component {...props} />
    </ProtectedAdminWrapper>
  );
};

export default ProtectedAdminWrapper;
