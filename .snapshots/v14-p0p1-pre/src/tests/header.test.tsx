import React from "react";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { Header, HeaderProps } from "../components/Header";
import { LanguageProvider } from "../lib/i18n";
import type { UserProfile } from "../types";

const noop = () => {};

function createBaseProps(overrides: Partial<HeaderProps> = {}): HeaderProps {
  return {
    darkMode: false,
    setDarkMode: noop,
    themeMode: "light",
    setThemeMode: noop,
    syncWithSystem: false,
    setSyncWithSystem: noop,
    favorites: ["merge-pdf"],
    onOpenFavorites: noop,
    onOpenHistory: noop,
    onSelectTool: noop,
    onOpenSearch: noop,
    currentRole: "public",
    userProfile: null,
    canAccessAdmin: false,
    adminEditModeActive: false,
    onToggleAdminEditMode: noop,
    onOpenCms: noop,
    onOpenAuthModal: noop,
    onOpenAdminPanel: noop,
    onOpenUserDashboard: noop,
    onLogout: noop,
    onGoHome: noop,
    onOpenTodayInHistory: noop,
    onOpenShareModal: noop,
    onOpenPricing: noop,
    onOpenBlog: noop,
    onOpenInstallApp: noop,
    onOpenAvatarModal: noop,
    onOpenVerificationStudio: noop,
    ...overrides,
  };
}

function renderHeader(overrides: Partial<HeaderProps> = {}): string {
  return renderToStaticMarkup(
    <LanguageProvider>
      <Header {...createBaseProps(overrides)} />
    </LanguageProvider>
  );
}

const OWNER_ONLY_MARKERS = [
  "Owner Management",
  "Owner Panel",
  "Admin Suite",
  "Financial Audit Dashboard",
  "Backend Management",
  "Live Site CMS Editor",
  "Admin Control Bar",
  "Verification Studio",
  "Administrative Suite",
  'id="header-owner-btn"',
];

const results: Array<{ name: string; pass: boolean; detail?: string }> = [];

function runTest(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, pass: true });
    console.log(`  ✓ ${name}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, pass: false, detail: msg });
    console.error(`  ✗ ${name}\n    ${msg}`);
  }
}

console.log("\n=== PDFSun.in Header & Role-Based Navigation Tests ===");

runTest("Logged-out public desktop header renders exact layout items & labels", () => {
  const html = renderHeader({ currentRole: "public", userProfile: null, themeMode: "light" });

  assert.ok(html.includes('id="main-header"'), "Missing #main-header");
  assert.ok(html.includes("PDFSun"), "Missing PDFSun brand name");
  assert.ok(html.includes("PRO AI"), "Missing PRO AI badge");
  assert.ok(html.includes("pdfsun.in"), "Missing pdfsun.in domain text");
  assert.ok(html.includes("Search 68+ Tools"), "Missing Search 68+ Tools label");
  assert.ok(html.includes("Ctrl+K"), "Missing Ctrl+K shortcut badge");
  assert.ok(html.includes('id="header-install-app-btn"'), "Missing App button");
  assert.ok(html.includes(">App<"), "Missing App label");
  assert.ok(html.includes('id="header-nav-pricing-btn"'), "Missing Plans button");
  assert.ok(html.includes(">Plans<"), "Missing Plans label");
  assert.ok(html.includes('id="header-theme-btn"'), "Missing Theme selector button");
  assert.ok(html.includes(">Light<"), "Missing Light theme label");
  assert.ok(html.includes('id="header-nav-blog-btn"'), "Missing Blog button");
  assert.ok(html.includes(">Blog<"), "Missing Blog label");
  assert.ok(html.includes('id="header-language-btn"'), "Missing Language selector button");
  assert.ok(html.includes(">EN<"), "Missing EN language indicator");
  assert.ok(html.includes('id="header-login-btn"'), "Missing Login / Register button");
  assert.ok(html.includes("Login / Register"), "Missing Login / Register text");
  assert.ok(!html.includes("📱"), "Header must not use raw smartphone emoji");

  // Verify exact left-to-right desktop ordering
  const order = [
    'id="header-search-btn"',
    'id="header-install-app-btn"',
    'id="header-nav-pricing-btn"',
    'id="header-theme-btn"',
    'id="header-nav-blog-btn"',
    'id="header-language-btn"',
    'id="header-login-btn"',
  ];
  let prevIndex = -1;
  for (const token of order) {
    const idx = html.indexOf(token);
    assert.ok(idx > prevIndex, `Expected ${token} to appear in desktop order (after index ${prevIndex}, got ${idx})`);
    prevIndex = idx;
  }
});

runTest("Logged-out visitor has universal mobile hamburger toggle & drawer with ZERO Owner UI", () => {
  const html = renderHeader({
    currentRole: "public",
    userProfile: null,
    defaultMobileMenuOpen: true,
  });

  assert.ok(
    html.includes('id="header-mobile-drawer-toggle-btn"'),
    "Public visitor must have access to mobile menu button"
  );
  assert.ok(
    html.includes('id="header-mobile-drawer"'),
    "Public visitor must be able to open mobile navigation drawer"
  );
  assert.ok(
    html.includes(">Light<") && html.includes(">Dark<") && html.includes(">Auto<"),
    "Mobile drawer should include Theme switcher options (Light, Dark, Auto)"
  );
  assert.ok(html.includes("Language"), "Mobile drawer should include Language switcher");

  for (const marker of OWNER_ONLY_MARKERS) {
    assert.ok(
      !html.includes(marker),
      `Public visitor header/drawer must NOT contain owner marker: ${marker}`
    );
  }
});

runTest("mukeshkalonia241@gmail.com is strictly treated as Customer — zero Owner/Admin UI even if props spoofed", () => {
  const customerProfile: UserProfile = {
    id: "cust-mk-241",
    name: "Mukesh Kalonia",
    email: "mukeshkalonia241@gmail.com",
    plan: "Pro Sun Annual",
    role: "user",
    isPro: true,
    hasAdminAccess: false,
  };

  // Even under adversarial prop combination (canAccessAdmin=true, currentRole="owner")
  const html = renderHeader({
    currentRole: "owner",
    userProfile: customerProfile,
    canAccessAdmin: true,
    defaultProfileMenuOpen: true,
    defaultMobileMenuOpen: true,
  });

  assert.ok(html.includes('id="header-profile-btn"'), "Customer should see standard profile button");
  assert.ok(html.includes("My Account"), "Customer dropdown should include My Account");
  assert.ok(
    html.includes("Favorites") || html.includes("Favorite Tools"),
    "Customer dropdown should include Favorites"
  );
  assert.ok(html.includes("Recent History"), "Customer dropdown should include Recent History");
  assert.ok(html.includes("Logout"), "Customer dropdown should include Logout");

  for (const marker of OWNER_ONLY_MARKERS) {
    assert.ok(
      !html.includes(marker),
      `mukeshkalonia241@gmail.com must NEVER see owner/admin marker: ${marker}`
    );
  }
});

runTest("Standard Customer (customer@example.com) sees clean account dropdown with zero Admin/Disabled boxes", () => {
  const regularCustomer: UserProfile = {
    id: "cust-101",
    name: "Aarav Sharma",
    email: "customer@example.com",
    plan: "Free Forever",
    role: "user",
    isPro: false,
  };

  const html = renderHeader({
    currentRole: "user",
    userProfile: regularCustomer,
    canAccessAdmin: false,
    defaultProfileMenuOpen: true,
    defaultMobileMenuOpen: true,
  });

  assert.ok(html.includes('id="header-profile-btn"'), "Missing customer profile button");
  assert.ok(html.includes("Aarav"), "Missing customer first name");
  assert.ok(html.includes("My Account"), "Missing My Account link");
  assert.ok(html.includes("Logout"), "Missing Logout action");
  assert.ok(html.includes(">FREE<"), "Missing FREE tier badge");

  for (const marker of OWNER_ONLY_MARKERS) {
    assert.ok(
      !html.includes(marker),
      `Customer header must NOT contain owner/admin marker: ${marker}`
    );
  }
});

runTest("Authenticated Sole Owner (mukeshinland79@gmail.com) sees Owner navigation controls when verified", () => {
  const ownerProfile: UserProfile = {
    id: "owner-1",
    name: "Mukesh Kalonia",
    email: "mukeshinland79@gmail.com",
    plan: "Enterprise SSO Unlimited",
    role: "owner",
    isPro: true,
    hasAdminAccess: true,
  };

  const html = renderHeader({
    currentRole: "owner",
    userProfile: ownerProfile,
    canAccessAdmin: true,
    defaultProfileMenuOpen: true,
    defaultMobileMenuOpen: true,
  });

  assert.ok(html.includes('id="header-owner-btn"'), "Missing Owner profile button");
  assert.ok(html.includes("Owner Management"), "Missing Owner Management section");
  assert.ok(html.includes("Owner Panel"), "Missing Owner Panel item");
  assert.ok(html.includes("Admin Suite"), "Missing Admin Suite item");
  assert.ok(html.includes("Financial Audit Dashboard"), "Missing Financial Audit Dashboard item");
  assert.ok(html.includes("Backend Management"), "Missing Backend Management item");
  assert.ok(html.includes("Users &amp; RBAC"), "Missing Users & RBAC item");
  assert.ok(html.includes("Analytics"), "Missing Analytics item");
  assert.ok(html.includes("Live Site CMS Editor"), "Missing Live Site CMS Editor item");
  assert.ok(html.includes("Admin Control Bar"), "Missing Admin Control Bar toggle");
  assert.ok(html.includes("Verification Studio"), "Missing Verification Studio item");
  assert.ok(html.includes("My Account"), "Owner should also have My Account");
  assert.ok(html.includes("Logout"), "Owner should also have Logout");
  assert.ok(
    !html.includes("mukeshinland79@gmail.com"),
    "Owner email should be masked in the visible dropdown"
  );
});

runTest("Unverified Owner session (canAccessAdmin=false) does NOT render Owner controls", () => {
  const ownerProfile: UserProfile = {
    id: "owner-1",
    name: "Mukesh Kalonia",
    email: "mukeshinland79@gmail.com",
    plan: "Enterprise SSO Unlimited",
    role: "owner",
    isPro: true,
    hasAdminAccess: true,
  };

  const html = renderHeader({
    currentRole: "owner",
    userProfile: ownerProfile,
    canAccessAdmin: false,
    defaultProfileMenuOpen: true,
    defaultMobileMenuOpen: true,
  });

  for (const marker of OWNER_ONLY_MARKERS) {
    assert.ok(
      !html.includes(marker),
      `Unverified session (canAccessAdmin=false) must NOT expose: ${marker}`
    );
  }
});

runTest("Theme modes display accurate active labels (Light, Dark, High Contrast)", () => {
  const lightHtml = renderHeader({ themeMode: "light", darkMode: false });
  const darkHtml = renderHeader({ themeMode: "dark", darkMode: true });
  const contrastHtml = renderHeader({ themeMode: "high-contrast", darkMode: true });

  assert.ok(lightHtml.includes(">Light<"), "Light mode should display Light");
  assert.ok(darkHtml.includes(">Dark<"), "Dark mode should display Dark");
  assert.ok(contrastHtml.includes(">Contrast<"), "High Contrast mode should display Contrast");
});

const failed = results.filter((r) => !r.pass);
console.log(
  `\nHeader test summary: ${results.length - failed.length}/${results.length} passed\n`
);
if (failed.length > 0) {
  process.exit(1);
}
