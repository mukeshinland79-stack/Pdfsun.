import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Lock, ExternalLink, Sparkles } from "lucide-react";

export interface IdentityProvider {
  id: "okta" | "azure" | "google" | "saml" | "ping";
  name: string;
  shortName: string;
  badge: string;
  protocol: string;
  placeholder: string;
  domainHint: string;
  description: string;
  accentColor: string;
  renderLogo: (props: { className?: string }) => React.ReactNode;
}

export const ENTERPRISE_IDPS: IdentityProvider[] = [
  {
    id: "okta",
    name: "Okta Workforce Identity",
    shortName: "Okta",
    badge: "Official Integration",
    protocol: "SAML 2.0 • OIDC",
    placeholder: "acme.okta.com or user@acme.com",
    domainHint: "Enter your Okta tenant domain (e.g., acme.okta.com) or work email",
    description: "Enterprise SAML 2.0 & OIDC authentication with Okta Identity Cloud",
    accentColor: "#007DC1",
    renderLogo: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#007DC1" strokeWidth="3.5" fill="none" />
        <circle cx="12" cy="12" r="4.5" fill="#007DC1" />
      </svg>
    ),
  },
  {
    id: "azure",
    name: "Microsoft Azure AD (Entra)",
    shortName: "Azure AD",
    badge: "Entra ID Ready",
    protocol: "SAML 2.0 • WS-Fed",
    placeholder: "user@company.onmicrosoft.com",
    domainHint: "Enter your Azure AD / Microsoft 365 work account email",
    description: "Microsoft Entra ID, Azure Active Directory & Office 365 single sign-on",
    accentColor: "#00A4EF",
    renderLogo: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="9.5" height="9.5" rx="1.5" fill="#F25022" />
        <rect x="12.5" y="2" width="9.5" height="9.5" rx="1.5" fill="#7FBA00" />
        <rect x="2" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#00A4EF" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#FFB900" />
      </svg>
    ),
  },
  {
    id: "google",
    name: "Google Workspace / Cloud Identity",
    shortName: "Google Workspace",
    badge: "Google Cloud Identity",
    protocol: "SAML 2.0 • OAuth2",
    placeholder: "alex@company.com",
    domainHint: "Enter your Google Workspace business or institutional domain",
    description: "Managed corporate Google accounts, G-Suite, and Google Cloud Identity",
    accentColor: "#4285F4",
    renderLogo: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
    ),
  },
  {
    id: "saml",
    name: "SAML 2.0 / Custom IdP (Ping, OneLogin)",
    shortName: "SAML 2.0",
    badge: "Universal Protocol",
    protocol: "SAML 2.0 • XML Metadata",
    placeholder: "sso.enterprise.com or domain.com",
    domainHint: "Enter your custom IdP entity domain or corporate email",
    description: "Universal compatibility with PingIdentity, OneLogin, Duo Security & Shibboleth",
    accentColor: "#8B5CF6",
    renderLogo: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L3 6V11.5C3 16.5 6.8 21.1 12 22C17.2 21.1 21 16.5 21 11.5V6L12 2Z"
          fill="#8B5CF6"
          fillOpacity="0.15"
          stroke="#8B5CF6"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="10" r="2.5" fill="#8B5CF6" />
        <path d="M12 12.5V16M10.5 14.5H13.5" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface EnterpriseIdpCarouselProps {
  selectedIdp: IdentityProvider;
  onSelectIdp: (idp: IdentityProvider) => void;
  className?: string;
}

export interface IdpLogoItem {
  name: string;
  category: string;
  renderLogo: (props: { className?: string }) => React.ReactNode;
}

export const ALL_SUPPORTED_IDPS: IdpLogoItem[] = [
  {
    name: "Okta",
    category: "OIDC / SAML 2.0",
    renderLogo: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#007DC1" strokeWidth="3" fill="none" />
        <circle cx="12" cy="12" r="4.5" fill="#007DC1" />
      </svg>
    ),
  },
  {
    name: "Microsoft Azure AD",
    category: "Entra ID / OIDC",
    renderLogo: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="9.5" height="9.5" rx="1.5" fill="#F25022" />
        <rect x="12.5" y="2" width="9.5" height="9.5" rx="1.5" fill="#7FBA00" />
        <rect x="2" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#00A4EF" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#FFB900" />
      </svg>
    ),
  },
  {
    name: "Google Workspace",
    category: "Cloud Identity / SAML",
    renderLogo: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
    ),
  },
  {
    name: "SAML 2.0",
    category: "Universal IdP / XML",
    renderLogo: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L3 6V11.5C3 16.5 6.8 21.1 12 22C17.2 21.1 21 16.5 21 11.5V6L12 2Z"
          fill="#8B5CF6"
          fillOpacity="0.2"
          stroke="#8B5CF6"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="10" r="2.2" fill="#8B5CF6" />
        <path d="M12 12.5V16M10.5 14.5H13.5" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Ping Identity",
    category: "PingFederate / SSO",
    renderLogo: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
          fill="#E7131A"
          fillOpacity="0.15"
          stroke="#E7131A"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="3.5" fill="#E7131A" />
      </svg>
    ),
  },
  {
    name: "OneLogin",
    category: "SaaS Identity / OIDC",
    renderLogo: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#1E293B" strokeWidth="2.5" />
        <path d="M12 7V17M9.5 9.5L12 7" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Duo Security",
    category: "Cisco Duo MFA",
    renderLogo: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#60BB46" fillOpacity="0.15" stroke="#60BB46" strokeWidth="2" />
        <path d="M7 12H17M12 7V17" stroke="#60BB46" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const HorizontalIdpLogoCarousel: React.FC<{
  onSelectIdpName?: (name: string) => void;
  className?: string;
}> = ({ onSelectIdpName, className = "" }) => {
  // Two identical sets of supported IdPs for a mathematically flawless 50% translateX loop
  const marqueeList = [...ALL_SUPPORTED_IDPS, ...ALL_SUPPORTED_IDPS];

  return (
    <div id="sso-idp-marquee-section" className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-0.5">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>SSO Identity Providers (Okta, Azure AD, Google Workspace, SAML)</span>
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Auto-Detected</span>
        </span>
      </div>

      {/* Auto-Playing Infinite Marquee Container */}
      <div 
        id="sso-idp-marquee-container"
        className="relative w-full overflow-hidden rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 p-2 shadow-inner select-none"
      >
        {/* Left & Right Fade Depth Overlays */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10" />

        <div 
          id="sso-idp-marquee-track" 
          className="animate-marquee flex items-center gap-2.5 pr-2.5"
        >
          {marqueeList.map((idp, idx) => (
            <button
              key={`${idp.name}-${idx}`}
              type="button"
              onClick={() => onSelectIdpName?.(idp.name)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-red-500/60 dark:hover:border-red-500/60 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer group shrink-0 select-none"
              title={`Configure SSO with ${idp.name}`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {idp.renderLogo({ className: "w-4 h-4" })}
              </div>
              <div className="text-left leading-none pr-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors whitespace-nowrap">
                  {idp.name}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-400 font-medium whitespace-nowrap">
                  {idp.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const EnterpriseIdpCarousel: React.FC<EnterpriseIdpCarouselProps> = ({
  selectedIdp,
  onSelectIdp,
  className = "",
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Sync activeIndex with selectedIdp
  useEffect(() => {
    const idx = ENTERPRISE_IDPS.findIndex((i) => i.id === selectedIdp.id);
    if (idx !== -1) setActiveIndex(idx);
  }, [selectedIdp]);

  const handlePrev = () => {
    const nextIdx = (activeIndex - 1 + ENTERPRISE_IDPS.length) % ENTERPRISE_IDPS.length;
    setActiveIndex(nextIdx);
    onSelectIdp(ENTERPRISE_IDPS[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % ENTERPRISE_IDPS.length;
    setActiveIndex(nextIdx);
    onSelectIdp(ENTERPRISE_IDPS[nextIdx]);
  };

  const current = ENTERPRISE_IDPS[activeIndex];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mini Header / Carousel Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>Supported Identity Providers (IdP)</span>
        </span>
        <span className="text-[10px] font-semibold text-slate-400">
          {activeIndex + 1} of {ENTERPRISE_IDPS.length}
        </span>
      </div>

      {/* Featured IdP Slide Card with Navigation */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-800/90 dark:to-slate-900/90 border border-slate-200/90 dark:border-slate-700/80 p-3.5 shadow-xs overflow-hidden transition-all">
        {/* Subtle provider-themed glow accent */}
        <div
          className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: current.accentColor }}
        />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
              {current.renderLogo({ className: "w-6 h-6" })}
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                  {current.name}
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider">
                  {current.badge}
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                {current.description}
              </p>
              <div className="pt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Protocol: {current.protocol}</span>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-xs"
              aria-label="Previous identity provider"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-xs"
              aria-label="Next identity provider"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Indicator dots */}
        <div className="flex items-center justify-center space-x-1.5 pt-2.5">
          {ENTERPRISE_IDPS.map((idp, idx) => (
            <button
              key={idp.id}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                onSelectIdp(idp);
              }}
              aria-label={`Select ${idp.shortName}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? "w-5 bg-red-600 dark:bg-red-500"
                  : "w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quick Select Provider Chips */}
      <div className="grid grid-cols-4 gap-1.5">
        {ENTERPRISE_IDPS.map((idp, idx) => {
          const isSelected = idp.id === selectedIdp.id;
          return (
            <button
              key={idp.id}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                onSelectIdp(idp);
              }}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-red-500/10 border-red-500/40 shadow-xs ring-1 ring-red-500/20"
                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <div className="w-5 h-5 mb-1 flex items-center justify-center">
                {idp.renderLogo({ className: "w-4 h-4" })}
              </div>
              <span className={`text-[10px] font-bold leading-tight truncate w-full ${
                isSelected ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"
              }`}>
                {idp.shortName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Enterprise Trust Micro-Strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Zero-Knowledge Exchange</span>
        </span>
        <span>•</span>
        <span>256-Bit SAML Assertion</span>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">SCIM 2.0</span>
      </div>
    </div>
  );
};
