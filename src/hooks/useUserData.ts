// src/hooks/useUserData.ts
// All real-time Firebase data hooks — replaces Supabase hooks entirely

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeFamilyMembers, addFamilyMember, deleteFamilyMember,
  subscribePolicies, addPolicy, updatePolicy, deletePolicy,
  subscribeClaims, submitClaim, updateClaim,
  subscribeChatMessages, saveChatMessage, clearChatHistory,
} from "@/lib/firebase/firestore";
import { uploadFile, getFileUrl, deleteFile } from "@/lib/firebase/storage";
import { db } from "@/lib/firebase/config";
import {
  collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";

// ─── Family Members ────────────────────────────────────────────────────────────
export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relation: string;
  dateOfBirth: string;
  gender: string;
  conditions: string[];
  createdAt: any;
}

export function useFamilyMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    console.log(`[useFamilyMembers] Setting up subscription for user: ${user.uid}`);
    setLoading(true);
    const unsub = subscribeFamilyMembers(user.uid, (data) => {
      console.log(`[useFamilyMembers] Members updated, count: ${data.length}`, data);
      setMembers(data as FamilyMember[]);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const add = async (member: Omit<FamilyMember, "id" | "userId" | "createdAt">) => {
    if (!user) return { error: new Error("Not authenticated") };
    try {
      console.log(`[useFamilyMembers] Adding member:`, member);
      await addFamilyMember(user.uid, member);
      console.log(`[useFamilyMembers] Member added successfully`);
      return { error: null };
    }
    catch (e: any) {
      console.error(`[useFamilyMembers] Error adding member:`, e);
      return { error: e };
    }
  };

  const remove = async (id: string) => {
    try {
      console.log(`[useFamilyMembers] Removing member: ${id}`);
      await deleteFamilyMember(id);
      console.log(`[useFamilyMembers] Member removed successfully`);
      return { error: null };
    }
    catch (e: any) {
      console.error(`[useFamilyMembers] Error removing member:`, e);
      return { error: e };
    }
  };

  return { members, loading, addMember: add, removeMember: remove };
}

// ─── Policies ─────────────────────────────────────────────────────────────────
export interface Policy {
  id: string;
  userId: string;
  name: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: string;
  startDate: string;
  expiryDate: string;
  policyType: string;
  status: string;
  documentPath?: string;
  documentUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export function usePolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribePolicies(user.uid, (data) => {
      setPolicies(data as Policy[]);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const add = async (policy: Omit<Policy, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return { error: new Error("Not authenticated") };
    try { await addPolicy(user.uid, policy); return { error: null }; }
    catch (e: any) { return { error: e }; }
  };

  const update = async (id: string, updates: Partial<Policy>) => {
    try { await updatePolicy(id, updates); return { error: null }; }
    catch (e: any) { return { error: e }; }
  };

  const remove = async (id: string) => {
    try { await deletePolicy(id); return { error: null }; }
    catch (e: any) { return { error: e }; }
  };

  return { policies, loading, addPolicy: add, updatePolicy: update, removePolicy: remove };
}

// ─── Claims ───────────────────────────────────────────────────────────────────
export interface Claim {
  id: string;
  userId: string;
  policyId?: string;
  claimNumber: string;
  procedureName: string;
  patientName: string;
  hospitalName: string;
  claimAmount: number;
  approvedAmount?: number;
  incidentDate: string;
  submissionDate: string;
  status: string;
  notes?: string;
  missingDocuments?: string[];
  uploadedDocuments?: any[];
  progress: number;
  timeline: { step: string; date: string; done: boolean }[];
  createdAt: any;
  updatedAt: any;
}

export function useClaims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setClaims([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    try {
      const unsub = subscribeClaims(user.uid, (data) => {
        if (isMounted) {
          setClaims(data as Claim[]);
          setLoading(false); // Set loading to false once data arrives
        }
      });

      return () => {
        isMounted = false;
        unsub?.();
      };
    } catch (err: any) {
      if (isMounted) {
        setError(err);
        setLoading(false);
      }
    }
  }, [user]);

  const submit = async (claim: Omit<Claim, "id" | "userId" | "claimNumber" | "createdAt" | "updatedAt">) => {
    if (!user) return { error: new Error("Not authenticated") };
    try {
      await submitClaim(user.uid, claim);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const update = async (id: string, updates: Partial<Claim>) => {
    try {
      await updateClaim(id, updates);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  return { claims, loading, error, submitClaim: submit, updateClaim: update };
}

// ─── Chat History ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  createdAt: any;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeChatMessages(user.uid, (data) => {
      setMessages(data as ChatMessage[]);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const save = async (role: "user" | "assistant", content: string, language = "en") => {
    if (!user) return;
    await saveChatMessage(user.uid, role, content, language);
  };

  const clear = async () => {
    if (!user) return;
    await clearChatHistory(user.uid);
  };

  return { messages, loading, saveMessage: save, clearHistory: clear };
}

// ─── Documents ────────────────────────────────────────────────────────────────
export interface UserDocument {
  id: string;
  userId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: any;
}

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, "userDocuments"),
      where("userId", "==", user.uid),
      orderBy("uploadedAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserDocument[]);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const upload = async (
    file: File,
    documentType: string,
    onProgress?: (pct: number) => void
  ) => {
    if (!user) return { error: new Error("Not authenticated"), url: null };
    try {
      const { path, url } = await uploadFile(user.uid, documentType, file, onProgress);
      await addDoc(collection(db, "userDocuments"), {
        userId: user.uid,
        documentType,
        fileName: file.name,
        filePath: path,
        fileUrl: url,
        fileSize: file.size,
        uploadedAt: serverTimestamp(),
      });
      return { error: null, url };
    } catch (e: any) {
      return { error: e, url: null };
    }
  };

  const remove = async (id: string, filePath: string) => {
    try {
      await deleteFile(filePath);
      await deleteDoc(doc(db, "userDocuments", id));
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  return { documents, loading, uploadDocument: upload, deleteDocument: remove };
}
