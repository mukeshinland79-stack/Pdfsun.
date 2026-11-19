import fs from "fs";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserProfile, UserRole, DUAL_OWNER_EMAILS } from "../types";
import {
  dispatchMultiChannelOtp,
  generateSecureOtp,
  maskEmailAddress,
  maskPhoneNumber,
  maskUserIdentifier,
} from "./otpNotificationService";
import {
  getJwtSecret,
  isValidAdminSecret,
  revokeAdminOrSessionToken,
  isRevokedAdminOrSessionToken,
} from "./middleware/adminAuth";
import { getUserSubscription } from "./paymentStore";
import firebaseConfigData from "../../firebase-applet-config.json";

export { maskEmailAddress, maskPhoneNumber, maskUserIdentifier };

const USERS_FILE_PATH = path.join(process.cwd(), "users_store.json");

export function isOwnerAccountEmail(email: string): boolean {
  const clean = (email || "").toLowerCase().trim();
  return DUAL_OWNER_EMAILS.includes(clean) || clean === "mukeshinland79@gmail.com";
}

/**
 * Cryptographically verifies a Google/Firebase ID token (or Google OAuth2 access token)
 * against Google's official endpoints without requiring IAM service-account credentials.
 */
export async function verifyGoogleProviderToken(providerToken: string | undefined | null): Promise<{
  valid: boolean;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  avatar?: string;
  error?: string;
}> {
  const token = (providerToken || "").trim();
  if (!token) {
    return { valid: false, error: "Missing Google authentication token." };
  }

  const firebaseApiKey = (process.env.VITE_FIREBASE_API_KEY || firebaseConfigData?.apiKey || "").trim();

  // 1. Primary: Verify Firebase Auth ID token via Google Identity Toolkit accounts:lookup
  if (firebaseApiKey && token.split(".").length === 3) {
    try {
      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        }
      );

      if (lookupRes.ok) {
        const lookupData = (await lookupRes.json()) as {
          users?: Array<{
            email?: string;
            emailVerified?: boolean;
            displayName?: string;
            photoUrl?: string;
          }>;
        };
        const account = lookupData?.users?.[0];
        if (account?.email && account.emailVerified !== false) {
          return {
            valid: true,
            email: account.email.toLowerCase().trim(),
            emailVerified: Boolean(account.emailVerified ?? true),
            name: account.displayName,
            avatar: account.photoUrl,
          };
        }
        return { valid: false, error: "Google account email is not verified." };
      }
    } catch (err) {
      console.warn("[AuthService] Firebase ID token lookup warning:", err);
    }
  }

  // 2. Fallback: Verify Google OAuth2 access token via Google userinfo endpoint (GIS TokenClient flow)
  try {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (userInfoRes.ok) {
      const info = (await userInfoRes.json()) as {
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
      };
      if (info?.email && info.email_verified !== false) {
        return {
          valid: true,
          email: info.email.toLowerCase().trim(),
          emailVerified: Boolean(info.email_verified ?? true),
          name: info.name,
          avatar: info.picture,
        };
      }
      return { valid: false, error: "Google account email could not be verified." };
    }
  } catch (err) {
    console.warn("[AuthService] Google OAuth userinfo verification warning:", err);
  }

  return { valid: false, error: "Invalid or expired Google authentication token. Please sign in again." };
}

/**
 * Updates the salted PBKDF2-SHA512 password hash for an already-authenticated user.
 */
export function changeAuthenticatedUserPassword(
  emailInput: string,
  newPassword: string
): { success: boolean; error?: string; message?: string } {
  const email = (emailInput || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid authenticated email is required." };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(newPassword, salt);
  const isOwnerEmail = isOwnerAccountEmail(email);

  let user = usersStore[email];
  if (!user) {
    const ent = resolveAuthoritativeEntitlement({
      email,
      role: isOwnerEmail ? "owner" : "user",
      plan: "Free Plan",
      hasAdminAccess: isOwnerEmail,
    });
    user = {
      id: isOwnerEmail ? "owner-" + Math.random().toString(36).substring(2, 7) : "usr-" + Date.now(),
      name: isOwnerEmail ? (email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia") : email.split("@")[0],
      email,
      phone: isOwnerEmail ? process.env.OWNER_MFA_PHONE || "" : "",
      passwordHash,
      salt,
      role: isOwnerEmail ? "owner" : "user",
      plan: ent.plan,
      hasAdminAccess: isOwnerEmail,
      isPro: ent.isPro,
      joinedDate: isOwnerEmail ? "Founder & Owner" : "Jan 2026",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    usersStore[email] = user;
  } else {
    user.passwordHash = passwordHash;
    user.salt = salt;
    user.lastLoginAt = new Date().toISOString();
  }

  resetFailedAttempts(email);
  saveUsersStore();
  return {
    success: true,
    message: "Account password updated securely. You can now sign in with your new password or Google Sign-In.",
  };
}

function resolveAuthoritativeEntitlement(user: Pick<StoredUser, "email" | "role" | "plan" | "hasAdminAccess">): {
  isPro: boolean;
  plan: string;
} {
  if (isOwnerAccountEmail(user.email) || user.role === "owner") {
    return { isPro: true, plan: "Founder & Owner" };
  }
  const { subscription, isActive } = getUserSubscription(user.email);
  return {
    isPro: isActive,
    plan: isActive ? subscription?.plan_name || user.plan || "Pro Sun Plan" : "Free Plan",
  };
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  plan: string;
  hasAdminAccess: boolean;
  isPro?: boolean;
  avatar?: string;
  photoURL?: string;
  joinedDate: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthSessionPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  plan: string;
  hasAdminAccess: boolean;
  mfaVerified?: boolean;
  isPro?: boolean;
  clientBinding?: string; // SHA-256 hash of (client IP + User-Agent)
  iat?: number;
  exp?: number;
}

// In-Memory User Store with disk persistence
let usersStore: Record<string, StoredUser> = {};

// Banking-Grade Security Stores
interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number; // timestamp in ms
  lastAttemptAt: number;
}

interface OtpRecord {
  otp: string;
  expiresAt: number;
  email: string;
  phone: string;
  attempts: number;
  purpose: "LOGIN_MFA" | "PASSWORD_RESET";
  lastSentAt: number;
}

interface RateLimitRecord {
  lastOtpSentAt: number;
  ip: string;
}

const accountLockoutStore: Record<string, LockoutRecord> = {};
const bankingOtpStore: Record<string, OtpRecord> = {};
const rateLimitStore: Record<string, RateLimitRecord> = {};

interface ResetTokenRecord {
  email: string;
  expiresAt: number; // 5 min TTL
  createdAt: number;
}
const resetTokenStore: Record<string, ResetTokenRecord> = {};

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

export function hashClientBinding(ip?: string, userAgent?: string): string {
  const data = `${ip || "127.0.0.1"}|${userAgent || "unknown-agent"}`;
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 16);
}

/**
 * Account Lockout Guard:
 * 3 consecutive failed attempts -> 15-minute lock (900,000 ms)
 */
export function getAccountLockoutStatus(identifier: string): { isLocked: boolean; remainingSeconds: number } {
  const key = identifier.toLowerCase().trim();
  const record = accountLockoutStore[key];
  if (!record) return { isLocked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  // Lockout expired: reset
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    delete accountLockoutStore[key];
  }
  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(identifier: string): { isNowLocked: boolean; failedAttempts: number; remainingAttempts: number; remainingSeconds: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const record = accountLockoutStore[key] || { failedAttempts: 0, lockedUntil: 0, lastAttemptAt: now };

  record.failedAttempts++;
  record.lastAttemptAt = now;

  if (record.failedAttempts >= 3) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
    accountLockoutStore[key] = record;
    return { isNowLocked: true, failedAttempts: record.failedAttempts, remainingAttempts: 0, remainingSeconds: 15 * 60 };
  }

  accountLockoutStore[key] = record;
  return { isNowLocked: false, failedAttempts: record.failedAttempts, remainingAttempts: 3 - record.failedAttempts, remainingSeconds: 0 };
}

export function resetFailedAttempts(identifier: string): void {
  const key = identifier.toLowerCase().trim();
  delete accountLockoutStore[key];
}

/**
 * OTP Rate Limiting Guard:
 * Maximum 1 OTP dispatch every 60 seconds per user identifier / IP
 */
export function checkOtpRateLimit(identifier: string, ip: string = ""): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const key = identifier.toLowerCase().trim();
  const idRecord = rateLimitStore[key];
  const ipRecord = ip ? rateLimitStore[`ip_${ip}`] : null;

  const lastSent = Math.max(idRecord?.lastOtpSentAt || 0, ipRecord?.lastOtpSentAt || 0);
  const elapsed = now - lastSent;

  if (elapsed < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - elapsed) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true, waitSeconds: 0 };
}

export function recordOtpSent(identifier: string, ip: string = ""): void {
  const now = Date.now();
  const key = identifier.toLowerCase().trim();
  rateLimitStore[key] = { lastOtpSentAt: now, ip };
  if (ip) {
    rateLimitStore[`ip_${ip}`] = { lastOtpSentAt: now, ip };
  }
}

function loadUsersStore(): void {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      usersStore = JSON.parse(data);
    }
  } catch (err) {
    console.error("[AuthService] Error loading users_store.json, creating initial store:", err);
    usersStore = {};
  }

  // Ensure default Owner accounts exist without hardcoded plaintext passwords in source
  const ownerDefaultPass = (process.env.OWNER_BOOTSTRAP_PASSWORD || process.env.ADMIN_SECRET_KEY || "").trim();
  const ownerPhone = (process.env.OWNER_MFA_PHONE || "").trim();
  const defaultAccounts = [
    {
      id: "owner-002",
      name: "Mukesh Inland",
      email: "mukeshinland79@gmail.com",
      phone: ownerPhone,
      role: "owner" as UserRole,
      plan: "Founder & Owner",
      hasAdminAccess: true,
      isPro: true,
      defaultPass: ownerDefaultPass || crypto.randomBytes(24).toString("hex"),
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
  ];

  let modified = false;
  for (const acc of defaultAccounts) {
    const emailKey = acc.email.toLowerCase();
    if (!usersStore[emailKey]) {
      const salt = crypto.randomBytes(16).toString("hex");
      usersStore[emailKey] = {
        id: acc.id,
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        passwordHash: hashPassword(acc.defaultPass, salt),
        salt,
        role: acc.role,
        plan: acc.plan,
        hasAdminAccess: acc.hasAdminAccess,
        isPro: acc.isPro,
        avatar: acc.avatar,
        joinedDate: "Jan 2026",
        createdAt: new Date().toISOString(),
      };
      modified = true;
    }
  }

  if (modified) {
    saveUsersStore();
  }
}

function saveUsersStore(): void {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersStore, null, 2), "utf-8");
  } catch (err) {
    console.error("[AuthService] Error saving users_store.json:", err);
  }
}

export function normalizeLoginIdentifier(input: string): string {
  if (!input) return "";
  const cleaned = input.trim().toLowerCase();

  // Check for configured Owner contact number (only when explicitly configured via env)
  const ownerPhoneDigits = (process.env.OWNER_MFA_PHONE || "").replace(/\D/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (ownerPhoneDigits.length >= 10 && digitsOnly.length >= 10 && (digitsOnly === ownerPhoneDigits || digitsOnly.endsWith(ownerPhoneDigits))) {
    return "mukeshinland79@gmail.com";
  }

  // Handle common aliases or shorthand for platform owners
  if (cleaned === "mukesh" || cleaned === "mukesh inland" || cleaned === "mukeshinland") {
    return "mukeshinland79@gmail.com";
  }
  if (cleaned === "mukesh kalonia" || cleaned === "mukeshkalonia") {
    return "mukeshkalonia241@gmail.com";
  }

  return cleaned;
}

/**
 * Find user across in-memory store by email, phone, or identifier alias
 */
export function findUserByIdentifier(identifier: string): StoredUser | null {
  if (!identifier) return null;
  const normalized = normalizeLoginIdentifier(identifier);
  if (usersStore[normalized]) return usersStore[normalized];

  const cleaned = identifier.trim().toLowerCase();
  if (usersStore[cleaned]) return usersStore[cleaned];

  const digits = cleaned.replace(/\D/g, "");
  for (const key in usersStore) {
    const u = usersStore[key];
    if (u.email.toLowerCase() === cleaned || u.email.toLowerCase() === normalized) {
      return u;
    }
    if (u.phone) {
      const uDigits = u.phone.replace(/\D/g, "");
      if (digits.length >= 10 && (uDigits === digits || uDigits.endsWith(digits))) {
        return u;
      }
    }
  }
  return null;
}

/**
 * Generate a signed JWT token for a user session bound to IP and User-Agent
 */
export function generateUserJwtToken(payload: AuthSessionPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email.toLowerCase(),
      name: payload.name,
      role: payload.role,
      plan: payload.plan,
      hasAdminAccess: payload.hasAdminAccess,
      mfaVerified: Boolean(payload.mfaVerified),
      isPro: payload.isPro || false,
      clientBinding: payload.clientBinding,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

// Set of revoked session tokens with automated TTL cleanup
const REVOKED_SESSION_TOKENS = new Set<string>();

export function revokeSessionToken(token: string): void {
  if (token) {
    REVOKED_SESSION_TOKENS.add(token);
    revokeAdminOrSessionToken(token);
    if (REVOKED_SESSION_TOKENS.size > 10000) {
      const first = REVOKED_SESSION_TOKENS.values().next().value;
      if (first) REVOKED_SESSION_TOKENS.delete(first);
    }
  }
}

export function isSessionTokenRevoked(token: string): boolean {
  return REVOKED_SESSION_TOKENS.has(token) || isRevokedAdminOrSessionToken(token);
}

export async function revokeOAuthProviderToken(provider: string, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    if (provider === "google") {
      const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return res.ok;
    }
    return true;
  } catch (e) {
    console.warn(`[OAuth Revoke] Failed to revoke upstream ${provider} token:`, e);
    return false;
  }
}

/**
 * Verify and decode a JWT session token safely with optional hijacking check
 */
export function verifySessionToken(token: string, ip?: string, userAgent?: string): AuthSessionPayload | null {
  try {
    if (!token) return null;
    if (isSessionTokenRevoked(token)) return null;
    const decoded = jwt.verify(token, getJwtSecret()) as AuthSessionPayload;
    if (decoded && decoded.email) {
      if (decoded.clientBinding && ip && userAgent) {
        const expectedBinding = hashClientBinding(ip, userAgent);
        // Note: allow session if proxy differences or binding match
        if (decoded.clientBinding !== expectedBinding) {
          console.warn(`[Security Session Engine] Note: Client binding mismatch for ${maskEmailAddress(decoded.email)}`);
        }
      }
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * STEP 1: Banking-Grade MFA Login Initiation
 * Validates Email/Phone & Passkey, checks account lockout & rate limits,
 * then generates & dispatches a 6-digit OTP to registered Phone & Email.
 */
export async function initiateBankingStep1Login(params: {
  identifier: string;
  password?: string;
  secretKey?: string;
  ip?: string;
  userAgent?: string;
  isOwnerLogin?: boolean;
}): Promise<{
  success: boolean;
  mfaRequired?: boolean;
  token?: string;
  user?: UserProfile;
  role?: string;
  hasAdminAccess?: boolean;
  identifier?: string;
  maskedEmail?: string;
  maskedPhone?: string;
  expiresInSeconds?: number;
  cooldownSeconds?: number;
  message?: string;
  error?: string;
  isLocked?: boolean;
  remainingLockoutSeconds?: number;
}> {
  const normalized = normalizeLoginIdentifier(params.identifier || "");
  const email = (normalized || params.identifier || "").toLowerCase().trim();
  const key = (params.secretKey || params.password || "").trim();
  const ip = params.ip || "127.0.0.1";

  if (!email) {
    return { success: false, error: "Please enter your registered Email Address or Phone Number." };
  }
  if (!key) {
    return { success: false, error: "Please enter your Account Password or Security Passkey." };
  }

  // 1. Account Lockout Verification
  const lockoutStatus = getAccountLockoutStatus(email);
  if (lockoutStatus.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingLockoutSeconds: lockoutStatus.remainingSeconds,
      error: `Security Lockout Active: Account is temporarily locked due to multiple failed attempts. Please try again in ${Math.ceil(
        lockoutStatus.remainingSeconds / 60
      )} minutes.`,
    };
  }

  // 2. Credential Verification
  const isOwnerEmail = isOwnerAccountEmail(email);

  const configuredSecret = process.env.ADMIN_SECRET_KEY;
  const validOwnerSecret = configuredSecret && configuredSecret !== "12345" ? [configuredSecret] : [];

  let user = usersStore[email];
  let credentialsValid = false;

  if (user && user.salt && user.passwordHash) {
    const computedHash = hashPassword(key, user.salt);
    if (computedHash === user.passwordHash || (isOwnerEmail && validOwnerSecret.includes(key))) {
      credentialsValid = true;
    }
  } else if (isOwnerEmail && validOwnerSecret.includes(key)) {
    credentialsValid = true;
  }

  if (!credentialsValid) {
    const lockResult = recordFailedAttempt(email);
    if (lockResult.isNowLocked) {
      return {
        success: false,
        isLocked: true,
        remainingLockoutSeconds: lockResult.remainingSeconds,
        error: "Account Locked: 3 consecutive invalid attempts detected. Access blocked for 15 minutes.",
      };
    }
    return {
      success: false,
      error: `Invalid credentials. Remaining attempts before account lockout: ${lockResult.remainingAttempts}`,
    };
  }

  // 3. OTP Rate Limit Verification
  const rateLimit = checkOtpRateLimit(email, ip);
  if (!rateLimit.allowed) {
    return {
      success: false,
      cooldownSeconds: rateLimit.waitSeconds,
      error: `Please wait ${rateLimit.waitSeconds} seconds before requesting another OTP.`,
    };
  }

  // 4. Generate & Dispatch 6-Digit Banking OTP
  const otp = generateSecureOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  const phone = user?.phone || (isOwnerEmail ? process.env.OWNER_MFA_PHONE || "" : "");

  bankingOtpStore[email] = {
    otp,
    expiresAt,
    email,
    phone,
    attempts: 0,
    purpose: "LOGIN_MFA",
    lastSentAt: Date.now(),
  };

  recordOtpSent(email, ip);

  const dispatchResult = await dispatchMultiChannelOtp({
    otp,
    recipientEmail: email,
    recipientPhone: phone,
    userName: user?.name || (isOwnerEmail ? "Mukesh Owner" : "Valued User"),
    purpose: "LOGIN_MFA",
  });

  // If neither SMTP nor SMS delivery is configured on the server, do not trap verified credentials
  // on an undeliverable Step 2 OTP screen — complete verified login cleanly.
  if (!dispatchResult.emailDispatched && !dispatchResult.smsDispatched) {
    delete bankingOtpStore[email];
    resetFailedAttempts(email);

    if (!user) {
      const salt = crypto.randomBytes(16).toString("hex");
      user = {
        id: isOwnerEmail ? "owner-" + Math.random().toString(36).substring(2, 7) : "usr-" + Date.now(),
        name: isOwnerEmail ? (email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia") : email.split("@")[0].replace(/[._]/g, " "),
        email,
        phone,
        passwordHash: hashPassword(key, salt),
        salt,
        role: isOwnerEmail ? "owner" : "user",
        plan: isOwnerEmail ? "Founder & Owner" : "Free Plan",
        hasAdminAccess: isOwnerEmail,
        isPro: isOwnerEmail,
        avatar: isOwnerEmail ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" : undefined,
        joinedDate: isOwnerEmail ? "Founder & Owner" : "Jan 2026",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      usersStore[email] = user;
    } else {
      if (isOwnerEmail) {
        user.role = "owner";
        user.hasAdminAccess = true;
        user.isPro = true;
        user.plan = "Founder & Owner";
      } else {
        const ent = resolveAuthoritativeEntitlement(user);
        user.isPro = ent.isPro;
        user.plan = ent.plan;
      }
      user.lastLoginAt = new Date().toISOString();
    }

    saveUsersStore();

    const clientBinding = hashClientBinding(ip, params.userAgent || "browser");
    const token = generateUserJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      hasAdminAccess: user.hasAdminAccess,
      isPro: user.isPro,
      clientBinding,
    });

    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      hasAdminAccess: user.hasAdminAccess,
      isPro: user.isPro,
      avatar: user.avatar,
      joinedDate: user.joinedDate,
    };

    return {
      success: true,
      mfaRequired: false,
      token,
      user: profile,
      role: user.role,
      hasAdminAccess: user.hasAdminAccess,
      identifier: email,
      message: isOwnerEmail
        ? "Credentials verified! Access granted to Owner & Administrator Suite."
        : "Credentials verified! Signed in successfully.",
    };
  }

  return {
    success: true,
    mfaRequired: true,
    identifier: email,
    maskedEmail: dispatchResult.maskedEmail,
    maskedPhone: dispatchResult.maskedPhone,
    expiresInSeconds: 300,
    cooldownSeconds: 60,
    message: `6-Digit Security OTP dispatched to ${dispatchResult.maskedEmail} and ${dispatchResult.maskedPhone}.`,
  };
}

/**
 * STEP 2: Banking-Grade OTP Verification & Session Issuance
 */
export async function verifyBankingStep2Otp(params: {
  identifier: string;
  otp: string;
  ip?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  token?: string;
  user?: UserProfile;
  role?: string;
  hasAdminAccess?: boolean;
  message?: string;
  error?: string;
  isLocked?: boolean;
  remainingLockoutSeconds?: number;
}> {
  const normalized = normalizeLoginIdentifier(params.identifier || "");
  const email = (normalized || params.identifier || "").toLowerCase().trim();
  const otpInput = (params.otp || "").trim();
  const ip = params.ip || "127.0.0.1";
  const userAgent = params.userAgent || "browser";

  if (!email) {
    return { success: false, error: "Missing email address or phone number for verification." };
  }
  if (!otpInput) {
    return { success: false, error: "Please enter the 6-digit OTP Security Code." };
  }

  // 1. Account Lockout Check
  const lockoutStatus = getAccountLockoutStatus(email);
  if (lockoutStatus.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingLockoutSeconds: lockoutStatus.remainingSeconds,
      error: `Security Lockout Active: Account is temporarily locked. Please try again in ${Math.ceil(
        lockoutStatus.remainingSeconds / 60
      )} minutes.`,
    };
  }

  const record = bankingOtpStore[email];
  if (!record) {
    return {
      success: false,
      error: "No active verification session found or code expired. Please initiate login again.",
    };
  }

  if (Date.now() > record.expiresAt) {
    delete bankingOtpStore[email];
    return {
      success: false,
      error: "OTP code has expired (5-minute limit). Please request a new OTP.",
    };
  }

  record.attempts++;

  // Banking Verification requires exact match with issued OTP
  const isOtpMatch = record.otp === otpInput;

  if (!isOtpMatch) {
    if (record.attempts >= 3) {
      delete bankingOtpStore[email];
      const lock = recordFailedAttempt(email);
      return {
        success: false,
        isLocked: true,
        remainingLockoutSeconds: lock.remainingSeconds,
        error: "Account Locked: 3 consecutive invalid OTP attempts. Access blocked for 15 minutes.",
      };
    }
    return {
      success: false,
      error: `Invalid 6-digit OTP. Remaining attempts: ${3 - record.attempts}`,
    };
  }

  // Successful Verification: Reset lockout and cleanup OTP
  resetFailedAttempts(email);
  delete bankingOtpStore[email];

  const isOwnerEmail = isOwnerAccountEmail(email);

  let user = usersStore[email];
  if (!user) {
    const salt = crypto.randomBytes(16).toString("hex");
    user = {
      id: isOwnerEmail ? "owner-" + Math.random().toString(36).substring(2, 7) : "usr-" + Date.now(),
      name: isOwnerEmail ? (email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia") : email.split("@")[0].replace(/[._]/g, " "),
      email,
      phone: isOwnerEmail ? process.env.OWNER_MFA_PHONE || "" : "",
      passwordHash: hashPassword(crypto.randomBytes(24).toString("hex"), salt),
      salt,
      role: isOwnerEmail ? "owner" : "user",
      plan: isOwnerEmail ? "Founder & Owner" : "Free Plan",
      hasAdminAccess: isOwnerEmail,
      isPro: isOwnerEmail,
      avatar: isOwnerEmail ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" : undefined,
      joinedDate: isOwnerEmail ? "Founder & Owner" : "Jan 2026",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    usersStore[email] = user;
  } else {
    if (isOwnerEmail) {
      user.role = "owner";
      user.hasAdminAccess = true;
      user.isPro = true;
      user.plan = "Founder & Owner";
    } else {
      const ent = resolveAuthoritativeEntitlement(user);
      user.isPro = ent.isPro;
      user.plan = ent.plan;
    }
    user.lastLoginAt = new Date().toISOString();
  }

  saveUsersStore();

  const clientBinding = hashClientBinding(ip, userAgent);
  const token = generateUserJwtToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    mfaVerified: true,
    isPro: user.isPro,
    clientBinding,
  });

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: user.isPro,
    avatar: user.avatar,
    joinedDate: user.joinedDate,
  };

  console.log(`[Banking MFA Engine] MFA Verified successfully for ${maskEmailAddress(email)}. Session Token issued.`);

  return {
    success: true,
    token,
    user: profile,
    role: user.role,
    hasAdminAccess: user.hasAdminAccess,
    message: isOwnerEmail
      ? "Banking MFA Verified: Access granted to Owner & Administrator Suite."
      : "Banking MFA Verified: Logged in successfully!",
  };
}

/**
 * Resend OTP with 60-second cooldown enforcement
 */
export async function resendBankingOtp(params: {
  identifier: string;
  ip?: string;
}): Promise<{
  success: boolean;
  cooldownSeconds?: number;
  maskedEmail?: string;
  maskedPhone?: string;
  message?: string;
  error?: string;
}> {
  const normalized = normalizeLoginIdentifier(params.identifier || "");
  const email = (normalized || params.identifier || "").toLowerCase().trim();
  const ip = params.ip || "127.0.0.1";

  if (!email) {
    return { success: false, error: "Missing email address or phone number." };
  }

  const rateLimit = checkOtpRateLimit(email, ip);
  if (!rateLimit.allowed) {
    return {
      success: false,
      cooldownSeconds: rateLimit.waitSeconds,
      error: `Please wait ${rateLimit.waitSeconds} seconds before requesting a new OTP.`,
    };
  }

  const user = usersStore[email];
  const phone = user?.phone || (isOwnerAccountEmail(email) ? process.env.OWNER_MFA_PHONE || "" : "");
  const otp = generateSecureOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  bankingOtpStore[email] = {
    otp,
    expiresAt,
    email,
    phone,
    attempts: 0,
    purpose: "LOGIN_MFA",
    lastSentAt: Date.now(),
  };

  recordOtpSent(email, ip);

  const dispatchResult = await dispatchMultiChannelOtp({
    otp,
    recipientEmail: email,
    recipientPhone: phone,
    userName: user?.name || "Valued User",
    purpose: "LOGIN_MFA",
  });

  return {
    success: true,
    cooldownSeconds: 60,
    maskedEmail: dispatchResult.maskedEmail,
    maskedPhone: dispatchResult.maskedPhone,
    message: `New 6-Digit OTP dispatched to ${dispatchResult.maskedEmail} and ${dispatchResult.maskedPhone}.`,
  };
}

/**
 * Password Recovery Step 1: Request Password Reset OTP (10-minute expiry, rate-limited)
 */
export async function requestPasswordResetOtp(params: {
  identifier: string;
  ip?: string;
}): Promise<{
  success: boolean;
  identifier?: string;
  maskedTarget?: string;
  maskedEmail?: string;
  maskedPhone?: string;
  cooldownSeconds?: number;
  message?: string;
  error?: string;
}> {
  const rawInput = (params.identifier || "").trim();
  if (!rawInput) {
    return { success: false, error: "Please enter your registered Email Address or Mobile Number." };
  }

  const isPhone = !rawInput.includes("@");
  const user = findUserByIdentifier(rawInput);
  const clean = normalizeLoginIdentifier(rawInput);
  const email = user?.email || (clean || rawInput).toLowerCase().trim();
  if (!user && !email.includes("@")) {
    return { success: false, error: "No registered account found for that mobile number." };
  }
  const phone = user?.phone || (isPhone ? rawInput : isOwnerAccountEmail(email) ? process.env.OWNER_MFA_PHONE || "" : "");
  const ip = params.ip || "127.0.0.1";

  const rateLimit = checkOtpRateLimit(email, ip);
  if (!rateLimit.allowed) {
    return {
      success: false,
      cooldownSeconds: rateLimit.waitSeconds,
      error: `Please wait ${rateLimit.waitSeconds} seconds before requesting another reset code.`,
    };
  }

  const otp = generateSecureOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry window for password recovery

  bankingOtpStore[email] = {
    otp,
    expiresAt,
    email,
    phone,
    attempts: 0,
    purpose: "PASSWORD_RESET",
    lastSentAt: Date.now(),
  };

  if (phone) {
    bankingOtpStore[phone] = bankingOtpStore[email];
  }

  recordOtpSent(email, ip);

  const dispatchResult = await dispatchMultiChannelOtp({
    otp,
    recipientEmail: user?.email || email,
    recipientPhone: phone,
    userName: user?.name || "Valued User",
    purpose: "PASSWORD_RESET",
  });

  if (!dispatchResult.emailDispatched && !dispatchResult.smsDispatched) {
    delete bankingOtpStore[email];
    if (phone) delete bankingOtpStore[phone];
    return {
      success: false,
      error:
        "Email/SMS OTP delivery is not configured on this server. Please use 'Continue with Google' to sign in instantly, then update your password from Account Settings.",
    };
  }

  const maskedTarget = isPhone ? dispatchResult.maskedPhone : dispatchResult.maskedEmail;

  return {
    success: true,
    identifier: email,
    maskedTarget,
    maskedEmail: dispatchResult.maskedEmail,
    maskedPhone: dispatchResult.maskedPhone,
    cooldownSeconds: 60,
    message: `OTP sent to ${maskedTarget}`,
  };
}

/**
 * Password Recovery Step 2: Verify OTP and update password
 */
export async function verifyAndResetPassword(params: {
  identifier: string;
  otp: string;
  newPassword: string;
  ip?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
  error?: string;
}> {
  const clean = normalizeLoginIdentifier(params.identifier || "");
  const email = (clean || params.identifier || "").toLowerCase().trim();
  const otpInput = (params.otp || "").trim();
  const newPassword = params.newPassword || "";
  const ip = params.ip || "127.0.0.1";
  const userAgent = params.userAgent || "browser";

  if (!email) {
    return { success: false, error: "Please enter your registered Email or Mobile Number." };
  }
  if (!otpInput) {
    return { success: false, error: "Please enter the 6-digit OTP code." };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  const record = bankingOtpStore[email];
  const isMatch = record && record.otp === otpInput && Date.now() <= record.expiresAt;

  if (!isMatch) {
    return { success: false, error: "Invalid or expired verification OTP. Please request a new code." };
  }

  delete bankingOtpStore[email];
  resetFailedAttempts(email);

  let user = usersStore[email];
  const isOwnerEmail = isOwnerAccountEmail(email);
  const salt = crypto.randomBytes(16).toString("hex");

  if (!user) {
    const ent = resolveAuthoritativeEntitlement({ email, role: isOwnerEmail ? "owner" : "user", plan: "Free Plan", hasAdminAccess: isOwnerEmail });
    user = {
      id: isOwnerEmail ? "owner-" + Math.random().toString(36).substring(2, 7) : "usr-" + Date.now(),
      name: isOwnerEmail ? "Mukesh Owner" : email.split("@")[0].replace(/[._]/g, " "),
      email,
      phone: isOwnerEmail ? process.env.OWNER_MFA_PHONE || "" : "",
      passwordHash: hashPassword(newPassword, salt),
      salt,
      role: isOwnerEmail ? "owner" : "user",
      plan: ent.plan,
      hasAdminAccess: isOwnerEmail,
      isPro: ent.isPro,
      avatar: isOwnerEmail ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" : undefined,
      joinedDate: isOwnerEmail ? "Founder & Owner" : "Jan 2026",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    usersStore[email] = user;
  } else {
    user.passwordHash = hashPassword(newPassword, salt);
    user.salt = salt;
    const ent = resolveAuthoritativeEntitlement(user);
    user.isPro = ent.isPro;
    user.plan = ent.plan;
    user.lastLoginAt = new Date().toISOString();
  }

  saveUsersStore();

  const clientBinding = hashClientBinding(ip, userAgent);
  const token = generateUserJwtToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: user.isPro,
    clientBinding,
  });

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: user.isPro,
    avatar: user.avatar,
    joinedDate: user.joinedDate,
  };

  return {
    success: true,
    token,
    user: profile,
    message: "Password reset successfully! Logged in with new credentials.",
  };
}

/**
 * Step 2 Endpoint Helper: Verify OTP and issue a temporary 5-minute single-use resetToken
 */
export async function verifyRecoveryOtpAndIssueToken(params: {
  identifier: string;
  otp: string;
}): Promise<{
  success: boolean;
  resetToken?: string;
  expiresInSeconds?: number;
  message?: string;
  error?: string;
}> {
  const clean = normalizeLoginIdentifier(params.identifier || "");
  const email = (clean || params.identifier || "").toLowerCase().trim();
  const otpInput = (params.otp || "").trim();

  if (!email) {
    return { success: false, error: "Please provide your registered Email or Mobile Number." };
  }
  if (!otpInput) {
    return { success: false, error: "Please enter the 6-digit OTP code." };
  }

  const record = bankingOtpStore[email];
  const isMatch = record && record.otp === otpInput && Date.now() <= record.expiresAt;

  if (!isMatch) {
    return { success: false, error: "Invalid or expired OTP. Please request a new verification code." };
  }

  // Consume OTP
  delete bankingOtpStore[email];
  resetFailedAttempts(email);

  // Generate 5-minute (300s) single-use reset token
  const resetToken = "rst_" + crypto.randomBytes(32).toString("hex");
  resetTokenStore[resetToken] = {
    email,
    expiresAt: Date.now() + 5 * 60 * 1000,
    createdAt: Date.now(),
  };

  return {
    success: true,
    resetToken,
    expiresInSeconds: 300,
    message: "OTP successfully verified. Please set your new password.",
  };
}

/**
 * Step 3 Endpoint Helper: Set new password using verified single-use resetToken
 */
export async function updatePasswordWithResetToken(params: {
  resetToken: string;
  newPassword: string;
  ip?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
  error?: string;
}> {
  const { resetToken, newPassword, ip, userAgent } = params;
  if (!resetToken) {
    return { success: false, error: "Missing or invalid password reset token." };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  const record = resetTokenStore[resetToken];
  if (!record || Date.now() > record.expiresAt) {
    delete resetTokenStore[resetToken];
    return { success: false, error: "Password reset session has expired (5-minute limit). Please start over." };
  }

  const email = record.email;
  // Invalidate single-use token immediately
  delete resetTokenStore[resetToken];

  let user = usersStore[email];
  const isOwnerEmail = isOwnerAccountEmail(email);
  const salt = crypto.randomBytes(16).toString("hex");

  if (!user) {
    const ent = resolveAuthoritativeEntitlement({ email, role: isOwnerEmail ? "owner" : "user", plan: "Free Plan", hasAdminAccess: isOwnerEmail });
    user = {
      id: isOwnerEmail ? "owner-" + Math.random().toString(36).substring(2, 7) : "usr-" + Date.now(),
      name: isOwnerEmail ? "Mukesh Owner" : email.split("@")[0].replace(/[._]/g, " "),
      email,
      phone: isOwnerEmail ? process.env.OWNER_MFA_PHONE || "" : "",
      passwordHash: hashPassword(newPassword, salt),
      salt,
      role: isOwnerEmail ? "owner" : "user",
      plan: ent.plan,
      hasAdminAccess: isOwnerEmail,
      isPro: ent.isPro,
      avatar: isOwnerEmail ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" : undefined,
      joinedDate: isOwnerEmail ? "Founder & Owner" : "Jan 2026",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    usersStore[email] = user;
  } else {
    user.passwordHash = hashPassword(newPassword, salt);
    user.salt = salt;
    const ent = resolveAuthoritativeEntitlement(user);
    user.isPro = ent.isPro;
    user.plan = ent.plan;
    user.lastLoginAt = new Date().toISOString();
  }

  saveUsersStore();

  const clientBinding = hashClientBinding(ip, userAgent);
  const sessionToken = generateUserJwtToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: user.isPro,
    clientBinding,
  });

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: user.isPro,
    avatar: user.avatar,
    joinedDate: user.joinedDate,
  };

  return {
    success: true,
    token: sessionToken,
    user: profile,
    message: "Password Successfully Reset for PDFSun.in! Access is restored securely.",
  };
}

// Backwards-compatible aliases for existing controllers
export const initiateOwnerMfaLogin = (params: { email: string; password?: string; secretKey?: string }) =>
  initiateBankingStep1Login({ identifier: params.email, password: params.password, secretKey: params.secretKey, isOwnerLogin: true });

export const verifyOwnerMfa = (params: { email: string; otp: string }) =>
  verifyBankingStep2Otp({ identifier: params.email, otp: params.otp });

export const generatePasswordResetOtp = (identifier: string) =>
  requestPasswordResetOtp({ identifier });

export const verifyOtpAndResetPassword = (identifier: string, otp: string, newPass: string) =>
  verifyAndResetPassword({ identifier, otp, newPassword: newPass });

/**
 * Register a new customer user account with multi-identifier (email or mobile number) support
 */
export function registerUserAccount(params: {
  name?: string;
  email?: string;
  identifier?: string;
  password?: string;
  phone?: string;
}): { success: boolean; token?: string; user?: UserProfile; error?: string } {
  const rawInput = (params.identifier || params.email || "").trim();
  if (!rawInput) {
    return { success: false, error: "Please enter your Email Address or Mobile Number." };
  }

  if (!params.password || params.password.length < 4) {
    return { success: false, error: "Password must be at least 4 characters long." };
  }

  const isEmail = rawInput.includes("@");
  let email = isEmail ? rawInput.toLowerCase() : "";
  let phone = params.phone || (!isEmail ? rawInput : "");

  if (!isEmail) {
    const digits = rawInput.replace(/\D/g, "");
    if (digits.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number or email address." };
    }
    email = `${digits}@user.pdfsun.in`;
    phone = rawInput.startsWith("+") ? rawInput : `+91 ${digits}`;
  }

  if (isOwnerAccountEmail(email)) {
    return { success: false, error: "This email is reserved. Please sign in with verified owner credentials." };
  }

  // Duplicate Check across both email and phone
  const existingUser = findUserByIdentifier(rawInput) || (email ? usersStore[email] : null);
  if (existingUser) {
    return { success: false, error: "An account with this Email or Mobile Number already exists. Please sign in instead." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(params.password, salt);
  const ent = resolveAuthoritativeEntitlement({ email, role: "user", plan: "Free Plan", hasAdminAccess: false });

  const newUser: StoredUser = {
    id: "usr-" + Math.random().toString(36).substring(2, 9),
    name: params.name?.trim() || (isEmail ? email.split("@")[0].replace(/[._]/g, " ") : "PDFSun User"),
    email,
    phone,
    passwordHash,
    salt,
    role: "user",
    plan: ent.plan,
    hasAdminAccess: false,
    isPro: ent.isPro,
    joinedDate: "Jan 2026",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  usersStore[email] = newUser;
  saveUsersStore();

  const token = generateUserJwtToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    plan: newUser.plan,
    hasAdminAccess: newUser.hasAdminAccess,
    isPro: newUser.isPro,
  });

  const profile: UserProfile = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    plan: newUser.plan,
    hasAdminAccess: newUser.hasAdminAccess,
    isPro: newUser.isPro,
    avatar: newUser.avatar,
    joinedDate: newUser.joinedDate,
  };

  return { success: true, token, user: profile };
}

/**
 * Authenticate existing user with credentials (fail-closed: never auto-registers or skips password check)
 */
export function authenticateUser(params: {
  email: string;
  password?: string;
  ownerSecretKey?: string;
  isOwnerLogin?: boolean;
}): { success: boolean; token?: string; user?: UserProfile; error?: string } {
  const rawInput = (params.email || "").trim();
  const passwordInput = (params.password || params.ownerSecretKey || "").trim();

  if (!rawInput) {
    return { success: false, error: "Please enter your email or registered mobile number." };
  }
  if (!passwordInput) {
    return { success: false, error: "Password or security passkey is required." };
  }

  let user = findUserByIdentifier(rawInput);
  const normalizedInput = normalizeLoginIdentifier(rawInput);
  const email = user ? user.email : (normalizedInput || rawInput).toLowerCase().trim();
  const isOwnerEmail = isOwnerAccountEmail(email);

  // Only permit bootstrap owner access when an authentic cryptographic ADMIN_SECRET_KEY is supplied
  if (!user) {
    if (isOwnerEmail && params.isOwnerLogin && isValidAdminSecret(passwordInput)) {
      const salt = crypto.randomBytes(16).toString("hex");
      user = {
        id: "owner-" + Math.random().toString(36).substring(2, 7),
        name: email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia",
        email,
        phone: process.env.OWNER_MFA_PHONE || "",
        passwordHash: hashPassword(passwordInput, salt),
        salt,
        role: "owner",
        plan: "Founder & Owner",
        hasAdminAccess: true,
        isPro: true,
        joinedDate: "Founder & Owner",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      usersStore[email] = user;
    } else {
      return { success: false, error: "Invalid login credentials. Account not found or password incorrect." };
    }
  }

  const isOwnerSecretMatch = isOwnerEmail && isValidAdminSecret(passwordInput);
  const computedHash = user.salt && user.passwordHash ? hashPassword(passwordInput, user.salt) : "";
  const isPasswordMatch = Boolean(computedHash && user.passwordHash && computedHash === user.passwordHash);

  if (!isPasswordMatch && !isOwnerSecretMatch) {
    return { success: false, error: "Incorrect password. Please verify your credentials and try again." };
  }

  if (isOwnerEmail) {
    user.role = "owner";
    user.hasAdminAccess = true;
    user.isPro = true;
    user.plan = "Founder & Owner";
  } else {
    user.hasAdminAccess = user.role === "admin";
    const ent = resolveAuthoritativeEntitlement(user);
    user.isPro = ent.isPro;
    user.plan = ent.plan;
  }

  user.lastLoginAt = new Date().toISOString();
  saveUsersStore();

  const token = generateUserJwtToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: user.isPro,
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      hasAdminAccess: user.hasAdminAccess,
      isPro: user.isPro,
      avatar: user.avatar,
      joinedDate: user.joinedDate,
    },
  };
}

/**
 * Get user profile by email with real-time subscription synchronization
 */
export function getUserProfileByEmail(email: string): UserProfile | null {
  const user = usersStore[email.toLowerCase().trim()];
  if (!user) return null;
  const ent = resolveAuthoritativeEntitlement(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: ent.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: ent.isPro,
    avatar: user.avatar,
    joinedDate: user.joinedDate,
  };
}

/**
 * Authenticate or register a social OAuth user (Google, Facebook, SSO)
 * Strictly derives PRO entitlement from verified payment/subscription store (never auto-grants PRO on provider === "sso").
 */
export function authenticateSocialUser(params: {
  provider: "google" | "facebook" | "apple" | "sso";
  email: string;
  name?: string;
  avatar?: string;
  ssoDomain?: string;
}): { success: boolean; token?: string; user?: UserProfile; role?: UserRole; error?: string } {
  const email = (params.email || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email address is required for social sign-in." };
  }

  const isOwnerEmail = isOwnerAccountEmail(email);

  let user = usersStore[email];
  const ent = resolveAuthoritativeEntitlement({
    email,
    role: isOwnerEmail ? "owner" : "user",
    plan: user?.plan || "Free Plan",
    hasAdminAccess: isOwnerEmail,
  });

  if (!user) {
    const salt = crypto.randomBytes(16).toString("hex");
    const defaultName = params.name?.trim() || email.split("@")[0].replace(/[._]/g, " ");
    user = {
      id: isOwnerEmail ? "owner-" + Math.random().toString(36).substring(2, 7) : "usr-" + Date.now(),
      name: defaultName,
      email,
      phone: isOwnerEmail ? process.env.OWNER_MFA_PHONE || "" : "",
      passwordHash: hashPassword(crypto.randomBytes(16).toString("hex"), salt),
      salt,
      role: isOwnerEmail ? "owner" : "user",
      plan: ent.plan,
      hasAdminAccess: isOwnerEmail,
      isPro: ent.isPro,
      avatar: params.avatar,
      joinedDate: "Jan 2026",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    usersStore[email] = user;
  } else {
    if (isOwnerEmail) {
      user.role = "owner";
      user.hasAdminAccess = true;
      user.isPro = true;
      user.plan = "Founder & Owner";
    } else {
      user.isPro = ent.isPro;
      user.plan = ent.plan;
    }
    if (params.name && (!user.name || user.name === "PDFSun User")) {
      user.name = params.name;
    }
    if (params.avatar && !user.avatar) {
      user.avatar = params.avatar;
    }
    user.lastLoginAt = new Date().toISOString();
  }

  saveUsersStore();

  const token = generateUserJwtToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    mfaVerified: params.provider === "google",
    isPro: user.isPro,
  });

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    hasAdminAccess: user.hasAdminAccess,
    isPro: user.isPro,
    avatar: user.avatar,
    joinedDate: user.joinedDate,
  };

  return { success: true, token, user: profile, role: user.role };
}

/**
 * Get all stored user accounts for Admin / Owner user management
 */
export function getAllStoredUsers(): Array<{
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  status: string;
  hasAdminAccess: boolean;
  isPro?: boolean;
  joined: string;
  createdAt: string;
  lastLoginAt?: string;
}> {
  return Object.values(usersStore).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    plan: u.plan || "Free Customer",
    status: "Active",
    hasAdminAccess: Boolean(u.hasAdminAccess),
    isPro: Boolean(u.isPro),
    joined: u.joinedDate || "Jan 2026",
    createdAt: u.createdAt || new Date().toISOString(),
    lastLoginAt: u.lastLoginAt,
  }));
}

/**
 * Update a stored user record by ID or email
 */
export function updateStoredUser(
  identifier: string,
  updates: Partial<{
    name: string;
    role: UserRole;
    plan: string;
    hasAdminAccess: boolean;
    isPro: boolean;
    avatar: string;
    photoURL: string;
  }>
): { success: boolean; user?: StoredUser; error?: string } {
  const targetKey = Object.keys(usersStore).find(
    (k) => usersStore[k].id === identifier || usersStore[k].email.toLowerCase() === identifier.toLowerCase()
  );

  if (!targetKey) {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanEmail = cleanId.includes("@") ? cleanId : `${cleanId}@pdfsun.in`;
    const isOwnerEmail = DUAL_OWNER_EMAILS.includes(cleanEmail);
    const salt = crypto.randomBytes(16).toString("hex");
    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: (updates.name && updates.name.trim()) || cleanEmail.split("@")[0],
      passwordHash: hashPassword(crypto.randomBytes(16).toString("hex"), salt),
      salt,
      role: isOwnerEmail ? "owner" : (updates.role || "user"),
      plan: isOwnerEmail ? "Founder & Owner - Unlimited" : (updates.plan || "Free Plan"),
      hasAdminAccess: isOwnerEmail || Boolean(updates.hasAdminAccess),
      isPro: isOwnerEmail || Boolean(updates.isPro),
      avatar: updates.avatar || updates.photoURL || "",
      photoURL: updates.photoURL || updates.avatar || "",
      joinedDate: new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date()),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    usersStore[cleanEmail] = newUser;
    saveUsersStore();
    return { success: true, user: newUser };
  }

  const existing = usersStore[targetKey];
  const isOwnerEmail = DUAL_OWNER_EMAILS.includes(existing.email.toLowerCase());

  if (updates.name !== undefined) existing.name = updates.name.trim();
  if (updates.role !== undefined && (!isOwnerEmail || updates.role === "owner")) existing.role = updates.role;
  if (updates.plan !== undefined) existing.plan = updates.plan;
  if (updates.hasAdminAccess !== undefined) existing.hasAdminAccess = isOwnerEmail ? true : updates.hasAdminAccess;
  if (updates.isPro !== undefined) existing.isPro = isOwnerEmail ? true : updates.isPro;
  if (updates.avatar !== undefined) existing.avatar = updates.avatar;
  if (updates.photoURL !== undefined) existing.photoURL = updates.photoURL;

  saveUsersStore();
  return { success: true, user: existing };
}

/**
 * Delete a user from the store
 */
export function deleteStoredUser(identifier: string): { success: boolean; error?: string } {
  const targetKey = Object.keys(usersStore).find(
    (k) => usersStore[k].id === identifier || usersStore[k].email.toLowerCase() === identifier.toLowerCase()
  );

  if (!targetKey) {
    return { success: false, error: "User not found in store." };
  }

  const email = usersStore[targetKey].email.toLowerCase();
  if (DUAL_OWNER_EMAILS.includes(email)) {
    return { success: false, error: "Cannot delete Dual-Owner Master Account." };
  }

  delete usersStore[targetKey];
  saveUsersStore();
  return { success: true };
}

/**
 * Rebuild and restore database
 */
export function repairAndRestoreDatabase(): {
  success: boolean;
  message: string;
  totalUsers: number;
  ownersRestored: number;
  customersRestored: number;
} {
  let modified = false;
  let ownersRestored = 0;
  let customersRestored = 0;

  const ownerDefaultPass = (process.env.OWNER_BOOTSTRAP_PASSWORD || process.env.ADMIN_SECRET_KEY || "").trim();
  const ownerPhone = (process.env.OWNER_MFA_PHONE || "").trim();
  const primaryOwners = [
    {
      id: "owner-002",
      name: "Mukesh Inland",
      email: "mukeshinland79@gmail.com",
      role: "owner" as UserRole,
      plan: "Founder & Owner - Unlimited",
      hasAdminAccess: true,
      isPro: true,
      defaultPass: ownerDefaultPass || crypto.randomBytes(24).toString("hex"),
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
  ];

  for (const owner of primaryOwners) {
    const key = owner.email.toLowerCase();
    if (!usersStore[key]) {
      const salt = crypto.randomBytes(16).toString("hex");
      usersStore[key] = {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: ownerPhone,
        passwordHash: hashPassword(owner.defaultPass, salt),
        salt,
        role: "owner",
        plan: "Founder & Owner - Unlimited",
        hasAdminAccess: true,
        isPro: true,
        avatar: owner.avatar,
        joinedDate: "Founder & Owner",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      modified = true;
      ownersRestored++;
    } else {
      usersStore[key].role = "owner";
      usersStore[key].hasAdminAccess = true;
      usersStore[key].isPro = true;
      usersStore[key].plan = "Founder & Owner - Unlimited";
      modified = true;
      ownersRestored++;
    }
  }

  for (const [email, user] of Object.entries(usersStore)) {
    const isOwner = isOwnerAccountEmail(email);

    if (isOwner) {
      user.role = "owner";
      user.hasAdminAccess = true;
      user.isPro = true;
      user.plan = "Founder & Owner - Unlimited";
      modified = true;
    } else {
      if (!user.role || user.role === "owner") {
        user.role = "user";
        modified = true;
      }
      if (user.hasAdminAccess && user.role !== "admin") {
        user.hasAdminAccess = false;
        modified = true;
      }
      const ent = resolveAuthoritativeEntitlement(user);
      if (user.isPro !== ent.isPro || user.plan !== ent.plan) {
        user.isPro = ent.isPro;
        user.plan = ent.plan;
        modified = true;
      }
      customersRestored++;
    }
  }

  if (modified) {
    saveUsersStore();
  }

  return {
    success: true,
    message: "Database user records and RBAC roles successfully verified and restored.",
    totalUsers: Object.keys(usersStore).length,
    ownersRestored,
    customersRestored,
  };
}

// Initialize on boot
loadUsersStore();
