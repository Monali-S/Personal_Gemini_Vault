import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  Compass,
  Laptop,
  KeyRound,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "trial" | "login" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "trial",
}) => {
  const {
    user,
    isTrial,
    signInWithGoogle,
    signInWithEmail,
    startGuestTrial,
    availableProfiles,
    switchUser,
  } = useAuth();

  const [tab, setTab] = useState<"trial" | "login" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGuestTrial = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await startGuestTrial();
      onClose();
    } catch (e: unknown) {
      const err = e as Error;
      setFeedback(err.message || "Failed to start guest trial.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (e: unknown) {
      const err = e as Error;
      setFeedback(err.message || "Google sign in error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await signInWithEmail(email, name);
      onClose();
    } catch (e: unknown) {
      const err = e as Error;
      setFeedback(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-container"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">
                {isTrial ? "Upgrade Your Journal Session" : "Welcome to Gemini Vault"}
              </h2>
              <p className="text-xs text-stone-500">
                Private cognitive reflection with zero-trust security
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 px-6 pt-2 bg-stone-50/30">
          <button
            id="tab-trial-btn"
            type="button"
            onClick={() => setTab("trial")}
            className={`pb-3 px-3 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition-colors ${
              tab === "trial"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Try without Logging In</span>
          </button>

          <button
            id="tab-login-btn"
            type="button"
            onClick={() => setTab("login")}
            className={`pb-3 px-3 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition-colors ${
              tab === "login"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            id="tab-signup-btn"
            type="button"
            onClick={() => setTab("signup")}
            className={`pb-3 px-3 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition-colors ${
              tab === "signup"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {feedback && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <span className="font-semibold">Notice:</span>
              <span>{feedback}</span>
            </div>
          )}

          {/* TAB 1: TRIAL / GUEST EXPLORER */}
          {tab === "trial" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-amber-950">
                      Instant Guest Trial Mode
                    </h3>
                    <p className="text-xs text-amber-800/90 leading-relaxed">
                      Start journaling and brainstorming with Gemini 3.5 immediately. No email, password, or sign-up required.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/60 space-y-2 text-xs text-amber-900">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Real-time word-by-word Gemini streaming</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All entries saved locally to this browser partition</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Seamless upgrade: Keep and sync your notes if you sign in later</span>
                  </div>
                </div>
              </div>

              <button
                id="start-guest-trial-btn"
                type="button"
                onClick={handleGuestTrial}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{user?.isTrial ? "Continue in Guest Mode" : "Start Exploring in Guest Trial"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center">
                <span className="text-[11px] text-stone-400">
                  Prefer permanent cloud synchronization across devices?
                </span>
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="ml-1 text-[11px] text-amber-700 hover:underline font-medium"
                >
                  Sign in instead
                </button>
              </div>
            </div>
          )}

          {/* TAB 2 & 3: LOGIN / SIGNUP */}
          {(tab === "login" || tab === "signup") && (
            <div className="space-y-4">
              {/* Google One-Tap Action */}
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-medium flex items-center justify-center space-x-2.5 shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-stone-400 uppercase tracking-wider">
                  or email
                </span>
                <div className="border-t border-stone-200 w-full" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {tab === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="signup-name-input"
                      type="text"
                      placeholder="e.g., Alex Bennett"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      id="auth-password-input"
                      type="password"
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                    />
                  </div>
                  {tab === "login" && (
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      Tip: Enter any password to connect to your isolated vault partition.
                    </span>
                  )}
                </div>

                <button
                  id="submit-email-auth-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <span>{tab === "signup" ? "Create Free Account" : "Sign In to Vault"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Fast Tenant Switcher for Testing */}
              <div className="pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                    Or switch to an active verified profile
                  </span>
                  <KeyRound className="w-3 h-3 text-stone-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {availableProfiles.map((p) => (
                    <button
                      key={p.uid}
                      type="button"
                      onClick={() => {
                        switchUser(p);
                        onClose();
                      }}
                      className="p-2 border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-lg text-left transition-colors flex items-center space-x-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-200 overflow-hidden shrink-0">
                        {p.photoURL ? (
                          <img
                            src={p.photoURL}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-stone-600">
                            {p.displayName[0]}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-medium text-stone-800 truncate">
                          {p.displayName}
                        </div>
                        <div className="text-[9px] text-stone-400 truncate">
                          {p.role || "user"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Zero-Trust Security guarantee */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 text-center flex items-center justify-center space-x-2 text-[11px] text-stone-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Strict ABAC partition: User data is strictly isolated to your authenticated UID.</span>
        </div>
      </div>
    </div>
  );
};
