export type CategoryId = 
  | "all" 
  | "student" 
  | "ai" 
  | "popular" 
  | "convert" 
  | "edit" 
  | "security" 
  | "advanced";

export interface ToolItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: CategoryId;
  isPopular?: boolean;
  isStudentFavorite?: boolean;
  isAi?: boolean;
  isPro?: boolean;
  badge?: string;
  supportedInput: string[];
  outputFormat: string;
  faqs?: { question?: string; answer?: string; q?: string; a?: string }[];
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  pageCount?: number;
  extractedText?: string;
}

export interface ToolHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  fileName: string;
  timestamp: number;
  status: "completed" | "downloaded";
  outputFileName?: string;
  snippet?: string;
}

export type PolicyType = "privacy" | "terms" | "cookie" | "refund" | "about" | "contact";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  features: string[];
  cta: string;
}

export type UserRole = "public" | "user" | "owner";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  plan: string;
  joinedDate: string;
  hasAdminAccess?: boolean;
  isPro?: boolean;
}

export interface AdminUserAccount {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: "Active" | "Suspended";
  joined: string;
  hasAdminAccess: boolean;
  permissions?: {
    analytics: boolean;
    userManagement: boolean;
    fileManagement: boolean;
    adManagement: boolean;
    websiteSettings: boolean;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  content: string;
  image: string;
}

export const DUAL_OWNER_EMAILS = [
  "mukeshkalonia241@gmail.com",
  "mukeshinland79@gmail.com",
];

export interface SystemConfig {
  ADMIN_SECRET_KEY: string;
  TEMP_STORAGE_RETENTION_MINUTES: number;
  MAX_STORAGE_USAGE_THRESHOLD: number;
  HEAVY_TRANSFORMATION_LIMIT: number;
  GLOBAL_RATE_LIMIT: number;
  BAD_REQUEST_AUTO_BLOCK_COUNT: number;
  OWNER_ONLY_STEALTH_MODE: boolean;
}

export interface UserComment {
  id: string;
  toolId: string;
  toolName: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  status: "approved" | "pending" | "rejected" | "spam";
  ipHash: string;
  helpfulCount: number;
  helpfulIpHashes?: string[];
  spamScore?: number;
  flaggedReason?: string;
  verifiedUser?: boolean;
}

export interface ToolQuickFeedback {
  toolId: string;
  likes: number;
  dislikes: number;
  votedIps?: string[];
}

export interface AdminSettings {
  siteName: string;
  domainName: string;
  supportEmail: string;
  ownerName: string;
  maintenanceMode: boolean;
  adsenseEnabled: boolean;
  adsensePubId: string;
  defaultTheme: "light" | "dark" | "system";
  aiModelVersion: string;
}
