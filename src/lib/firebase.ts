import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  Firestore
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import firebaseConfigData from "../../firebase-applet-config.json";
import { resolvePaymentProduct } from "../config/paymentProducts";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const currentAuth = getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth.currentUser?.uid,
      email: currentAuth.currentUser?.email,
      emailVerified: currentAuth.currentUser?.emailVerified,
      isAnonymous: currentAuth.currentUser?.isAnonymous,
      tenantId: currentAuth.currentUser?.tenantId,
      providerInfo: currentAuth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn(`[Firestore ${operationType}] Notice on ${path || "root"}:`, errInfo.error);
  return errInfo;
}

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyAeO3-CIUwMOPKeJEpqSpAmj8jIh9jiUw4",
  authDomain: firebaseConfigData.authDomain || "pdfsun-app.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "pdfsun-app",
  storageBucket: firebaseConfigData.storageBucket || "pdfsun-app.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "125719086147",
  appId: firebaseConfigData.appId || "1:125719086147:web:d1e5ed9cfbb065d36a80f6"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    const dbId = firebaseConfigData.firestoreDatabaseId || "(default)";
    if (typeof window !== "undefined") {
      try {
        db = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true,
        }, dbId);
      } catch {
        db = getFirestore(firebaseApp, dbId);
      }
    } else {
      db = getFirestore(firebaseApp, dbId);
    }
  }
  return db;
}

export interface FirestoreFeedbackItem {
  id?: string;
  toolId: string;
  toolName: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpfulCount: number;
  status: "approved" | "pending" | "spam";
  verifiedUser?: boolean;
}

export interface ToolFeedbackData {
  toolId: string;
  rating: number;
  comment: string;
  timestamp: string;
  userEmail?: string;
}

/**
 * Stores feedback rating and comment into 'tool_feedback' collection in Firestore
 */
export async function addFeedback(feedback: ToolFeedbackData): Promise<string | null> {
  try {
    const firestore = getFirestoreDb();
    const colRef = collection(firestore, "tool_feedback");
    const docRef = await addDoc(colRef, {
      toolId: feedback.toolId,
      rating: feedback.rating,
      comment: feedback.comment,
      timestamp: feedback.timestamp || new Date().toISOString(),
      userEmail: feedback.userEmail || ""
    });
    return docRef.id;
  } catch (err) {
    console.error("[Firestore] Error in addFeedback:", err);
    return null;
  }
}

/**
 * Save user review & 5-star rating directly into Firebase Firestore
 */
export async function saveFeedbackToFirestore(feedback: FirestoreFeedbackItem): Promise<string | null> {
  try {
    const firestore = getFirestoreDb();
    const colRef = collection(firestore, "feedback_comments");
    const docRef = await addDoc(colRef, {
      toolId: feedback.toolId,
      toolName: feedback.toolName || "PDFSun Utility",
      userName: feedback.userName || "Anonymous",
      userEmail: feedback.userEmail || "",
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt || new Date().toISOString(),
      helpfulCount: feedback.helpfulCount || 0,
      status: feedback.status || "approved",
      verifiedUser: feedback.verifiedUser ?? true
    });
    return docRef.id;
  } catch (err) {
    console.error("[Firestore] Error saving feedback comment:", err);
    return null;
  }
}

/**
 * Save 1-click Like/Dislike feedback rating into Firebase Firestore
 */
export async function saveQuickFeedbackToFirestore(
  toolId: string,
  type: "like" | "dislike"
): Promise<{ likes: number; dislikes: number } | null> {
  try {
    const firestore = getFirestoreDb();
    const docRef = doc(firestore, "quick_feedback", toolId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      await updateDoc(docRef, {
        [type === "like" ? "likes" : "dislikes"]: increment(1)
      });
      const updatedSnap = await getDoc(docRef);
      const data = updatedSnap.data();
      return { likes: data?.likes || 0, dislikes: data?.dislikes || 0 };
    } else {
      const initial = {
        toolId,
        likes: type === "like" ? 1 : 0,
        dislikes: type === "dislike" ? 1 : 0
      };
      await setDoc(docRef, initial);
      return { likes: initial.likes, dislikes: initial.dislikes };
    }
  } catch (err) {
    console.error("[Firestore] Error saving quick feedback:", err);
    return null;
  }
}

export interface ToolFeedbackItemRecord {
  id: string;
  toolId: string;
  rating: number;
  comment: string;
  timestamp: string;
  userEmail?: string;
  status?: string;
  helpfulCount?: number;
}

/**
 * Fetch all documents from 'tool_feedback' collection in Firestore
 */
export async function fetchAllToolFeedbackFromFirestore(): Promise<ToolFeedbackItemRecord[]> {
  try {
    const firestore = getFirestoreDb();
    const colRef = collection(firestore, "tool_feedback");
    const querySnapshot = await getDocs(colRef);
    const items: ToolFeedbackItemRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        toolId: data.toolId || "unknown",
        rating: typeof data.rating === "number" ? data.rating : 5,
        comment: data.comment || "",
        timestamp: data.timestamp || new Date().toISOString(),
        userEmail: data.userEmail || "",
        status: data.status || "pending",
        helpfulCount: typeof data.helpfulCount === "number" ? data.helpfulCount : (typeof data.helpful === "number" ? data.helpful : 0)
      });
    });
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error("[Firestore] Error fetching all tool_feedback:", err);
    return [];
  }
}

/**
 * Increment or update helpfulCount for a tool feedback entry in Firestore
 */
export async function updateToolFeedbackHelpfulInFirestore(id: string, newCount: number): Promise<boolean> {
  try {
    const firestore = getFirestoreDb();
    const docRef = doc(firestore, "tool_feedback", id);
    await updateDoc(docRef, { helpfulCount: newCount });
    return true;
  } catch (err) {
    console.error("[Firestore] Error updating helpfulCount for tool_feedback:", err);
    return false;
  }
}

/**
 * Approve a tool feedback document in Firestore
 */
export async function approveToolFeedbackInFirestore(id: string): Promise<boolean> {
  try {
    const firestore = getFirestoreDb();
    const docRef = doc(firestore, "tool_feedback", id);
    await updateDoc(docRef, { status: "approved" });
    return true;
  } catch (err) {
    console.error("[Firestore] Error approving tool_feedback:", err);
    return false;
  }
}

/**
 * Delete a tool feedback document from Firestore
 */
export interface FirestoreTransactionRecord {
  id: string;
  paymentId?: string;
  orderId?: string;
  subscriptionId?: string;
  userId?: string;
  uid?: string;
  userEmail: string;
  amount?: number;
  amountINR?: number;
  amountPaise?: number;
  currency?: string;
  status: string; // e.g. "COMPLETED", "CAPTURED", "captured", "paid", "PENDING", "pending", "FAILED", "failed"
  planId?: string;
  planName?: string;
  plan?: string;
  entitlementGranted?: string;
  signatureVerified?: boolean;
  source?: string;
  paymentMethod?: string;
  invoiceNo?: string;
  reconciledAt?: string;
  createdAt?: string;
  timestamp?: string;
  date?: string;
}

export type UserTransactionQueryParam =
  | string
  | { uid?: string; id?: string; email?: string };

/**
 * Helper to normalize and extract uid/email from parameter
 */
function resolveUserIdentities(param: UserTransactionQueryParam): {
  uid: string;
  email: string;
} {
  if (typeof param === "string") {
    const trimmed = param.trim();
    if (trimmed.includes("@")) {
      return { uid: "", email: trimmed.toLowerCase() };
    }
    return { uid: trimmed, email: "" };
  }
  const uid = (param.uid || param.id || "").trim();
  const email = (param.email || "").trim().toLowerCase();
  return { uid, email };
}

/**
 * Fetch transactions for a user from Firestore transactions collection, matching uid or email
 */
export async function fetchUserTransactionsFromFirestore(
  userParam: UserTransactionQueryParam
): Promise<FirestoreTransactionRecord[]> {
  const { uid, email } = resolveUserIdentities(userParam);
  if (!uid && !email) return [];

  // Helper to map snapshot docs to records
  const mapDocToRecord = (docSnap: any): FirestoreTransactionRecord => {
    const data = docSnap.data();
    const docUid = (data.userId || data.uid || "").trim();
    const docEmail = (data.userEmail || "").trim().toLowerCase();
    const rawAmount = typeof data.amount === "number" ? data.amount : (typeof data.amountINR === "number" ? data.amountINR : ((data.amountPaise || 0) / 100));
    const rawAmountPaise = data.amountPaise || (rawAmount ? rawAmount * 100 : 0);
    const resolvedProd = resolvePaymentProduct({
      planId: data.planId,
      amountINR: rawAmount,
      amountPaise: rawAmountPaise,
    });

    return {
      id: docSnap.id,
      paymentId: data.paymentId || docSnap.id,
      orderId: data.orderId || "",
      subscriptionId: data.subscriptionId || "",
      userId: docUid || uid,
      uid: docUid || uid,
      userEmail: docEmail || email,
      amount: rawAmount > 0 ? rawAmount : resolvedProd.displayPriceINR,
      amountINR: rawAmount > 0 ? rawAmount : resolvedProd.displayPriceINR,
      amountPaise: rawAmountPaise > 0 ? rawAmountPaise : resolvedProd.displayPriceINR * 100,
      currency: data.currency || "INR",
      status: (data.status || "COMPLETED").toString(),
      planId: resolvedProd.internalProductId,
      planName: resolvedProd.productName,
      plan: resolvedProd.productName,
      entitlementGranted: data.entitlementGranted || "",
      signatureVerified: Boolean(data.signatureVerified),
      source: data.source || "razorpay",
      paymentMethod: data.paymentMethod || "Razorpay Live Gateway",
      invoiceNo: data.invoiceNo || `INV-RZP-${docSnap.id.substring(docSnap.id.length - 6).toUpperCase()}`,
      reconciledAt: data.reconciledAt || data.createdAt || new Date().toISOString(),
      createdAt: data.createdAt || data.reconciledAt || new Date().toISOString(),
      timestamp: data.createdAt || data.reconciledAt || new Date().toISOString(),
      date: data.createdAt ? data.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
    };
  };

  try {
    const firestore = getFirestoreDb();
    const colRef = collection(firestore, "transactions");

    // Scope query strictly by userEmail to satisfy Firestore security rules
    const q = email
      ? query(colRef, where("userEmail", "==", email))
      : query(colRef, where("userId", "==", uid));

    const snap = await getDocs(q);
    const results: FirestoreTransactionRecord[] = [];
    snap.forEach((d) => {
      results.push(mapDocToRecord(d));
    });

    return results.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "transactions");
    // Resilient fallback: fetch from secure server payment-history endpoint
    if (typeof window !== "undefined" && email) {
      try {
        const res = await fetch(`/api/user/payment-history?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.transactions)) {
            return json.transactions;
          }
        }
      } catch (fallbackErr) {
        console.warn("[PaymentHistory] REST fallback fetch notice:", fallbackErr);
      }
    }
    return [];
  }
}

/**
 * Real-time listener for user transactions in Firestore transactions collection
 * filtered strictly to transactions belonging to the current user's uid / email.
 */
export function subscribeUserTransactionsFromFirestore(
  userParam: UserTransactionQueryParam,
  onUpdate: (transactions: FirestoreTransactionRecord[]) => void
): Unsubscribe {
  const { uid, email } = resolveUserIdentities(userParam);
  if (!uid && !email) {
    onUpdate([]);
    return () => {};
  }

  // Only attach live snapshot listener if client has an active Firebase Auth session
  const currentAuth = getFirebaseAuth();
  if (!currentAuth.currentUser) {
    // If not authenticated in Firebase Auth yet, fetch one-time via resilient helper
    fetchUserTransactionsFromFirestore(userParam).then(onUpdate).catch(() => onUpdate([]));
    return () => {};
  }

  try {
    const firestore = getFirestoreDb();
    const colRef = collection(firestore, "transactions");
    const q = email
      ? query(colRef, where("userEmail", "==", email))
      : query(colRef, where("userId", "==", uid));

    return onSnapshot(
      q,
      (snap) => {
        const results: FirestoreTransactionRecord[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const docUid = (data.userId || data.uid || "").trim();
          const docEmail = (data.userEmail || "").trim().toLowerCase();
          const rawAmount = typeof data.amount === "number" ? data.amount : (typeof data.amountINR === "number" ? data.amountINR : ((data.amountPaise || 0) / 100));
          const rawAmountPaise = data.amountPaise || (rawAmount ? rawAmount * 100 : 0);
          const resolvedProd = resolvePaymentProduct({
            planId: data.planId,
            amountINR: rawAmount,
            amountPaise: rawAmountPaise,
          });

          results.push({
            id: docSnap.id,
            paymentId: data.paymentId || docSnap.id,
            orderId: data.orderId || "",
            subscriptionId: data.subscriptionId || "",
            userId: docUid || uid,
            uid: docUid || uid,
            userEmail: docEmail || email,
            amount: rawAmount > 0 ? rawAmount : resolvedProd.displayPriceINR,
            amountINR: rawAmount > 0 ? rawAmount : resolvedProd.displayPriceINR,
            amountPaise: rawAmountPaise > 0 ? rawAmountPaise : resolvedProd.displayPriceINR * 100,
            currency: data.currency || "INR",
            status: (data.status || "COMPLETED").toString(),
            planId: resolvedProd.internalProductId,
            planName: resolvedProd.productName,
            plan: resolvedProd.productName,
            entitlementGranted: data.entitlementGranted || "",
            signatureVerified: Boolean(data.signatureVerified),
            source: data.source || "razorpay",
            paymentMethod: data.paymentMethod || "Razorpay Live Gateway",
            invoiceNo: data.invoiceNo || `INV-RZP-${docSnap.id.substring(docSnap.id.length - 6).toUpperCase()}`,
            reconciledAt: data.reconciledAt || data.createdAt || new Date().toISOString(),
            createdAt: data.createdAt || data.reconciledAt || new Date().toISOString(),
            timestamp: data.createdAt || data.reconciledAt || new Date().toISOString(),
            date: data.createdAt ? data.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          });
        });

        results.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        onUpdate(results);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "transactions");
        // Fallback to fetch one-time
        fetchUserTransactionsFromFirestore(userParam).then(onUpdate).catch(() => {});
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "transactions");
    return () => {};
  }
}


/**
 * Delete a tool feedback document from Firestore
 */
export async function deleteToolFeedbackFromFirestore(id: string): Promise<boolean> {
  try {
    const firestore = getFirestoreDb();
    const docRef = doc(firestore, "tool_feedback", id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error("[Firestore] Error deleting tool_feedback:", err);
    return false;
  }
}

/**
 * Fetch feedback reviews for a specific tool ID from Firestore
 */
export async function fetchFeedbackFromFirestore(toolId: string): Promise<FirestoreFeedbackItem[]> {
  try {
    const firestore = getFirestoreDb();
    const colRef = collection(firestore, "feedback_comments");
    const q = query(
      colRef,
      where("toolId", "==", toolId),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    const items: FirestoreFeedbackItem[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        toolId: data.toolId,
        toolName: data.toolName,
        userName: data.userName,
        userEmail: data.userEmail,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt,
        helpfulCount: data.helpfulCount || 0,
        status: data.status,
        verifiedUser: data.verifiedUser
      });
    });
    return items;
  } catch (err) {
    console.error("[Firestore] Error fetching feedback from Firestore:", err);
    return [];
  }
}
