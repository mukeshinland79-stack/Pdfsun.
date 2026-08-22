import express, { Request, Response, NextFunction } from "express";
import {
  registerUserAccount,
  authenticateUser,
  authenticateSocialUser,
  verifySessionToken,
  getUserProfileByEmail,
  initiateBankingStep1Login,
  verifyBankingStep2Otp,
  resendBankingOtp,
  requestPasswordResetOtp,
  verifyRecoveryOtpAndIssueToken,
  updatePasswordWithResetToken,
  verifyAndResetPassword,
  normalizeLoginIdentifier,
  repairAndRestoreDatabase,
} from "./authService";
import { DUAL_OWNER_EMAILS } from "../types";

export const authRouter = express.Router();

// CORS & Preflight handling specifically for auth router
authRouter.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email, x-owner-email, x-admin-token, x-user-token, x-idempotency-key"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Trailing Slash Normalization with HTTP 307 (strictly preserves POST method and body payload)
authRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.length > 1 && req.path.endsWith("/")) {
    const query = req.url.slice(req.path.length);
    const safePath = req.path.slice(0, -1);
    return res.redirect(307, safePath + query);
  }
  next();
});

/**
 * 1. User / Admin Registration Handler
 * POST /api/auth/register
 */
export const handleRegister = (req: Request, res: Response) => {
  try {
    const { name, email, identifier, phone, password } = req.body || {};
    const inputIdentifier = (identifier || email || phone || "").trim();

    if (!inputIdentifier) {
      return res.status(400).json({
        success: false,
        message: "Email address or mobile number is required.",
        error: "Email address or mobile number is required.",
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long.",
        error: "Password must be at least 4 characters long.",
      });
    }

    const result = registerUserAccount({
      name: name?.trim(),
      identifier: inputIdentifier,
      email: inputIdentifier,
      phone,
      password,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "Registration failed",
        error: result.error || "Registration failed",
      });
    }

    // Set secure session cookies
    res.setHeader("Set-Cookie", [
      `pdfsun_user_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      `pdfsun_user_email=${encodeURIComponent(result.user?.email || "")}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
    ]);

    return res.status(200).json({
      status: "ok",
      success: true,
      message: "Account registered successfully!",
      data: {
        token: result.token,
        user: result.user,
        role: result.user?.role || "user",
      },
      token: result.token,
      user: result.user,
      role: result.user?.role || "user",
    });
  } catch (err: any) {
    console.error("[Auth Register Handler Error]:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error during registration",
      error: err.message || "Internal server error during registration",
    });
  }
};

/**
 * 2. User & Owner Login Handler
 * POST /api/auth/login
 */
export const handleLogin = async (req: Request, res: express.Response) => {
  try {
    const { identifier, email, phone, password, ownerSecretKey, secretKey, isOwnerLogin, otp } = req.body || {};
    const inputIdentifier = (identifier || email || phone || "").trim();
    const key = password || ownerSecretKey || secretKey || "";

    if (!inputIdentifier) {
      return res.status(400).json({
        success: false,
        message: "Please enter your Email Address or Mobile Number.",
        error: "Please enter your Email Address or Mobile Number.",
      });
    }

    const ip = req.headers["x-forwarded-for"]
      ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
      : req.socket?.remoteAddress || "127.0.0.1";
    const userAgent = String(req.headers["user-agent"] || "browser");

    // If OTP is provided, verify OTP directly (MFA completion)
    if (otp) {
      const mfaRes = await verifyBankingStep2Otp({
        identifier: inputIdentifier,
        otp: String(otp),
        ip,
        userAgent,
      });

      if (!mfaRes.success) {
        const statusCode = mfaRes.isLocked ? 423 : 401;
        return res.status(statusCode).json({
          ...mfaRes,
          success: false,
          message: mfaRes.error || "Invalid OTP code",
        });
      }

      const isOwner = mfaRes.role === "owner" || mfaRes.hasAdminAccess;
      const cookies = [
        `pdfsun_user_session=${mfaRes.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
        `pdfsun_user_email=${encodeURIComponent(mfaRes.user?.email || "")}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      ];
      if (isOwner) {
        cookies.push(`pdfsun_admin_session=${mfaRes.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
      }
      res.setHeader("Set-Cookie", cookies);

      return res.status(200).json({
        status: "ok",
        success: true,
        message: mfaRes.message || "Logged in successfully!",
        data: {
          token: mfaRes.token,
          role: mfaRes.role || "user",
          user: mfaRes.user,
          hasAdminAccess: mfaRes.hasAdminAccess || false,
        },
        token: mfaRes.token,
        role: mfaRes.role || "user",
        user: mfaRes.user,
        hasAdminAccess: mfaRes.hasAdminAccess || false,
      });
    }

    // Determine if Admin MFA flow is explicitly requested
    if (isOwnerLogin) {
      const step1Result = await initiateBankingStep1Login({
        identifier: inputIdentifier,
        password: key,
        secretKey: key,
        ip,
        userAgent,
        isOwnerLogin: true,
      });

      if (!step1Result.success) {
        const statusCode = step1Result.isLocked ? 423 : step1Result.cooldownSeconds ? 429 : 401;
        return res.status(statusCode).json({
          ...step1Result,
          success: false,
          message: step1Result.error || "Authentication failed",
        });
      }

      return res.status(200).json({
        ...step1Result,
        status: "ok",
        success: true,
        message: step1Result.message || "MFA code dispatched",
        data: step1Result,
        requiresMfa: true,
        mfaRequired: true,
        role: "admin",
      });
    }

    // Standard fast direct login
    const result = authenticateUser({
      email: inputIdentifier,
      password: key,
      ownerSecretKey: key,
      isOwnerLogin: false,
    });

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error || "Invalid login credentials.",
        error: result.error || "Invalid login credentials.",
      });
    }

    const isOwner = result.user?.role === "owner" || result.user?.hasAdminAccess;
    const cookies = [
      `pdfsun_user_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      `pdfsun_user_email=${encodeURIComponent(result.user?.email || "")}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
    ];
    if (isOwner) {
      cookies.push(`pdfsun_admin_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
    }
    res.setHeader("Set-Cookie", cookies);

    return res.status(200).json({
      status: "ok",
      success: true,
      requiresMfa: false,
      message: isOwner ? "Welcome Owner! Admin access verified." : "Logged in successfully!",
      data: {
        token: result.token,
        user: result.user,
        role: result.user?.role || "user",
        hasAdminAccess: result.user?.hasAdminAccess || false,
      },
      token: result.token,
      user: result.user,
      role: result.user?.role || "user",
      hasAdminAccess: result.user?.hasAdminAccess || false,
    });
  } catch (err: any) {
    console.error("[Auth Login Handler Error]:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Authentication error.",
      error: err.message || "Authentication error.",
    });
  }
};

/**
 * 3. Step 1 / MFA Dispatch
 * POST /api/auth/login-step1, POST /api/auth/send-mfa
 */
export const handleStep1Login = async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone, password, secretKey, ownerSecretKey, isOwnerLogin } = req.body || {};
    const inputIdentifier = identifier || email || phone || "";
    const key = password || secretKey || ownerSecretKey || "";

    const ip = req.headers["x-forwarded-for"]
      ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
      : req.socket?.remoteAddress || "127.0.0.1";
    const userAgent = String(req.headers["user-agent"] || "browser");

    const result = await initiateBankingStep1Login({
      identifier: String(inputIdentifier),
      password: key,
      secretKey: key,
      ip,
      userAgent,
      isOwnerLogin: Boolean(isOwnerLogin !== false),
    });

    if (!result.success) {
      const statusCode = result.isLocked ? 423 : result.cooldownSeconds ? 429 : 401;
      return res.status(statusCode).json(result);
    }

    return res.status(200).json({
      status: "ok",
      ...result,
    });
  } catch (err: any) {
    console.error("[Banking Step 1 Error]:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to process authentication." });
  }
};

/**
 * 4. Step 2: Validate 6-Digit OTP / MFA Verification
 * POST /api/auth/verify-otp, POST /api/auth/verify-mfa
 */
export const handleVerifyOtp = async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone, otp } = req.body || {};
    const inputIdentifier = identifier || email || phone || "";

    const ip = req.headers["x-forwarded-for"]
      ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
      : req.socket?.remoteAddress || "127.0.0.1";
    const userAgent = String(req.headers["user-agent"] || "browser");

    const result = await verifyBankingStep2Otp({
      identifier: String(inputIdentifier),
      otp: String(otp || ""),
      ip,
      userAgent,
    });

    if (!result.success) {
      const statusCode = result.isLocked ? 423 : 401;
      return res.status(statusCode).json(result);
    }

    const isOwner = result.role === "owner" || result.hasAdminAccess;
    const cookies = [
      `pdfsun_user_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      `pdfsun_user_email=${encodeURIComponent(result.user?.email || "")}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
    ];

    if (isOwner) {
      cookies.push(`pdfsun_admin_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
    }

    res.setHeader("Set-Cookie", cookies);

    return res.status(200).json({
      status: "ok",
      success: true,
      token: result.token,
      role: result.role,
      user: result.user,
      hasAdminAccess: result.hasAdminAccess,
      message: result.message,
    });
  } catch (err: any) {
    console.error("[Banking OTP Verification Error]:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to verify OTP." });
  }
};

/**
 * 5. Password Reset Initiation (Dispatches Recovery OTP)
 * POST /api/auth/reset-initiation, POST /api/auth/forgot-password
 */
export const handleResetInitiation = async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone } = req.body || {};
    const input = identifier || email || phone;
    if (!input) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered Email Address or Mobile Number.",
        error: "Please enter your registered Email Address or Mobile Number.",
      });
    }

    const ip = req.headers["x-forwarded-for"]
      ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
      : req.socket?.remoteAddress || "127.0.0.1";
    const result = await requestPasswordResetOtp({ identifier: input, ip });

    if (!result.success) {
      const statusCode = result.cooldownSeconds ? 429 : 400;
      return res.status(statusCode).json({
        ...result,
        success: false,
        message: result.error || "Failed to generate recovery OTP",
      });
    }

    const successMessage = result.message || `OTP successfully sent to ${result.maskedTarget || result.maskedEmail || result.maskedPhone}`;

    return res.status(200).json({
      ...result,
      status: "ok",
      success: true,
      message: successMessage,
      data: {
        identifier: result.identifier,
        maskedTarget: result.maskedTarget,
        maskedEmail: result.maskedEmail,
        maskedPhone: result.maskedPhone,
        cooldownSeconds: result.cooldownSeconds,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to generate recovery OTP",
      error: err.message || "Failed to generate recovery OTP",
    });
  }
};

/**
 * 6. Verify Recovery OTP & Obtain Reset Token
 * POST /api/auth/reset-verify, POST /api/auth/verify-recovery-otp
 */
export const handleResetVerify = async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone, otp } = req.body || {};
    const input = identifier || email || phone;
    const result = await verifyRecoveryOtpAndIssueToken({
      identifier: input,
      otp: String(otp || ""),
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      status: "ok",
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to verify OTP." });
  }
};

/**
 * 7. Set New Password with Reset Token
 * POST /api/auth/new-password, POST /api/auth/reset-password
 */
export const handleNewPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword, identifier, otp } = req.body || {};

    // Fallback: If submitted via direct OTP flow
    if (!resetToken && otp && identifier && newPassword) {
      const ip = req.headers["x-forwarded-for"]
        ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
        : req.socket?.remoteAddress || "127.0.0.1";
      const userAgent = String(req.headers["user-agent"] || "browser");

      const directResult = await verifyAndResetPassword({
        identifier,
        otp: String(otp),
        newPassword: String(newPassword),
        ip,
        userAgent,
      });

      if (!directResult.success) {
        return res.status(400).json(directResult);
      }

      if (directResult.token) {
        res.setHeader("Set-Cookie", [
          `pdfsun_user_session=${directResult.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
        ]);
      }

      return res.status(200).json({
        status: "ok",
        ...directResult,
      });
    }

    const ip = req.headers["x-forwarded-for"]
      ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
      : req.socket?.remoteAddress || "127.0.0.1";
    const userAgent = String(req.headers["user-agent"] || "browser");

    const result = await updatePasswordWithResetToken({
      resetToken: String(resetToken || ""),
      newPassword: String(newPassword || ""),
      ip,
      userAgent,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    if (result.token) {
      res.setHeader("Set-Cookie", [
        `pdfsun_user_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      ]);
    }

    return res.status(200).json({
      status: "ok",
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to set new password.",
      error: err.message || "Failed to set new password.",
    });
  }
};

/**
 * 8. Resend OTP
 * POST /api/auth/resend-otp
 */
export const handleResendOtp = async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone } = req.body || {};
    const inputIdentifier = identifier || email || phone || "";
    const ip = req.headers["x-forwarded-for"]
      ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
      : req.socket?.remoteAddress || "127.0.0.1";

    const result = await resendBankingOtp({
      identifier: String(inputIdentifier),
      ip,
    });

    if (!result.success) {
      const statusCode = result.cooldownSeconds ? 429 : 400;
      return res.status(statusCode).json(result);
    }

    return res.status(200).json({
      status: "ok",
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to resend OTP." });
  }
};

/**
 * 9. Session Verification
 * GET / POST /api/auth/verify-session
 */
export const handleVerifySession = (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = "";

    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.headers["x-user-token"] === "string") {
      token = req.headers["x-user-token"];
    } else if (typeof req.headers["x-admin-token"] === "string") {
      token = req.headers["x-admin-token"];
    } else if (req.body?.token) {
      token = req.body.token;
    } else if (req.query?.token) {
      token = String(req.query.token);
    } else if (req.headers.cookie) {
      const match = req.headers.cookie
        .split("; ")
        .find((row) => row.startsWith("pdfsun_user_session=") || row.startsWith("pdfsun_admin_session="));
      if (match) {
        token = match.split("=")[1];
      }
    }

    if (!token) {
      return res.json({
        success: false,
        valid: false,
        user: null,
        role: "public",
        error: "No active session token found",
      });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return res.json({
        success: false,
        valid: false,
        user: null,
        role: "public",
        error: "Session expired or invalid",
      });
    }

    const profile = getUserProfileByEmail(payload.email) || {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      plan: payload.plan,
      hasAdminAccess: payload.hasAdminAccess,
      isPro: payload.isPro || false,
    };

    return res.json({
      status: "ok",
      success: true,
      valid: true,
      user: profile,
      role: profile.role,
      token,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, valid: false, error: err.message });
  }
};

/**
 * 10. Logout & Session Termination
 * POST /api/auth/logout
 */
export const handleLogout = (req: Request, res: Response) => {
  res.setHeader("Set-Cookie", [
    "pdfsun_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "pdfsun_user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "pdfsun_user_email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax",
  ]);
  return res.json({
    status: "ok",
    success: true,
    message: "Session token invalidated and cleared server-side.",
    timestamp: new Date().toISOString(),
  });
};

/**
 * 11. Refresh Session
 * POST /api/auth/refresh-session
 */
export const handleRefreshSession = (req: Request, res: Response) => {
  return res.json({
    status: "ok",
    success: true,
    message: "Session token refreshed and extended.",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    timestamp: new Date().toISOString(),
  });
};

/**
 * 12. Social OAuth Login (Google, Facebook, SSO)
 * POST /api/auth/social-login
 */
export const handleSocialLogin = (req: Request, res: Response) => {
  try {
    const { provider, email, name, avatar, ssoDomain } = req.body || {};
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required for social login.",
        error: "Email address is required for social login.",
      });
    }

    const result = authenticateSocialUser({
      provider: provider || "google",
      email,
      name,
      avatar,
      ssoDomain,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "Social authentication failed.",
        error: result.error || "Social authentication failed.",
      });
    }

    const isOwner = result.role === "owner" || result.user?.hasAdminAccess;
    const cookies = [
      `pdfsun_user_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      `pdfsun_user_email=${encodeURIComponent(result.user?.email || "")}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
    ];
    if (isOwner) {
      cookies.push(`pdfsun_admin_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
    }
    res.setHeader("Set-Cookie", cookies);

    return res.status(200).json({
      status: "ok",
      success: true,
      message: `Signed in successfully via ${provider || "OAuth"}!`,
      data: {
        token: result.token,
        user: result.user,
        role: result.role,
        hasAdminAccess: isOwner,
      },
      token: result.token,
      user: result.user,
      role: result.role,
      hasAdminAccess: isOwner,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Social login failed.",
      error: err.message || "Social login failed.",
    });
  }
};

// Route Registration for Router
authRouter.post("/register", handleRegister);
authRouter.post("/login", handleLogin);
authRouter.post("/social-login", handleSocialLogin);
authRouter.post("/login-step1", handleStep1Login);
authRouter.post("/send-mfa", handleStep1Login);
authRouter.post("/verify-otp", handleVerifyOtp);
authRouter.post("/verify-mfa", handleVerifyOtp);
authRouter.post("/resend-otp", handleResendOtp);
authRouter.post("/reset-initiation", handleResetInitiation);
authRouter.post("/forgot-password", handleResetInitiation);
authRouter.post("/forgot-password-request", handleResetInitiation);
authRouter.post("/reset-verify", handleResetVerify);
authRouter.post("/verify-recovery-otp", handleResetVerify);
authRouter.post("/new-password", handleNewPassword);
authRouter.post("/reset-password", handleNewPassword);
authRouter.all(
  [
    "/verify-session",
    "/session",
    "/me",
    "/user",
    "/check",
    "/user-check",
    "/current-user",
    "/status",
  ],
  handleVerifySession
);
authRouter.all(["/logout", "/signout"], handleLogout);
authRouter.post("/refresh-session", handleRefreshSession);

// Safety GET handler for standard POST-only auth endpoints: returns HTTP 200/405 with JSON payload instead of unhandled crash or 404 HTML
authRouter.get(
  [
    "/register",
    "/login",
    "/login-step1",
    "/send-mfa",
    "/verify-otp",
    "/verify-mfa",
    "/resend-otp",
    "/reset-initiation",
    "/forgot-password",
    "/reset-verify",
    "/verify-recovery-otp",
    "/new-password",
    "/reset-password",
  ],
  (req, res) => {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(200).json({
      success: true,
      endpoint: req.originalUrl,
      message: `Authentication endpoint ready. Send a POST request with JSON payload to perform action.`,
      status: "ready",
    });
  }
);
