// Claim document helpers added to firestore.ts

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, onSnapshot,
  serverTimestamp, Timestamp, arrayUnion,
} from "firebase/firestore";
import { db } from "./config";

export const tsNow = () => serverTimestamp();
export const toDate = (ts: any): string =>
  ts instanceof Timestamp ? ts.toDate().toISOString() : ts ?? "";

// ── PROFILES ──────────────────────────────────────────────────────────────────
export async function getProfile(uid: string) {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function setProfile(uid: string, data: Record<string, any>) {
  await setDoc(doc(db, "profiles", uid), { ...data, updatedAt: tsNow() }, { merge: true });
}

export function subscribeProfile(uid: string, cb: (data: any) => void) {
  try {
    return onSnapshot(doc(db, "profiles", uid), (snap) => {
      cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, (error) => {
      console.error("Error fetching profile:", error);
      cb(null);
    });
  } catch (error) {
    console.error("Error setting up profile subscription:", error);
    cb(null);
    return () => {};
  }
}

// ── FAMILY MEMBERS ────────────────────────────────────────────────────────────
export function subscribeFamilyMembers(uid: string, cb: (data: any[]) => void) {
  try {
    const q = query(
      collection(db, "familyMembers"),
      where("userId", "==", uid),
      orderBy("createdAt", "asc")
    );
    console.log(`[FamilyMembers] Setting up real-time listener for user: ${uid}`);
    let hasInitialized = false;
    return onSnapshot(q, (snap) => {
      const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`[FamilyMembers] Snapshot received with ${members.length} members:`, members);
      cb(members);
      hasInitialized = true;
    }, (error) => {
      console.error("[FamilyMembers] Firebase error:", error);
      // Only call with empty array on first initialization if there's an error
      if (!hasInitialized) {
        console.log("[FamilyMembers] Initial error - returning empty array");
        cb([]);
        hasInitialized = true;
      } else {
        // On subsequent errors, don't call the callback - keep previous data
        console.log("[FamilyMembers] Error after initialization - keeping existing data");
      }
    });
  } catch (error) {
    console.error("[FamilyMembers] Error setting up subscription:", error);
    // Initial callback to prevent hanging
    cb([]);
    return () => {};
  }
}

export async function addFamilyMember(uid: string, member: Record<string, any>) {
  console.log(`[FamilyMembers] Adding new member for user ${uid}:`, member);
  try {
    const docRef = await addDoc(collection(db, "familyMembers"), {
      ...member, userId: uid, createdAt: tsNow(),
    });
    console.log(`[FamilyMembers] Successfully created member with ID: ${docRef.id}`);
    return docRef;
  } catch (error) {
    console.error(`[FamilyMembers] Failed to add member:`, error);
    throw error;
  }
}

export async function deleteFamilyMember(id: string) {
  return deleteDoc(doc(db, "familyMembers", id));
}

// ── POLICIES ──────────────────────────────────────────────────────────────────
export function subscribePolicies(uid: string, cb: (data: any[]) => void) {
  try {
    const q = query(
      collection(db, "policies"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    console.log(`[Policies] Setting up real-time listener for user: ${uid}`);
    let hasInitialized = false;
    return onSnapshot(q, (snap) => {
      const policies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`[Policies] Snapshot received with ${policies.length} policies:`, policies);
      cb(policies);
      hasInitialized = true;
    }, (error) => {
      console.error("[Policies] Firebase error:", error);
      // Only call with empty array on first initialization if there's an error
      if (!hasInitialized) {
        console.log("[Policies] Initial error - returning empty array");
        cb([]);
        hasInitialized = true;
      } else {
        // On subsequent errors, don't call the callback - keep previous data
        console.log("[Policies] Error after initialization - keeping existing data");
      }
    });
  } catch (error) {
    console.error("[Policies] Error setting up subscription:", error);
    // Initial callback to prevent hanging
    cb([]);
    return () => {};
  }
}

export async function addPolicy(uid: string, policy: Record<string, any>) {
  return addDoc(collection(db, "policies"), {
    ...policy, userId: uid, createdAt: tsNow(), updatedAt: tsNow(),
  });
}

export async function updatePolicy(id: string, updates: Record<string, any>) {
  return updateDoc(doc(db, "policies", id), { ...updates, updatedAt: tsNow() });
}

export async function deletePolicy(id: string) {
  return deleteDoc(doc(db, "policies", id));
}

// ── CLAIMS ────────────────────────────────────────────────────────────────────
export function subscribeClaims(uid: string, cb: (data: any[]) => void) {
  try {
    const q = query(
      collection(db, "claims"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error fetching claims:", error);
      // Return empty array on error instead of crashing
      cb([]);
    });
  } catch (error) {
    console.error("Error setting up claims subscription:", error);
    // Initial callback to prevent hanging
    cb([]);
    return () => {};
  }
}

export async function submitClaim(uid: string, claim: Record<string, any>) {
  const claimNumber = `CLM-${Date.now().toString().slice(-8)}`;
  const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return addDoc(collection(db, "claims"), {
    ...claim,
    userId: uid,
    claimNumber,
    status: "Submitted",
    progress: 10,
    timeline: [
      { step: "Submitted", date: now, done: true },
      { step: "Under Review", date: "Pending", done: false },
      { step: "Documents Verified", date: "Pending", done: false },
      { step: "Approved", date: "Pending", done: false },
      { step: "Settled", date: "Pending", done: false },
    ],
    uploadedDocuments: [],
    missingDocuments: claim.missingDocuments ?? [],
    createdAt: tsNow(),
    updatedAt: tsNow(),
  });
}

export async function updateClaim(id: string, updates: Record<string, any>) {
  return updateDoc(doc(db, "claims", id), { ...updates, updatedAt: tsNow() });
}

// Add an uploaded document reference to a claim
export async function addDocumentToClaim(
  claimId: string,
  docInfo: { name: string; type: string; size: number; dataUrl: string; uploadedAt: string }
) {
  return updateDoc(doc(db, "claims", claimId), {
    uploadedDocuments: arrayUnion(docInfo),
    updatedAt: tsNow(),
  });
}

// ── CLAIM DOCUMENTS (stored as base64 in Firestore — no Storage needed) ───────
// For files < 900KB we store base64 directly. For larger files users see a warning.
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── CHAT MESSAGES ─────────────────────────────────────────────────────────────
export function subscribeChatMessages(uid: string, cb: (data: any[]) => void) {
  const q = query(
    collection(db, "chatMessages"),
    where("userId", "==", uid),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function saveChatMessage(uid: string, role: string, content: string, language = "en") {
  return addDoc(collection(db, "chatMessages"), {
    userId: uid, role, content, language, createdAt: tsNow(),
  });
}

export async function clearChatHistory(uid: string) {
  const q = query(collection(db, "chatMessages"), where("userId", "==", uid));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

// ── MEDICAL HISTORY ───────────────────────────────────────────────────────────
export async function getMedicalHistory(uid: string) {
  const snap = await getDoc(doc(db, "medicalHistory", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function setMedicalHistory(uid: string, data: Record<string, any>) {
  return setDoc(doc(db, "medicalHistory", uid), { ...data, userId: uid, updatedAt: tsNow() }, { merge: true });
}

// ── LOGIN LOGS ────────────────────────────────────────────────────────────────
export async function trackLogin(uid: string, email?: string) {
  return addDoc(collection(db, "loginLogs"), {
    userId: uid,
    email: email ?? null,
    timestamp: tsNow(),
  });
}
