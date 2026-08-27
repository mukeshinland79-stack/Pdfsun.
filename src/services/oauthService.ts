/**
 * Secure OAuth Provider Service for PDFSun
 * Enforces explicit user confirmation and disables silent auto-login:
 * - Google Identity Services: prompt: 'select_account', auto_select: false
 * - Facebook SDK: auth_type: 'rerequest', re-authentication enforcement
 */

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseApp } from "../lib/firebase";

/**
 * Secure OAuth 2.0 Provider Service for PDFSun
 * Enforces authentic identity verification and disables dummy/silent auto-login:
 * - Firebase Auth GoogleAuthProvider: prompt: 'select_account'
 * - Firebase Auth FacebookAuthProvider / FB SDK: auth_type: 'rerequest'
 * - Google Identity Services: prompt: 'select_account', auto_select: false
 * - Rejects any attempt to mock user identity or auto-login with placeholder emails
 */

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export interface OAuthUserPayload {
  email: string;
  name: string;
  avatar?: string;
  provider: "google" | "facebook";
  providerToken?: string;
  idToken?: string;
}

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  "387001792487-dv3evm8lhg6te75ldq7f4sff039ec11d.apps.googleusercontent.com";

const FB_APP_ID =
  (import.meta as any).env?.VITE_FACEBOOK_APP_ID ||
  "YOUR_FACEBOOK_APP_ID";

/**
 * 1. Initialize Google Identity Services (GIS) with auto_select strictly disabled
 */
export function initGoogleIdentityServices(
  onCredentialReceived?: (credential: string) => void
): void {
  if (typeof window === "undefined") return;

  if (window.google?.accounts?.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false, // Disables silent auto-login
        cancel_on_tap_outside: true,
        callback: (response: { credential: string }) => {
          if (response?.credential && onCredentialReceived) {
            onCredentialReceived(response.credential);
          }
        },
      });
    } catch (err) {
      console.warn("[OAuth] Google GSI initialization notice:", err);
    }
  }
}

/**
 * 2. Trigger Google Explicit Account Selection Prompt
 * Uses authentic Firebase Auth popup or Google Identity Services.
 * Requires user interaction and real credentials.
 */
export async function triggerGoogleExplicitLogin(): Promise<OAuthUserPayload> {
  if (typeof window === "undefined") {
    throw new Error("Window context not available for authentication.");
  }

  // Attempt 1: Official Firebase Auth Popup with GoogleAuthProvider
  try {
    const firebaseApp = getFirebaseApp();
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    provider.setCustomParameters({
      prompt: "select_account", // Force Google Account Chooser
    });

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    if (!user || !user.email) {
      throw new Error("Google authentication did not return a valid email address.");
    }

    const idToken = await user.getIdToken(true);
    const cleanEmail = user.email.toLowerCase().trim();

    return {
      email: cleanEmail,
      name: user.displayName || cleanEmail.split("@")[0].replace(/[._]/g, " "),
      avatar:
        user.photoURL ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      provider: "google",
      providerToken: idToken,
      idToken,
    };
  } catch (firebaseErr: any) {
    // If popup was cancelled by user, report cleanly
    if (
      firebaseErr?.code === "auth/popup-closed-by-user" ||
      firebaseErr?.code === "auth/cancelled-popup-request" ||
      firebaseErr?.message?.includes("closed-by-user")
    ) {
      throw new Error("Google sign-in was cancelled. Please try again when ready.");
    }

    console.warn("[OAuth] Firebase Auth Google popup notice, trying GIS token client:", firebaseErr?.message);

    // Attempt 2: Google Identity Services (GIS) TokenClient as verified fallback
    if (window.google?.accounts?.oauth2) {
      return new Promise<OAuthUserPayload>((resolve, reject) => {
        try {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "openid email profile",
            prompt: "select_account",
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                return reject(new Error(tokenResponse.error_description || "Google account sign-in was cancelled or failed."));
              }
              if (!tokenResponse.access_token) {
                return reject(new Error("No access token returned from Google."));
              }

              try {
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });

                if (userInfoRes.ok) {
                  const info = await userInfoRes.json();
                  if (!info.email) {
                    return reject(new Error("Google account email could not be verified."));
                  }
                  return resolve({
                    email: info.email.toLowerCase().trim(),
                    name: info.name || info.email.split("@")[0].replace(/[._]/g, " "),
                    avatar:
                      info.picture ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                    provider: "google",
                    providerToken: tokenResponse.access_token,
                  });
                }
              } catch (err: any) {
                return reject(new Error("Unable to fetch user profile from Google. Please try again."));
              }

              return reject(new Error("Google authentication failed. Please try again."));
            },
          });

          tokenClient.requestAccessToken({ prompt: "select_account" });
        } catch (gisErr: any) {
          reject(new Error(gisErr.message || "Failed to initialize Google login. Please try again."));
        }
      });
    }

    // Propagate the real error instead of mocking fake data
    throw new Error(
      firebaseErr?.message?.includes("configuration")
        ? "Google authentication is initializing. Please verify your connection."
        : firebaseErr?.message || "Google sign-in could not be completed."
    );
  }
}

/**
 * 3. Initialize Facebook JS SDK
 */
export function initFacebookSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.FB) return resolve();

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v20.0",
      });
      resolve();
    };

    const scriptId = "facebook-jssdk";
    if (document.getElementById(scriptId)) return resolve();

    const js = document.createElement("script");
    js.id = scriptId;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.async = true;
    js.defer = true;
    js.onload = () => resolve();
    js.onerror = () => resolve(); // Non-blocking
    document.head.appendChild(js);
  });
}

/**
 * 4. Trigger Facebook Explicit Confirmation & Re-request
 * Uses authentic Firebase Auth popup or Facebook SDK with auth_type: 'rerequest'.
 */
export async function triggerFacebookExplicitLogin(): Promise<OAuthUserPayload> {
  if (typeof window === "undefined") {
    throw new Error("Window context not available for authentication.");
  }

  // Attempt 1: Firebase Auth FacebookAuthProvider
  try {
    const firebaseApp = getFirebaseApp();
    const auth = getAuth(firebaseApp);
    const provider = new FacebookAuthProvider();
    provider.addScope("email");
    provider.addScope("public_profile");
    provider.setCustomParameters({
      auth_type: "rerequest",
    });

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    if (!user || !user.email) {
      throw new Error("Facebook account did not share an email address. Please sign in with email.");
    }

    const idToken = await user.getIdToken(true);
    const cleanEmail = user.email.toLowerCase().trim();

    return {
      email: cleanEmail,
      name: user.displayName || cleanEmail.split("@")[0].replace(/[._]/g, " "),
      avatar:
        user.photoURL ||
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      provider: "facebook",
      providerToken: idToken,
      idToken,
    };
  } catch (fbErr: any) {
    if (
      fbErr?.code === "auth/popup-closed-by-user" ||
      fbErr?.code === "auth/cancelled-popup-request" ||
      fbErr?.message?.includes("closed-by-user")
    ) {
      throw new Error("Facebook sign-in was cancelled. Please try again when ready.");
    }

    console.warn("[OAuth] Firebase Facebook login notice, trying FB JS SDK:", fbErr?.message);

    // Attempt 2: Facebook JavaScript SDK
    if (window.FB) {
      return new Promise<OAuthUserPayload>((resolve, reject) => {
        try {
          window.FB.login(
            (response: any) => {
              if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                window.FB.api("/me", { fields: "name,email,picture" }, (profile: any) => {
                  if (!profile || !profile.email) {
                    return reject(new Error("Facebook did not return a registered email address."));
                  }
                  resolve({
                    email: profile.email.toLowerCase().trim(),
                    name: profile.name || "Facebook User",
                    avatar:
                      profile.picture?.data?.url ||
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
                    provider: "facebook",
                    providerToken: accessToken,
                  });
                });
              } else {
                reject(new Error("Facebook sign-in was cancelled or required permissions were declined."));
              }
            },
            {
              scope: "public_profile,email",
              auth_type: "rerequest",
              return_scopes: true,
            }
          );
        } catch (err: any) {
          reject(new Error(err.message || "Failed to initialize Facebook login dialog."));
        }
      });
    }

    throw new Error(fbErr?.message || "Facebook authentication could not be completed.");
  }
}

