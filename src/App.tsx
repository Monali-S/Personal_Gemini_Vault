/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/authContext";
import { Header } from "./components/Header";
import { GuestTrialBanner } from "./components/GuestTrialBanner";
import { AuthModal } from "./components/AuthModal";
import { BrainstormChat } from "./components/BrainstormChat";
import { VaultView } from "./components/VaultView";
import { SecurityConstitutionView } from "./components/SecurityConstitutionView";
import { CloudConfigView } from "./components/CloudConfigView";
import { StorageService } from "./lib/storage";
import { ActiveTab } from "./types";

function MainApp() {
  const { user, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("brainstorm");
  const [entryCount, setEntryCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const updateEntryCount = async () => {
    if (!user) {
      setEntryCount(0);
      return;
    }
    const entries = await StorageService.getEntries(user.uid);
    setEntryCount(entries.length);
  };

  useEffect(() => {
    updateEntryCount();
  }, [user?.uid, refreshTrigger]);

  const handleEntrySaved = () => {
    setRefreshTrigger((prev) => prev + 1);
    updateEntryCount();
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-stone-900">
      <GuestTrialBanner
        entryCount={entryCount}
        onOpenAuth={openAuthModal}
      />

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        entryCount={entryCount}
        onOpenAuth={openAuthModal}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === "brainstorm" && (
          <BrainstormChat
            onEntrySaved={handleEntrySaved}
            onOpenVault={() => setActiveTab("vault")}
          />
        )}

        {activeTab === "vault" && (
          <VaultView
            onNewBrainstorm={() => setActiveTab("brainstorm")}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === "security" && user?.role === "admin" && <SecurityConstitutionView />}

        {activeTab === "settings" && <CloudConfigView />}
      </main>

      <footer className="border-t border-slate-200 py-4 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Gemini Vault</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-600">Zero-Trust Enterprise Security</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Directives: AGENTS.md | GEMINI.md | firestore.rules
          </div>
        </div>
      </footer>

      {/* Global Hybrid Authentication / Guest Trial Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
