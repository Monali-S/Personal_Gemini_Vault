import React from "react";
import { useAuth } from "../lib/authContext";
import { Sparkles, ArrowRight, ShieldCheck, HardDrive } from "lucide-react";

interface GuestTrialBannerProps {
  entryCount: number;
  onOpenAuth: () => void;
}

export const GuestTrialBanner: React.FC<GuestTrialBannerProps> = ({
  entryCount,
  onOpenAuth,
}) => {
  const { isTrial } = useAuth();

  if (!isTrial) return null;

  return (
    <div
      id="guest-trial-banner"
      className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-200/80 px-4 py-2.5 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs text-amber-950">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-800 uppercase tracking-wide">
            Guest Trial
          </span>
          <span className="text-stone-700">
            You are exploring without logging in.
            {entryCount > 0 ? (
              <span className="font-semibold text-stone-900 ml-1">
                ({entryCount} local {entryCount === 1 ? "entry" : "entries"} saved to this browser)
              </span>
            ) : (
              <span className="text-stone-500 ml-1">Entries are saved locally.</span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden md:flex items-center space-x-1 text-stone-500 text-[11px]">
            <HardDrive className="w-3 h-3 text-stone-400" />
            <span>Local sandbox</span>
          </div>

          <button
            id="upgrade-from-trial-btn"
            type="button"
            onClick={onOpenAuth}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>Log in to Sync & Protect</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
