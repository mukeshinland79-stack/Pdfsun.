/**
 * Firebase Cloud Function for PDFSun.in
 * Triggers on creation of a new document in the 'tool_feedback' Firestore collection.
 * Sends an email notification to the Admin with interactive Approve and Delete links.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configuration defaults
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "mukeshinland79@gmail.com";
const APP_BASE_URL = process.env.APP_BASE_URL || "https://pdfsun.in";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "12345";

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "notifications@pdfsun.in",
    pass: process.env.SMTP_PASS || "sample_smtp_password",
  },
});

/**
 * Cloud Function Trigger: onNewToolFeedback
 * Triggers whenever a new feedback entry is added to 'tool_feedback/{feedbackId}'
 */
exports.onNewToolFeedback = onDocumentCreated("tool_feedback/{feedbackId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.warn("No data associated with the event");
    return;
  }

  const feedbackData = snapshot.data();
  const feedbackId = event.params.feedbackId;

  logger.info(`New tool_feedback document detected: ${feedbackId}`, feedbackData);

  const toolId = feedbackData.toolId || "Unknown Tool";
  const rating = feedbackData.rating || 5;
  const comment = feedbackData.comment || "No comment provided";
  const userEmail = feedbackData.userEmail || "Anonymous User";
  const timestamp = feedbackData.timestamp || new Date().toISOString();

  // Create action verification token
  const actionToken = Buffer.from(`${feedbackId}:${ADMIN_SECRET_KEY}`).toString("base64url");

  // Construct Action URLs for Approve and Delete
  const approveUrl = `${APP_BASE_URL}/api/admin/feedback/action?id=${encodeURIComponent(feedbackId)}&action=approve&token=${encodeURIComponent(actionToken)}`;
  const deleteUrl = `${APP_BASE_URL}/api/admin/feedback/action?id=${encodeURIComponent(feedbackId)}&action=delete&token=${encodeURIComponent(actionToken)}`;

  // Format Star Rating String
  const starsHtml = "★".repeat(Math.min(5, Math.max(1, rating))) + "☆".repeat(5 - Math.min(5, Math.max(1, rating)));

  // HTML Email Body Template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Tool Feedback Notification - PDFSun</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #fb923c; font-weight: 600; }
          .content { padding: 24px; }
          .badge { display: inline-block; padding: 4px 10px; background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; font-size: 11px; font-weight: 700; border-radius: 20px; margin-bottom: 16px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .info-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .info-table td.label { font-weight: 700; color: #64748b; width: 120px; }
          .stars { color: #f59e0b; font-size: 18px; font-weight: bold; }
          .comment-box { background: #f8fafc; border-left: 4px solid #ea580c; padding: 14px; font-size: 13px; color: #334155; line-height: 1.6; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
          .actions { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; padding: 12px 24px; margin: 0 6px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px; transition: background 0.2s; }
          .btn-approve { background-color: #16a34a; color: #ffffff !important; }
          .btn-delete { background-color: #dc2626; color: #ffffff !important; }
          .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PDFSun.in Admin Notification</h1>
            <p>New User Feedback Submission</p>
          </div>
          <div class="content">
            <span class="badge">Collection: tool_feedback</span>
            
            <table class="info-table">
              <tr>
                <td class="label">Feedback ID:</td>
                <td><code>${feedbackId}</code></td>
              </tr>
              <tr>
                <td class="label">Tool ID:</td>
                <td><strong>${toolId}</strong></td>
              </tr>
              <tr>
                <td class="label">User Email:</td>
                <td>${userEmail}</td>
              </tr>
              <tr>
                <td class="label">Rating:</td>
                <td><span class="stars">${starsHtml}</span> (${rating}/5)</td>
              </tr>
              <tr>
                <td class="label">Submitted At:</td>
                <td>${new Date(timestamp).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })} IST</td>
              </tr>
            </table>

            <div style="font-weight: 700; font-size: 12px; color: #64748b; margin-bottom: 6px;">User Comment:</div>
            <div class="comment-box">
              "${comment}"
            </div>

            <div class="actions">
              <p style="font-size: 12px; color: #64748b; margin-bottom: 14px; font-weight: 600;">Take Quick Moderation Action:</p>
              <a href="${approveUrl}" class="btn btn-approve" target="_blank">✓ Approve Feedback</a>
              <a href="${deleteUrl}" class="btn btn-delete" target="_blank">✕ Delete Feedback</a>
            </div>
          </div>
          <div class="footer">
            PDFSun.in Automated Feedback Management System &bull; Confidential Admin Alert
          </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: `"PDFSun Alerts" <${process.env.SMTP_USER || "notifications@pdfsun.in"}>`,
    to: ADMIN_EMAIL,
    subject: `[PDFSun Feedback] ${rating}★ Rating on ${toolId} - Action Required`,
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Notification email sent successfully for feedback ${feedbackId}: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending notification email for feedback ${feedbackId}:`, error);
  }
});
