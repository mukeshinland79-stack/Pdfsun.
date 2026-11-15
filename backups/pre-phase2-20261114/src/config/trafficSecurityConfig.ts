/**
 * PDFSun.in - Centralized Enterprise Traffic Security Configuration
 * 
 * Strict Guardrails:
 * - NEVER block legitimate users, students, office workers, or normal web visitors.
 * - NEVER block traffic based solely on country, IP location, OS, language, or device.
 * - ALWAYS unconditionally allowlist verified search engine crawlers (Googlebot, Bingbot, etc.).
 * - Progressive, multi-signal rate limiting on sensitive API endpoints.
 */

export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  burstAllowance?: number;
  message: string;
}

export interface TrafficSecurityConfig {
  monitoringEnabled: boolean;
  blockMaliciousTools: boolean;
  rateLimitSensitiveEndpoints: boolean;
  referralSpamFilteringEnabled: boolean;

  // Search Engine & Social Crawlers - UNCONDITIONALLY ALLOWED FOR SEO & INDEXING
  verifiedSearchCrawlers: string[];

  // Known Referral Spam Domains (Spamming GA4 & HTTP referrers)
  suspiciousReferrers: string[];

  // Trusted Referrers (Never flagged as referral spam)
  trustedReferrers: string[];

  // Malicious Automated Tools & Attack Scanners (NOT regular browsers or search bots)
  blockedUserAgents: string[];

  // Endpoint-Specific Rate Limits (IP + Endpoint + Time Window)
  rateLimits: {
    // Normal public browsing / HTML pages: Extremely generous, normal visitors will never hit this
    publicBrowsing: RateLimitRule;
    // AI Document Endpoints (Gemini Chat, Summary, OCR Table, etc.)
    aiEndpoints: RateLimitRule;
    // Authentication Endpoints (Login, Register, OTP verification)
    authEndpoints: RateLimitRule;
    // Comments & Community Feedback
    commentsEndpoints: RateLimitRule;
    // General API standard requests
    generalApi: RateLimitRule;
  };

  // Progressive Defense Multi-Signal Thresholds (Prevents premature false positives)
  progressiveThresholds: {
    // Level 1: Monitor & Log suspicious anomaly (0 penalty)
    anomalyScoreThresholdMonitor: number;
    // Level 2: Soft 429 rate limit with Retry-After header
    anomalyScoreThresholdRateLimit: number;
    // Level 3: Temporary throttle window (minutes)
    temporaryThrottleMinutes: number;
    // Level 4: Extended temporary restriction for repeated abusive flooding (minutes)
    temporaryBlockMinutes: number;
  };
}

export const TRAFFIC_SECURITY_CONFIG: TrafficSecurityConfig = {
  monitoringEnabled: true,
  blockMaliciousTools: true,
  rateLimitSensitiveEndpoints: true,
  referralSpamFilteringEnabled: true,

  // 1. Legitimate Search Crawlers & Social Bots (ALWAYS EXEMPT FROM BLOCKING & AGGRESSIVE LIMITS)
  verifiedSearchCrawlers: [
    "googlebot",
    "google-inspectiontool",
    "mediapartners-google",
    "adsbot-google",
    "google-adwords",
    "feedfetcher-google",
    "bingbot",
    "bingpreview",
    "msnbot",
    "yandexbot",
    "duckduckbot",
    "baiduspider",
    "applebot",
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "pinterestbot",
    "slackbot",
    "telegrambot",
    "whatsapp",
    "discordbot",
  ],

  // 2. Known Referral Spam Domains (Filtered from GA4 & analytics to keep metrics pure)
  suspiciousReferrers: [
    "trafficbot.life",
    "darodar.com",
    "semalt.com",
    "buttons-for-website.com",
    "free-share-buttons.com",
    "buy-cheap-traffic.com",
    "best-seo-offer.com",
    "rank-checker.online",
    "floating-share-buttons.com",
    "get-free-traffic.com",
    "site-auditor.online",
    "traffic-cash.xyz",
    "free-traffic-exchange.xyz",
    "crypto-spammers.online",
    "poker-spammers.net",
    "aliexpress-coupon-spammers.ru",
    "100dollars-seo.com",
    "success-seo.com",
    "qualitymarketzone.com",
  ],

  // 3. Trusted Referrers (Search engines, trusted platforms, payment gateways)
  trustedReferrers: [
    "google.com",
    "google.co.in",
    "bing.com",
    "yahoo.com",
    "duckduckgo.com",
    "yandex.com",
    "baidu.com",
    "ecosia.org",
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "t.co",
    "youtube.com",
    "reddit.com",
    "github.com",
    "razorpay.com",
    "api.razorpay.com",
    "pdfsun.in",
    "localhost",
  ],

  // 4. Malicious Scanners & Attack Utilities (Exclusively automated exploit scanners)
  blockedUserAgents: [
    "sqlmap",
    "nikto",
    "masscan",
    "zgrab",
    "acunetix",
    "nmap",
    "nessus",
    "havij",
    "dirbuster",
    "gobuster",
    "wpscan",
  ],

  // 5. Multi-Tier Rate Limits (Generous for human workflows, protective against automation scripts)
  rateLimits: {
    // Normal HTML & Navigation: 250 requests per minute per IP (Huge headroom for power users & students)
    publicBrowsing: {
      windowMs: 60 * 1000,
      maxRequests: 250,
      burstAllowance: 50,
      message: "Browsing request frequency unusually high. Please slow down.",
    },

    // AI Endpoints: 30 requests per minute per IP (Protects expensive Gemini quota while enabling fluid conversations)
    aiEndpoints: {
      windowMs: 60 * 1000,
      maxRequests: 30,
      burstAllowance: 10,
      message: "AI Document Assistant rate limit reached. Please wait a moment before sending another message.",
    },

    // Authentication & OTP Endpoints: 15 requests per 5 minutes per IP (Prevents credential stuffing & OTP brute-force)
    authEndpoints: {
      windowMs: 5 * 60 * 1000,
      maxRequests: 15,
      burstAllowance: 5,
      message: "Too many authentication attempts. For your security, please wait a few minutes before trying again.",
    },

    // Comments & Feedback Endpoints: 20 requests per 5 minutes per IP (Prevents comment flooding)
    commentsEndpoints: {
      windowMs: 5 * 60 * 1000,
      maxRequests: 20,
      burstAllowance: 5,
      message: "Comment submission rate limit exceeded. Please wait a moment.",
    },

    // General API Standard: 120 requests per minute per IP
    generalApi: {
      windowMs: 60 * 1000,
      maxRequests: 120,
      burstAllowance: 20,
      message: "Too many API requests. Please wait a moment.",
    },
  },

  // 6. Progressive Multi-Signal Defense (Prevents single-strike false positives)
  progressiveThresholds: {
    anomalyScoreThresholdMonitor: 1, // Log for analysis
    anomalyScoreThresholdRateLimit: 3, // Rate limit 429
    temporaryThrottleMinutes: 5, // 5 min throttle for repeated burst
    temporaryBlockMinutes: 30, // 30 min temporary restriction for persistent flooding
  },
};
