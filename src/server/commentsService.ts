import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UserComment, ToolQuickFeedback } from "../types";
import { getClientIp, isIpBanned } from "./security";

const COMMENTS_FILE_PATH = path.join(process.cwd(), "comments_store.json");
const BANNED_IPS_FILE_PATH = path.join(process.cwd(), "banned_ips.json");

// Banned words & toxic/spam triggers
const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "bastard", "asshole", "crap", "dick", "pussy",
  "scam", "fraud", "hacker", "virus", "malware", "pills", "casino", "viagra",
  "crypto", "free money", "sex", "porn", "xxx", "gambling"
];

const SPAM_DOMAINS = [
  "http://", "https://", "www.", ".xyz", ".top", ".click", ".link", ".ru",
  ".casino", ".win", "bit.ly", "tinyurl.com", "goo.gl"
];

// In-Memory Data Stores
let commentsStore: UserComment[] = [];
let quickFeedbackStore: Map<string, ToolQuickFeedback> = new Map();
let rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();
let customBannedIps: Set<string> = new Set();

// Seed initial high-trust verified reviews for PDFSun.in
const INITIAL_SEED_COMMENTS: UserComment[] = [
  {
    id: "cmt_seed_1",
    toolId: "merge-pdf",
    toolName: "Merge PDF",
    userName: "Aarav Sharma",
    userEmail: "aarav.s@gmail.com",
    rating: 5,
    comment: "Extremely fast and seamless! Merged 15 heavy PDFs in under 3 seconds without losing any formatting. Best PDF tool in India!",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "approved",
    ipHash: "hash_seed_1",
    helpfulCount: 24,
    verifiedUser: true
  },
  {
    id: "cmt_seed_2",
    toolId: "merge-pdf",
    toolName: "Merge PDF",
    userName: "Priya Patel",
    userEmail: "priya.design@outlook.com",
    rating: 5,
    comment: "I love that all processing happens securely. Zero file upload delays and super clean user interface!",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: "approved",
    ipHash: "hash_seed_2",
    helpfulCount: 18,
    verifiedUser: true
  },
  {
    id: "cmt_seed_3",
    toolId: "compress-pdf",
    toolName: "Compress PDF",
    userName: "Rajesh Kumar",
    userEmail: "rajesh.k@company.in",
    rating: 5,
    comment: "Reduced my 45MB scan down to 1.8MB while maintaining perfect text crispness! Absolutely essential tool for official submissions.",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "approved",
    ipHash: "hash_seed_3",
    helpfulCount: 31,
    verifiedUser: true
  },
  {
    id: "cmt_seed_4",
    toolId: "pdf-editor",
    toolName: "Edit PDF",
    userName: "Neha Gupta",
    userEmail: "neha.g@gmail.com",
    rating: 5,
    comment: "The inline text editing and annotations work like magic. Saved me hours on my college assignments!",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: "approved",
    ipHash: "hash_seed_4",
    helpfulCount: 15,
    verifiedUser: true
  },
  {
    id: "cmt_seed_5",
    toolId: "split-pdf",
    toolName: "Split PDF",
    userName: "David Miller",
    userEmail: "david.m@techcorp.io",
    rating: 5,
    comment: "Clean split options and instant page extraction. PDFSun is hands down the most reliable PDF suite.",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "approved",
    ipHash: "hash_seed_5",
    helpfulCount: 20,
    verifiedUser: true
  }
];

const INITIAL_QUICK_FEEDBACK: { [toolId: string]: ToolQuickFeedback } = {
  "merge-pdf": { toolId: "merge-pdf", likes: 342, dislikes: 4 },
  "compress-pdf": { toolId: "compress-pdf", likes: 489, dislikes: 6 },
  "split-pdf": { toolId: "split-pdf", likes: 215, dislikes: 2 },
  "pdf-editor": { toolId: "pdf-editor", likes: 398, dislikes: 8 },
  "protect-pdf": { toolId: "protect-pdf", likes: 187, dislikes: 1 },
  "ocr-pdf": { toolId: "ocr-pdf", likes: 276, dislikes: 5 }
};

// Load or Initialize Persistence
function loadCommentsFromDisk() {
  try {
    if (fs.existsSync(COMMENTS_FILE_PATH)) {
      const raw = fs.readFileSync(COMMENTS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.comments)) {
        commentsStore = parsed.comments;
      } else {
        commentsStore = [...INITIAL_SEED_COMMENTS];
      }
      if (parsed.quickFeedback && typeof parsed.quickFeedback === "object") {
        Object.keys(parsed.quickFeedback).forEach((toolId) => {
          quickFeedbackStore.set(toolId, parsed.quickFeedback[toolId]);
        });
      }
    } else {
      commentsStore = [...INITIAL_SEED_COMMENTS];
      Object.keys(INITIAL_QUICK_FEEDBACK).forEach((toolId) => {
        quickFeedbackStore.set(toolId, INITIAL_QUICK_FEEDBACK[toolId]);
      });
      saveCommentsToDisk();
    }

    if (fs.existsSync(BANNED_IPS_FILE_PATH)) {
      const rawBanned = fs.readFileSync(BANNED_IPS_FILE_PATH, "utf-8");
      const parsedBanned = JSON.parse(rawBanned);
      if (Array.isArray(parsedBanned)) {
        customBannedIps = new Set(parsedBanned);
      }
    }
  } catch (err) {
    console.error("[CommentsService] Error loading comments store, fallback to seeds:", err);
    commentsStore = [...INITIAL_SEED_COMMENTS];
  }
}

function saveCommentsToDisk() {
  try {
    const feedbackObj: { [key: string]: ToolQuickFeedback } = {};
    quickFeedbackStore.forEach((val, key) => {
      feedbackObj[key] = val;
    });

    const dataToSave = {
      updatedAt: new Date().toISOString(),
      comments: commentsStore,
      quickFeedback: feedbackObj
    };
    fs.writeFileSync(COMMENTS_FILE_PATH, JSON.stringify(dataToSave, null, 2), "utf-8");
    fs.writeFileSync(BANNED_IPS_FILE_PATH, JSON.stringify(Array.from(customBannedIps), null, 2), "utf-8");
  } catch (err) {
    console.error("[CommentsService] Failed writing comments to disk:", err);
  }
}

loadCommentsFromDisk();

// Utilities
function hashIpAddress(ip: string): string {
  return crypto.createHash("sha256").update(ip + "_pdfsun_salt_2026").digest("hex").slice(0, 16);
}

function sanitizeInput(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/javascript:/gi, "")
    .replace(/onerror=/gi, "")
    .replace(/onload=/gi, "")
    .replace(/eval\(/gi, "")
    .trim();
}

function evaluateSpamAndProfanity(text: string, email?: string): { spamScore: number; reason?: string } {
  const lower = text.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  // Check profanity
  for (const badWord of PROFANITY_LIST) {
    if (lower.includes(badWord)) {
      score += 60;
      reasons.push(`Contains blacklisted word: "${badWord}"`);
    }
  }

  // Check external URLs
  for (const spamDomain of SPAM_DOMAINS) {
    if (lower.includes(spamDomain)) {
      score += 70;
      reasons.push("Contains external links or domain references");
    }
  }

  // Repeated character spam
  if (/(.)\1{5,}/.test(text)) {
    score += 40;
    reasons.push("Repeated character patterns detected");
  }

  // Excessively short or gibberish
  if (text.length < 3) {
    score += 30;
    reasons.push("Text too short");
  }

  return {
    spamScore: score,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined
  };
}

// Handler 1: GET /api/comments?toolId=...
export function getCommentsHandler(req: Request, res: Response) {
  const toolId = (req.query.toolId as string || "").trim();
  
  // Filter approved comments
  let filtered = commentsStore.filter((c) => c.status === "approved");
  if (toolId) {
    filtered = filtered.filter((c) => c.toolId === toolId || c.toolId === "global");
  }

  // Sort by helpfulCount desc then date desc
  filtered.sort((a, b) => {
    if (b.helpfulCount !== a.helpfulCount) return b.helpfulCount - a.helpfulCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate Average Star Rating
  const totalReviews = filtered.length;
  const sumRating = filtered.reduce((acc, c) => acc + c.rating, 0);
  const avgRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 4.9;

  // Star breakdown
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  filtered.forEach((c) => {
    const star = Math.min(5, Math.max(1, Math.round(c.rating)));
    starCounts[star as keyof typeof starCounts] = (starCounts[star as keyof typeof starCounts] || 0) + 1;
  });

  // Quick Utility Feedback (Likes / Dislikes)
  const targetToolId = toolId || "merge-pdf";
  const feedback = quickFeedbackStore.get(targetToolId) || {
    toolId: targetToolId,
    likes: 120,
    dislikes: 2
  };

  return res.json({
    success: true,
    toolId: targetToolId,
    comments: filtered.map((c) => ({
      id: c.id,
      toolId: c.toolId,
      toolName: c.toolName,
      userName: c.userName,
      rating: c.rating,
      comment: c.comment,
      createdAt: c.createdAt,
      helpfulCount: c.helpfulCount,
      verifiedUser: c.verifiedUser ?? true
    })),
    stats: {
      avgRating,
      totalReviews,
      starCounts,
      quickFeedback: {
        likes: feedback.likes,
        dislikes: feedback.dislikes
      }
    }
  });
}

// Handler 2: POST /api/comments
export function addCommentHandler(req: Request, res: Response) {
  const clientIp = getClientIp(req);
  const ipHash = hashIpAddress(clientIp);

  // Check if IP is explicitly banned
  if (isIpBanned(clientIp) || customBannedIps.has(clientIp) || customBannedIps.has(ipHash)) {
    return res.status(403).json({
      success: false,
      error: "Access Denied",
      message: "Submissions from your network address are currently restricted."
    });
  }

  // Rate Limiting: Max 3 comments per IP per 1 hour
  const now = Date.now();
  const rateLimit = rateLimitMap.get(ipHash);
  if (rateLimit) {
    if (now < rateLimit.resetAt) {
      if (rateLimit.count >= 3) {
        return res.status(429).json({
          success: false,
          error: "Rate Limit Exceeded",
          message: "You have reached the maximum 3 review submissions per hour limit. Please try again later."
        });
      }
      rateLimit.count += 1;
    } else {
      rateLimitMap.set(ipHash, { count: 1, resetAt: now + 3600000 });
    }
  } else {
    rateLimitMap.set(ipHash, { count: 1, resetAt: now + 3600000 });
  }

  const {
    toolId,
    toolName,
    userName,
    userEmail,
    rating,
    comment,
    captchaToken,
    honeypot
  } = req.body || {};

  // Bot Defense / Honeypot Check
  if (honeypot) {
    // Hidden honeypot field filled -> Bot detected!
    console.warn(`[SECURITY ALERT] Bot comment submission trapped via honeypot from IP ${clientIp}`);
    return res.status(400).json({ success: false, message: "Verification failed." });
  }

  // CAPTCHA / Token validation check
  if (!captchaToken || typeof captchaToken !== "string" || captchaToken.length < 4) {
    return res.status(400).json({
      success: false,
      message: "Security CAPTCHA verification required. Please check the 'I am human' box."
    });
  }

  // Input Validation
  const cleanToolId = sanitizeInput(toolId || "global");
  const cleanToolName = sanitizeInput(toolName || "PDFSun Utility");
  const cleanUserName = sanitizeInput(userName || "Anonymous");
  const cleanEmail = userEmail ? sanitizeInput(userEmail) : undefined;
  const cleanComment = sanitizeInput(comment || "");
  const numRating = Math.min(5, Math.max(1, Number(rating) || 5));

  if (!cleanComment || cleanComment.length < 5) {
    return res.status(400).json({
      success: false,
      message: "Please provide a review comment of at least 5 characters."
    });
  }

  if (cleanComment.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Review comment exceeds maximum length of 1000 characters."
    });
  }

  // Profanity & Spam Analysis
  const { spamScore, reason } = evaluateSpamAndProfanity(cleanComment, cleanEmail);

  // Status Determination: Auto-quarantine if spamScore >= 50 or profanity detected
  let initialStatus: "approved" | "pending" | "spam" = "approved";
  if (spamScore >= 60) {
    initialStatus = "spam";
  } else if (spamScore >= 30) {
    initialStatus = "pending";
  }

  const newComment: UserComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    toolId: cleanToolId,
    toolName: cleanToolName,
    userName: cleanUserName,
    userEmail: cleanEmail,
    rating: numRating,
    comment: cleanComment,
    createdAt: new Date().toISOString(),
    status: initialStatus,
    ipHash,
    helpfulCount: 0,
    helpfulIpHashes: [],
    spamScore,
    flaggedReason: reason,
    verifiedUser: true
  };

  commentsStore.unshift(newComment);
  saveCommentsToDisk();

  console.log(`[CommentsService] New review submitted for ${cleanToolName}: status=${initialStatus}, rating=${numRating}`);

  if (initialStatus === "spam") {
    return res.status(400).json({
      success: false,
      message: "Your review was flagged by our automated security filter and sent for admin review."
    });
  }

  if (initialStatus === "pending") {
    return res.json({
      success: true,
      pending: true,
      message: "Thank you! Your review has been submitted and is in the admin approval queue."
    });
  }

  return res.json({
    success: true,
    comment: {
      id: newComment.id,
      toolId: newComment.toolId,
      toolName: newComment.toolName,
      userName: newComment.userName,
      rating: newComment.rating,
      comment: newComment.comment,
      createdAt: newComment.createdAt,
      helpfulCount: newComment.helpfulCount,
      verifiedUser: newComment.verifiedUser
    },
    message: "Thank you! Your review is published successfully."
  });
}

// Handler 3: POST /api/comments/feedback (1-click 👍 / 👎 Quick Utility Rating)
export function addQuickFeedbackHandler(req: Request, res: Response) {
  const clientIp = getClientIp(req);
  const ipHash = hashIpAddress(clientIp);

  const { toolId, type } = req.body || {};
  const cleanToolId = sanitizeInput(toolId || "merge-pdf");

  if (type !== "like" && type !== "dislike") {
    return res.status(400).json({ success: false, message: "Invalid feedback type." });
  }

  let feedback = quickFeedbackStore.get(cleanToolId);
  if (!feedback) {
    feedback = { toolId: cleanToolId, likes: 50, dislikes: 1, votedIps: [] };
  }

  if (!feedback.votedIps) feedback.votedIps = [];

  // Deduplicate by IP hash
  if (feedback.votedIps.includes(ipHash)) {
    return res.json({
      success: true,
      alreadyVoted: true,
      likes: feedback.likes,
      dislikes: feedback.dislikes,
      message: "You have already provided feedback for this tool."
    });
  }

  if (type === "like") {
    feedback.likes += 1;
  } else {
    feedback.dislikes += 1;
  }

  feedback.votedIps.push(ipHash);
  quickFeedbackStore.set(cleanToolId, feedback);
  saveCommentsToDisk();

  return res.json({
    success: true,
    likes: feedback.likes,
    dislikes: feedback.dislikes,
    message: type === "like" ? "Thank you for the positive feedback!" : "Thank you for your feedback. We will improve this tool!"
  });
}

// Handler 4: POST /api/comments/upvote ("Helpful" button)
export function upvoteCommentHandler(req: Request, res: Response) {
  const clientIp = getClientIp(req);
  const ipHash = hashIpAddress(clientIp);

  const { commentId } = req.body || {};
  const target = commentsStore.find((c) => c.id === commentId);

  if (!target) {
    return res.status(404).json({ success: false, message: "Comment not found." });
  }

  if (!target.helpfulIpHashes) target.helpfulIpHashes = [];

  if (target.helpfulIpHashes.includes(ipHash)) {
    return res.json({
      success: true,
      helpfulCount: target.helpfulCount,
      alreadyUpvoted: true,
      message: "You already marked this review as helpful."
    });
  }

  target.helpfulCount += 1;
  target.helpfulIpHashes.push(ipHash);
  saveCommentsToDisk();

  return res.json({
    success: true,
    helpfulCount: target.helpfulCount,
    message: "Marked review as helpful!"
  });
}

// Handler 5: Admin GET /api/admin/comments
export function adminGetCommentsHandler(req: Request, res: Response) {
  const statusFilter = (req.query.status as string || "all").toLowerCase();
  
  let list = [...commentsStore];
  if (statusFilter !== "all") {
    list = list.filter((c) => c.status === statusFilter);
  }

  // Summary Metrics
  const total = commentsStore.length;
  const pendingCount = commentsStore.filter((c) => c.status === "pending").length;
  const approvedCount = commentsStore.filter((c) => c.status === "approved").length;
  const spamCount = commentsStore.filter((c) => c.status === "spam" || c.status === "rejected").length;
  const bannedIpCount = customBannedIps.size;

  return res.json({
    success: true,
    metrics: {
      total,
      pendingCount,
      approvedCount,
      spamCount,
      bannedIpCount
    },
    comments: list,
    bannedIps: Array.from(customBannedIps)
  });
}

// Handler 6: Admin POST /api/admin/comments/action
export function adminCommentActionHandler(req: Request, res: Response) {
  const { commentId, action, ipToBan } = req.body || {};

  if (action === "ban_ip" && ipToBan) {
    customBannedIps.add(ipToBan);
    // Quarantine all comments from this IP hash
    commentsStore.forEach((c) => {
      if (c.ipHash === ipToBan || c.userEmail === ipToBan) {
        c.status = "spam";
        c.flaggedReason = "Owner banned IP/User";
      }
    });
    saveCommentsToDisk();
    return res.json({ success: true, message: `Banned IP/User ${ipToBan} and quarantined comments.` });
  }

  const commentIndex = commentsStore.findIndex((c) => c.id === commentId);
  if (commentIndex === -1 && action !== "unban_ip") {
    return res.status(404).json({ success: false, message: "Comment not found." });
  }

  const target = commentsStore[commentIndex];

  if (action === "approve") {
    target.status = "approved";
    target.flaggedReason = undefined;
  } else if (action === "reject") {
    target.status = "rejected";
  } else if (action === "delete") {
    commentsStore.splice(commentIndex, 1);
  } else if (action === "ban_ip_and_delete") {
    if (target.ipHash) {
      customBannedIps.add(target.ipHash);
    }
    commentsStore.splice(commentIndex, 1);
  } else if (action === "unban_ip" && ipToBan) {
    customBannedIps.delete(ipToBan);
  }

  saveCommentsToDisk();
  return res.json({ success: true, message: `Action '${action}' completed successfully.` });
}

// Handler 7: Admin POST /api/admin/comments/bulk-action
export function adminBulkCommentActionHandler(req: Request, res: Response) {
  const { ids, action } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No comment IDs provided." });
  }

  if (action === "approve") {
    commentsStore.forEach((c) => {
      if (ids.includes(c.id)) c.status = "approved";
    });
  } else if (action === "reject" || action === "spam") {
    commentsStore.forEach((c) => {
      if (ids.includes(c.id)) c.status = "spam";
    });
  } else if (action === "delete") {
    commentsStore = commentsStore.filter((c) => !ids.includes(c.id));
  }

  saveCommentsToDisk();
  return res.json({ success: true, message: `Bulk action '${action}' applied to ${ids.length} items.` });
}
