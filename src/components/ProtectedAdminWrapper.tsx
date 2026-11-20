import React, { useEffect, useState } from "react";
import { ShieldAlert, Lock, ShieldCheck } from "lucide-react";
import { UserProfile } from "../types";
import {
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
 * Strictly enforces server-backed RBAC & session verification:
 * 1. Checks React RBAC permission state (`canAccessAdmin`).
 * 2. Requires authoritative verification via `/api/v1/auth/verify-session`.
 * 3. Fails closed to owner/admin authentication prompt if verification fails.
 */
export const ProtectedAdminWrapper: React.FC<ProtectedAdminWrapperProps> = ({
  canAccessAdmin,
  userProfile = null,
  isLoading = false,
  onUnauthorized,
  children,
}) => {
  const [sessionValidation, setSessionValidation] = useState<AdminSessionValidationResult>({
    isValid: false,
    isOwner: false,
    role: "unauthorized",
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Always run authoritative server-backed session verification
  useEffect(() => {
    let isCancelled = false;

    if (!canAccessAdmin) {
      setSessionValidation({
        isValid: false,
        isOwner: false,
        role: "unauthorized",
      });
      setIsVerifyingSession(false);
      return;
    }

    setIsVerifyingSession(true);
    const safetyTimer = setTimeout(() => {
      if (!isCancelled) {
        setIsVerifyingSession(false);
        setSessionValidation((prev) =>
          prev.isValid
            ? prev
            : {
                isValid: false,
                isOwner: false,
                role: "unauthorized",
                reason: "Session verification timed out. Please re-authenticate.",
              }
        );
      }
    }, 10000);

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
        } else {
          setVerificationError(null);
        }
      })
      .catch(() => {
        if (isCancelled) return;
        setSessionValidation({
          isValid: false,
          isOwner: false,
          role: "unauthorized",
          reason: "Unable to verify administrative session with server.",
        });
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
  }, [canAccessAdmin, userProfile?.id, userProfile?.email, userProfile?.role]);

  // Require BOTH client privilege state AND server-verified admin/owner session
  if (canAccessAdmin && sessionValidation.isValid && !isVerifyingSession) {
    return <>{children}</>;
  }

  // Handle transient verification state (fail-closed, zero bypass)
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
              Validating MFA-verified session token with server...
            </p>
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
              "Access to this administrative suite requires verified Sole-Owner or Admin credentials with completed MFA authentication."}
          </p>
        </div>

        <div className="w-full pt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onUnauthorized()}
            className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Authenticate as Admin / Owner</span>
          </button>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Protected by Sole-Owner Zero-Trust RBAC &amp; Mandatory MFA
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
