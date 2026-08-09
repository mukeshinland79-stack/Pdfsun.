import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
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
  Firestore
} from "firebase/firestore";
import firebaseConfigData from "../../firebase-applet-config.json";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp({
        apiKey: firebaseConfigData.apiKey,
        authDomain: firebaseConfigData.authDomain,
        projectId: firebaseConfigData.projectId,
        storageBucket: firebaseConfigData.storageBucket,
        messagingSenderId: firebaseConfigData.messagingSenderId,
        appId: firebaseConfigData.appId
      });
    }
  }
  return app;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    db = getFirestore(
      firebaseApp,
      firebaseConfigData.firestoreDatabaseId || "(default)"
    );
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
