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
  plan: "Free Sun" | "Student Pro" | "Team Enterprise";
  joinedDate: string;
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
