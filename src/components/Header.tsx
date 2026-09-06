import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { ActiveTab } from "../types";
import {
  ShieldCheck,
  BookOpen,
  MessageSquareText,
  Lock,
  Users,
  ChevronDown,
  LogOut,
  KeyRound,
  Compass,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  entryCount: number;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  entryCount,
  onOpenAuth,
}) => {
  const { user, isTrial, switchUser, signOut, availableProfiles, isFirebaseConnected } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Security Badge */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-semibold text-lg shadow-xs">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-800">
                  Gemini Vault
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                  {isFirebaseConnected ? "Firestore Live" : "ABAC Isolated"}
                </span>
                {isTrial && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Compass className="w-3 h-3 mr-1 text-amber-700" />
                    Guest Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Confidential Vault
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              id="tab-btn-brainstorm"
              onClick={() => setActiveTab("brainstorm")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "brainstorm"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Brainstorm & Chat</span>
            </button>

            <button
              id="tab-btn-vault"
              onClick={() => setActiveTab("vault")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "vault"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>My Vault</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "vault"
                    ? "bg-stone-700 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {entryCount}
              </span>
            </button>

            <button
              id="tab-btn-settings"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "settings"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Cloud Config</span>
            </button>
          </nav>

          {/* User Profile & Trial / Account Actions */}
          <div className="flex items-center space-x-2">
            {isTrial && (
              <button
                id="header-sign-in-btn"
                type="button"
                onClick={onOpenAuth}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Log In / Sign Up</span>
              </button>
            )}

            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs"
                aria-label="User profile and isolation menu"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                    isTrial
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-stone-100 text-stone-800 border-stone-200"
                  }`}
                >
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "G"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.displayName || "Guest User"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono leading-none">
                    {isTrial ? "Trial Session" : user?.uid.substring(0, 10) + "..."}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="p-2 border-b border-slate-100 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {isTrial ? "Guest Trial Active" : "Current Active Identity"}
                    </span>
                    <p className="text-sm font-bold text-slate-900">{user?.displayName}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      UID: {user?.uid}
                    </span>
                  </div>

                  <div className="p-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Test Multi-User Isolation
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                        Zero Leakage
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2 leading-snug">
                      Switching user immediately swaps tenant partitions to verify strict data segregation.
                    </p>

                    <div className="space-y-1">
                      {availableProfiles.map((profile) => (
                        <button
                          key={profile.uid}
                          onClick={() => switchUser(profile)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            user?.uid === profile.uid
                              ? "bg-amber-50 text-amber-900 font-bold border border-amber-200"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="truncate">
                            <p>{profile.displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{profile.email}</p>
                          </div>
                          {user?.uid === profile.uid && (
                            <span className="text-[10px] text-amber-800 font-mono ml-1 font-bold">Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-2 pt-1 space-y-1">
                    {isTrial ? (
                      <button
                        onClick={onOpenAuth}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-amber-800 hover:bg-amber-50 rounded-lg transition-colors font-semibold"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Log in to Sync Notes</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Switch to Guest</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
