import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";
import { auth } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isTrial: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, name?: string) => Promise<void>;
  startGuestTrial: () => Promise<UserProfile>;
  switchUser: (profile: UserProfile) => void;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  availableProfiles: UserProfile[];
  isFirebaseConnected: boolean;
}

const DEFAULT_PROFILES: UserProfile[] = [
  {
    uid: "usr_alice_7701",
    email: "monalis3030@gmail.com",
    displayName: "Monalis",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    isAnonymous: false,
    isTrial: false,
    tier: "enterprise",
    role: "admin",
    isAdmin: true,
  },
  {
    uid: "usr_marcus_8820",
    email: "marcus.vance@company.internal",
    displayName: "Marcus Vance",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    isAnonymous: false,
    isTrial: false,
    tier: "standard",
    role: "author",
  },
  {
    uid: "usr_elena_4412",
    email: "elena.security@fintech.dev",
    displayName: "Elena Rostova",
    photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    isAnonymous: false,
    isTrial: false,
    tier: "standard",
    role: "author",
  },
];

const CURRENT_USER_KEY = "gemini_journal_active_session";
const GUEST_TRIAL_ID_KEY = "gemini_journal_guest_trial_id";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setIsFirebaseConnected(true);
      } else {
        signInAnonymously(auth)
          .then(() => setIsFirebaseConnected(true))
          .catch((err) => {
            console.warn("Firebase anonymous auth fallback:", err.message);
          });
      }
    });
    return () => unsubscribe();
  }, []);

  // Initialize or restore session
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(CURRENT_USER_KEY);
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      } else {
        // Default to active profile (Monalis) for rich preview, or guest if needed
        const initialUser = DEFAULT_PROFILES[0];
        setUser(initialUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(initialUser));
      }
    } catch {
      setUser(DEFAULT_PROFILES[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Generate or retrieve guest trial user
  const startGuestTrial = async (): Promise<UserProfile> => {
    setLoading(true);
    try {
      let guestUid = localStorage.getItem(GUEST_TRIAL_ID_KEY);
      if (!guestUid) {
        guestUid = "guest_" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(GUEST_TRIAL_ID_KEY, guestUid);
      }

      const guestUser: UserProfile = {
        uid: guestUid,
        email: "guest@trial.local",
        displayName: "Guest Explorer",
        isAnonymous: true,
        isTrial: true,
        tier: "trial",
        role: "author",
      };

      setUser(guestUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(guestUser));
      setIsAuthModalOpen(false);
      return guestUser;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const previousUid = user?.isTrial ? user.uid : null;
      const defaultUser = DEFAULT_PROFILES[0];
      setUser(defaultUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
      setIsAuthModalOpen(false);

      // Auto-migrate trial entries if upgrading from guest trial
      if (previousUid && previousUid !== defaultUser.uid) {
        const { StorageService } = await import("./storage");
        await StorageService.migrateGuestEntries(previousUid, defaultUser.uid);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, name?: string) => {
    setLoading(true);
    try {
      const previousUid = user?.isTrial ? user.uid : null;
      const cleanEmail = email.trim().toLowerCase();
      const generatedUid = "usr_" + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, "").substring(0, 12);
      const newUser: UserProfile = {
        uid: generatedUid,
        email: cleanEmail,
        displayName: name || cleanEmail.split("@")[0],
        isAnonymous: false,
        isTrial: false,
        tier: "standard",
        role: "author",
      };
      setUser(newUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      setIsAuthModalOpen(false);

      // Auto-migrate trial entries if upgrading from guest trial
      if (previousUid && previousUid !== generatedUid) {
        const { StorageService } = await import("./storage");
        await StorageService.migrateGuestEntries(previousUid, generatedUid);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchUser = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    // When signed out, open modal to let user choose trial or sign in
    setIsAuthModalOpen(true);
  };

  const isTrial = Boolean(user?.isTrial || user?.isAnonymous);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isTrial,
        signInWithGoogle,
        signInWithEmail,
        startGuestTrial,
        switchUser,
        signOut,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        availableProfiles: DEFAULT_PROFILES,
        isFirebaseConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
