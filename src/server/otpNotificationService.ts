import crypto from "crypto";
import nodemailer from "nodemailer";

export type OtpDeliveryErrorCode =
  | "NO_DELIVERY_PROVIDER_CONFIGURED"
  | "INVALID_RECIPIENT_EMAIL"
  | "SMTP_AUTH_FAILED"
  | "SMTP_CONNECTION_ERROR"
  | "PROVIDER_REJECTED"
  | "SMS_DELIVERY_FAILED";

export interface OtpDispatchResult {
  emailDispatched: boolean;
  smsDispatched: boolean;
  deliveryVerified: boolean;
  maskedEmail: string;
  maskedPhone: string;
  channelLog: string[];
  providerName?: "smtp" | "resend" | "sendgrid" | "twilio" | "none";
  providerMessageId?: string;
  acceptedCount?: number;
  rejectedCount?: number;
  errorCode?: OtpDeliveryErrorCode;
  deliveryError?: string;
}

export interface SmtpTransportLike {
  verify?: () => Promise<unknown>;
  sendMail: (mailOptions: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }) => Promise<{
    messageId?: string;
    accepted?: unknown[];
    rejected?: unknown[];
    response?: string;
  }>;
}

/**
 * Mask sensitive email addresses (e.g., mukeshinland79@gmail.com -> m***9@gmail.com)
 */
export function maskEmailAddress(email: string): string {
  if (!email || !email.includes("@")) return "••••••••";
  const [user, domain] = email.trim().toLowerCase().split("@");
  if (user.length <= 2) {
    return `${user.charAt(0)}***@${domain}`;
  }
  const first = user.charAt(0);
  const last = user.charAt(user.length - 1);
  return `${first}***${last}@${domain}`;
}

/**
 * Mask sensitive phone numbers (e.g., 5550123456 -> 5550****56)
 */
export function maskPhoneNumber(phone: string = ""): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const start = digits.slice(-10, -6);
    const end = digits.slice(-2);
    return `${start}****${end}`;
  }
  return "••••••••";
}

/**
 * Mask any user identifier (Email or Mobile Number)
 */
export function maskUserIdentifier(identifier: string): string {
  if (!identifier) return "••••••••";
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return maskEmailAddress(trimmed);
  }
  return maskPhoneNumber(trimmed);
}

/**
 * Validate standard email address format
 */
export function isValidRecipientEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

/**
 * Redact any secrets, credentials, OTPs, or full email addresses before logging
 */
function sanitizeProviderDiagnostic(raw: unknown, sensitiveStrings: string[] = []): string {
  let msg = typeof raw === "string" ? raw : raw instanceof Error ? raw.message : String(raw || "Unknown provider error");
  for (const secret of sensitiveStrings) {
    if (secret && secret.trim().length > 2) {
      msg = msg.split(secret).join("[REDACTED]");
    }
  }
  msg = msg.replace(/\b\d{6}\b/g, "[OTP_REDACTED]");
  msg = msg.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL_REDACTED]");
  return msg.slice(0, 240);
}

function classifySmtpFailure(err: any): { errorCode: OtpDeliveryErrorCode; deliveryError: string } {
  const code = String(err?.code || "").toUpperCase();
  const responseCode = Number(err?.responseCode || 0);
  const message = String(err?.message || "").toLowerCase();

  if (
    code === "EAUTH" ||
    responseCode === 535 ||
    responseCode === 534 ||
    message.includes("invalid login") ||
    message.includes("username and password not accepted") ||
    message.includes("authentication failed")
  ) {
    return {
      errorCode: "SMTP_AUTH_FAILED",
      deliveryError: "Email delivery unavailable: mail provider authentication failed.",
    };
  }

  return {
    errorCode: "SMTP_CONNECTION_ERROR",
    deliveryError: "Email delivery unavailable: could not connect to the mail provider.",
  };
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Dispatches 6-digit OTP to configured Email & SMS channels and verifies real provider acceptance.
 */
export async function dispatchMultiChannelOtp(params: {
  otp: string;
  recipientEmail: string;
  recipientPhone?: string;
  userName?: string;
  purpose?: "LOGIN_MFA" | "PASSWORD_RESET" | "ACCOUNT_SECURITY";
  _smtpTransportOverride?: SmtpTransportLike;
}): Promise<OtpDispatchResult> {
  const {
    otp,
    recipientEmail,
    recipientPhone = "",
    userName = "Valued User",
    purpose = "LOGIN_MFA",
    _smtpTransportOverride,
  } = params;

  const cleanRecipientEmail = (recipientEmail || "").trim().toLowerCase();
  const maskedEmail = maskEmailAddress(cleanRecipientEmail);
  const maskedPhone = maskPhoneNumber(recipientPhone);
  const channelLog: string[] = [];

  let emailDispatched = false;
  let smsDispatched = false;
  let providerName: OtpDispatchResult["providerName"] = "none";
  let providerMessageId: string | undefined;
  let acceptedCount: number | undefined;
  let rejectedCount: number | undefined;
  let errorCode: OtpDeliveryErrorCode | undefined;
  let deliveryError: string | undefined;

  const purposeTitle =
    purpose === "LOGIN_MFA"
      ? "Owner & Admin Suite Login Verification"
      : purpose === "PASSWORD_RESET"
      ? "Account Password Reset Verification"
      : "Multi-Factor Security Authentication";

  const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">PDFSun Security Portal</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Banking-Grade Multi-Factor Authentication</p>
            </div>
            <div style="padding: 24px;">
              <p style="font-size: 14px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; color: #475569;">
                Your one-time security code for <strong>${purposeTitle}</strong> is:
              </p>
              <div style="background: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e1;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace;">${otp}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                This security OTP is valid for <strong>${purpose === "PASSWORD_RESET" ? "10 minutes" : "5 minutes"}</strong>. If you did not request this verification code, please ignore this email or lock your account immediately.
              </p>
            </div>
            <div style="background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center;">
              Protected by PDFSun Zero-Trust Security Engine &copy; 2026
            </div>
          </div>
        </div>
      `;

  const emailSubject = `[PDFSun Security] Your 6-Digit OTP (${purposeTitle})`;

  // 1. Email OTP Dispatch with strict provider acceptance checks
  if (!isValidRecipientEmail(cleanRecipientEmail)) {
    errorCode = "INVALID_RECIPIENT_EMAIL";
    deliveryError = "Email delivery unavailable: resolved recipient email address is invalid.";
    channelLog.push("Invalid recipient email format; email delivery skipped.");
  } else {
    const smtpHost = (process.env.SMTP_HOST || "").trim();
    const smtpUser = (process.env.SMTP_USER || "").trim();
    const smtpPass = process.env.SMTP_PASS || "";
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
    const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
    const sendgridApiKey = (process.env.SENDGRID_API_KEY || "").trim();
    const defaultFrom = smtpUser ? `"PDFSun Security" <${smtpUser}>` : `"PDFSun Security" <security@pdfsun.in>`;
    const fromHeader = (process.env.SMTP_FROM || "").trim() || defaultFrom;

    if (_smtpTransportOverride || (smtpHost && smtpUser && smtpPass)) {
      try {
        const transporter: SmtpTransportLike =
          _smtpTransportOverride ||
          nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            requireTLS: !smtpSecure && smtpPort === 587,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

        if (typeof transporter.verify === "function") {
          await transporter.verify();
        }

        const info = await transporter.sendMail({
          from: fromHeader,
          to: cleanRecipientEmail,
          subject: emailSubject,
          html: htmlBody,
        });

        const accepted = Array.isArray(info?.accepted) ? info.accepted.map((v) => String(v).toLowerCase()) : [];
        const rejected = Array.isArray(info?.rejected) ? info.rejected.map((v) => String(v).toLowerCase()) : [];
        const recipientAccepted = accepted.some((addr) => addr.includes(cleanRecipientEmail));
        const recipientRejected = rejected.some((addr) => addr.includes(cleanRecipientEmail));

        acceptedCount = accepted.length;
        rejectedCount = rejected.length;

        if (accepted.length > 0 && (recipientAccepted || !recipientRejected) && Boolean(info?.messageId)) {
          emailDispatched = true;
          providerName = "smtp";
          providerMessageId = String(info.messageId);
          channelLog.push(`Email accepted by SMTP provider for ${maskedEmail}`);
        } else {
          errorCode = "PROVIDER_REJECTED";
          deliveryError = "Email delivery unavailable: recipient was rejected by the mail provider.";
          channelLog.push(`SMTP provider rejected recipient ${maskedEmail}`);
        }
      } catch (err: any) {
        const classified = classifySmtpFailure(err);
        errorCode = classified.errorCode;
        deliveryError = classified.deliveryError;
        const safeErr = sanitizeProviderDiagnostic(err, [otp, smtpPass, smtpUser, cleanRecipientEmail]);
        console.warn(`[OTP Dispatch] SMTP failure (${classified.errorCode}) for ${maskedEmail}: ${safeErr}`);
        channelLog.push(`Email delivery failed (${classified.errorCode}) for ${maskedEmail}`);
      }
    }

    // Optional HTTPS transactional fallback (Resend) when SMTP is unavailable/not configured
    if (!emailDispatched && !_smtpTransportOverride && resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromHeader,
            to: [cleanRecipientEmail],
            subject: emailSubject,
            html: htmlBody,
          }),
        });
        if (res.ok) {
          const data: any = await res.json().catch(() => ({}));
          if (data?.id) {
            emailDispatched = true;
            providerName = "resend";
            providerMessageId = String(data.id);
            acceptedCount = 1;
            rejectedCount = 0;
            errorCode = undefined;
            deliveryError = undefined;
            channelLog.push(`Email accepted by Resend API for ${maskedEmail}`);
          } else {
            errorCode = "PROVIDER_REJECTED";
            deliveryError = "Email delivery unavailable: provider did not return acceptance ID.";
          }
        } else {
          errorCode = res.status === 401 || res.status === 403 ? "SMTP_AUTH_FAILED" : "PROVIDER_REJECTED";
          deliveryError = "Email delivery unavailable: transactional email provider rejected request.";
          channelLog.push(`Resend HTTP ${res.status} for ${maskedEmail}`);
        }
      } catch (err: any) {
        const safeErr = sanitizeProviderDiagnostic(err, [otp, resendApiKey, cleanRecipientEmail]);
        console.warn(`[OTP Dispatch] Resend failure for ${maskedEmail}: ${safeErr}`);
        errorCode = errorCode || "SMTP_CONNECTION_ERROR";
        deliveryError = deliveryError || "Email delivery unavailable: could not reach transactional email provider.";
      }
    }

    // Optional HTTPS transactional fallback (SendGrid)
    if (!emailDispatched && !_smtpTransportOverride && sendgridApiKey) {
      try {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sendgridApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: cleanRecipientEmail }] }],
            from: { email: smtpUser || "security@pdfsun.in", name: "PDFSun Security" },
            subject: emailSubject,
            content: [{ type: "text/html", value: htmlBody }],
          }),
        });
        if (res.ok || res.status === 202) {
          const msgId = res.headers.get("x-message-id") || `sg-${Date.now()}`;
          emailDispatched = true;
          providerName = "sendgrid";
          providerMessageId = msgId;
          acceptedCount = 1;
          rejectedCount = 0;
          errorCode = undefined;
          deliveryError = undefined;
          channelLog.push(`Email accepted by SendGrid API for ${maskedEmail}`);
        } else {
          errorCode = res.status === 401 || res.status === 403 ? "SMTP_AUTH_FAILED" : "PROVIDER_REJECTED";
          deliveryError = "Email delivery unavailable: transactional email provider rejected request.";
          channelLog.push(`SendGrid HTTP ${res.status} for ${maskedEmail}`);
        }
      } catch (err: any) {
        const safeErr = sanitizeProviderDiagnostic(err, [otp, sendgridApiKey, cleanRecipientEmail]);
        console.warn(`[OTP Dispatch] SendGrid failure for ${maskedEmail}: ${safeErr}`);
        errorCode = errorCode || "SMTP_CONNECTION_ERROR";
        deliveryError = deliveryError || "Email delivery unavailable: could not reach transactional email provider.";
      }
    }

    if (!emailDispatched && !errorCode) {
      errorCode = "NO_DELIVERY_PROVIDER_CONFIGURED";
      deliveryError = "Email delivery unavailable: no mail delivery provider is configured.";
      channelLog.push(`No email provider configured for ${maskedEmail}`);
    }
  }

  // 2. SMS OTP Dispatch (Twilio — optional secondary channel)
  try {
    const twilioSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const twilioToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || "").trim();

    if (!_smtpTransportOverride && twilioSid && twilioToken && twilioFrom && recipientPhone) {
      const authHeader = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const cleanPhone = recipientPhone.startsWith("+") ? recipientPhone : `+91${recipientPhone.replace(/\D/g, "")}`;

      const smsBody = `PDFSun Security: Your 6-digit verification code is ${otp}. Valid for 5 minutes. Do not share this OTP.`;

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: cleanPhone,
          From: twilioFrom,
          Body: smsBody,
        }),
      });

      if (response.ok) {
        smsDispatched = true;
        if (providerName === "none") providerName = "twilio";
        channelLog.push(`SMS accepted by Twilio Gateway for ${maskedPhone}`);
      } else {
        channelLog.push(`SMS gateway HTTP ${response.status} for mobile ${maskedPhone}`);
      }
    } else {
      channelLog.push(`SMS gateway not configured for mobile ${maskedPhone}`);
    }
  } catch (err: any) {
    const safeErr = sanitizeProviderDiagnostic(err, [otp, recipientPhone]);
    console.warn(`[OTP Dispatch] SMS Gateway error for ${maskedPhone}: ${safeErr}`);
    channelLog.push(`SMS delivery error for mobile ${maskedPhone}`);
  }

  const deliveryVerified = emailDispatched || smsDispatched;

  console.log(
    `[Banking MFA Engine] OTP dispatch for ${maskedEmail} and ${maskedPhone}. Verified=${deliveryVerified}, Email=${emailDispatched}, SMS=${smsDispatched}, Provider=${providerName}${errorCode ? `, ErrorCode=${errorCode}` : ""}`
  );

  return {
    emailDispatched,
    smsDispatched,
    deliveryVerified,
    maskedEmail,
    maskedPhone,
    channelLog,
    providerName,
    providerMessageId,
    acceptedCount,
    rejectedCount,
    errorCode: deliveryVerified ? undefined : errorCode,
    deliveryError: deliveryVerified ? undefined : deliveryError,
  };
}
