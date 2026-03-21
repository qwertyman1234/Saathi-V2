import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { getProfile, setProfile, trackLogin } from "@/lib/firebase/firestore";
import { getRoleFromEmail, type UserRole } from "@/lib/utils";

export interface UserProfile {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  incomeRange: string;
  occupation: string;
  city: string;
  state: string;
  pincode: string;
  onboardingCompleted: boolean; // camelCase — matches Firestore
  onboardingStep: number;
  photoURL: string;
  role: UserRole; // "admin", "employee", or "user"
  createdAt?: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (u: User): Promise<UserProfile> => {
    setProfileLoading(true);
    try {
      const data = await getProfile(u.uid);
      if (data) {
        const p = data as UserProfile;
        setProfileState(p);
        return p;
      } else {
        // Auto-create profile on first login
        const newProfile: UserProfile = {
          userId: u.uid,
          fullName: u.displayName ?? "",
          email: u.email ?? "",
          phone: u.phoneNumber ?? "",
          photoURL: u.photoURL ?? "",
          dateOfBirth: "",
          gender: "",
          incomeRange: "",
          occupation: "",
          city: "",
          state: "",
          pincode: "",
          onboardingCompleted: false,
          onboardingStep: 1,
          role: getRoleFromEmail(u.email ?? ""),
        };
        await setProfile(u.uid, newProfile);
        setProfileState(newProfile);
        return newProfile;
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u);
        trackLogin(u.uid, u.email ?? undefined);
      } else {
        setProfileState(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone = "") => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await firebaseUpdateProfile(newUser, { displayName: fullName });
      await sendEmailVerification(newUser);
      const newProfile: UserProfile = {
        userId: newUser.uid, fullName, email, phone,
        photoURL: "", dateOfBirth: "", gender: "",
        incomeRange: "", occupation: "", city: "", state: "", pincode: "",
        onboardingCompleted: false, onboardingStep: 1,
        role: getRoleFromEmail(email),
      };
      await setProfile(newUser.uid, newProfile);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const existing = await getProfile(result.user.uid);
      if (!existing) {
        const newProfile: UserProfile = {
          userId: result.user.uid,
          fullName: result.user.displayName ?? "",
          email: result.user.email ?? "",
          phone: result.user.phoneNumber ?? "",
          photoURL: result.user.photoURL ?? "",
          dateOfBirth: "", gender: "", incomeRange: "", occupation: "",
          city: "", state: "", pincode: "",
          onboardingCompleted: false, onboardingStep: 1,
          role: getRoleFromEmail(result.user.email ?? ""),
        };
        await setProfile(result.user.uid, newProfile);
      }
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfileState(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error("Not authenticated") };
    try {
      await setProfile(user.uid, updates);
      if (updates.fullName) {
        await firebaseUpdateProfile(user, { displayName: updates.fullName });
      }
      // Immediately update local state too
      setProfileState(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, profileLoading,
      signUp, signIn, signInWithGoogle, signOut,
      updateProfile, refreshProfile, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
