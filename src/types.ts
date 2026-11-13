export type CategoryId = "all" | "convert" | "organize" | "security" | "edit" | "optimize" | "advanced" | "ai" | string;

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: CategoryId | string;
  slug: string;
  badge?: string;
  isPopular?: boolean;
  isStudentFavorite?: boolean;
  isPro?: boolean;
  isAi?: boolean;
  supportedInput?: string[];
  outputFormat?: string;
  faqs?: { question: string; answer: string }[];
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceNumber: number;
  interval: string;
  badge?: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
}

export type PolicyType =
  | "privacy"
  | "terms"
  | "about"
  | "contact"
  | "cookie"
  | "refund"
  | "disclaimer";

export interface ToolHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  timestamp: number | string;
  fileName?: string;
  fileSize?: number;
  status?: "completed" | "downloaded" | string;
  outputFileName?: string;
  snippet?: string;
}

export type UserRole = "user" | "admin" | "owner" | "public";

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  email: string;
  plan: string;
  planId?: string;
  isPro: boolean;
  role: UserRole;
  joinedDate?: string;
  photoURL?: string;
  avatar?: string;
  hasAdminAccess?: boolean;
  subscription?: any;
  organizationName?: string;
  ssoProvider?: string;
  isSsoManaged?: boolean;
  ssoDomain?: string;
}

export type AuditLogCategory = "sso_auth" | "user_status" | "auth" | "admin" | "billing" | "security" | "system" | "tools" | string;
export type AuditLogStatus = "SUCCESS" | "WARNING" | "FAILED" | "CRITICAL" | "success" | "warning" | "failure" | string;

export interface AuditLogEntry {
  id: string;
  timestamp: string | number;
  isoTimestamp?: string;
  category: AuditLogCategory;
  eventType?: string;
  action: string;
  target?: string;
  adminOperator?: string;
  status: AuditLogStatus;
  ipAddress?: string;
  ip?: string;
  userEmail?: string;
  details?: string;
  metadata?: Record<string, any>;
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
  image: string;
  tags: string[];
  lastModified?: string;
  relatedTools?: string[];
  executiveSummary?: string;
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
  content?: string;
  sections?: any[];
  faqs?: { question: string; answer: string }[];
}

export type ResumeStyle = "ats" | "modern" | "executive" | "minimal";

export interface ResumePersonal {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
}

export interface ResumeExperience {
  id?: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  highlights: string[];
}

export interface ResumeEducation {
  id?: string;
  degree: string;
  school: string;
  field?: string;
  location?: string;
  graduationDate?: string;
  startYear?: string | number;
  endYear?: string | number;
  gpa?: string;
  honors?: string;
}

export interface ResumeProject {
  id: string;
  name: string;
  role?: string;
  link?: string;
  description: string;
  technologies?: string[];
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ResumeLanguage {
  id?: string;
  language: string;
  proficiency: string;
}

export interface ResumeSkills {
  technical: string[];
  tools: string[];
  soft: string[];
}

export interface ResumeData {
  personal: ResumePersonal;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkills;
  projects?: ResumeProject[];
  certifications?: ResumeCertification[];
  languages?: ResumeLanguage[];
  achievements?: string[];
}

export interface AtsAuditResult {
  score: number;
  grade?: "A" | "B" | "C" | "D" | string;
  rating?: string | number;
  breakdown?: any;
  strengths: string[];
  weaknesses: string[];
  keywordMatches: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export interface JobMatchResult {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summaryFeedback: string;
}

export interface UserComment {
  id: string;
  toolId: string;
  toolName: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: "approved" | "pending" | "rejected" | "spam" | string;
  ipHash?: string;
  helpfulCount?: number;
  helpfulIpHashes?: string[];
  verifiedUser?: boolean;
  flaggedReason?: string;
  spamScore?: number;
}

export interface ToolQuickFeedback {
  toolId: string;
  likes: number;
  dislikes: number;
  votedIps?: string[];
}

export interface AdminSettings {
  [key: string]: any;
}

export interface AdminUserAccount {
  [key: string]: any;
}

export interface SystemConfig {
  [key: string]: any;
}

export const DUAL_OWNER_EMAILS = [
  "mukeshkalonia241@gmail.com",
  "mukeshinland79@gmail.com",
];
