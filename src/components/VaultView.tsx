import React, { useState, useEffect } from "react";
import { JournalEntry } from "../types";
import { useAuth } from "../lib/authContext";
import { StorageService } from "../lib/storage";
import { decryptText } from "../lib/crypto";
import {
  Lock,
  Unlock,
  Trash2,
  Download,
  Search,
  Tag,
  CheckSquare,
  Square,
  Calendar,
  Sparkles,
  Lightbulb,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Pencil,
  Check,
  X,
  Compass,
} from "lucide-react";

interface VaultViewProps {
  onNewBrainstorm: () => void;
  refreshTrigger: number;
}

export const VaultView: React.FC<VaultViewProps> = ({ onNewBrainstorm, refreshTrigger }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("ALL");

  // Decryption state map { [entryId]: decryptedText }
  const [decryptedMap, setDecryptedMap] = useState<Record<string, any>>({});
  const [decryptPassphrases, setDecryptPassphrases] = useState<Record<string, string>>({});
  const [decryptErrors, setDecryptErrors] = useState<Record<string, string>>({});

  // Inline entry title editing
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>("");

  const handleStartEditTitle = (entry: JournalEntry) => {
    setEditingTitleId(entry.id);
    setEditingTitleValue(entry.title);
  };

  const handleSaveEntryTitle = async (entry: JournalEntry) => {
    if (!user) return;
    const trimmed = editingTitleValue.trim();
    if (!trimmed || trimmed === entry.title) {
      setEditingTitleId(null);
      return;
    }

    const updatedEntry: JournalEntry = {
      ...entry,
      title: trimmed,
      updatedAt: new Date().toISOString(),
    };

    try {
      await StorageService.updateEntry(user.uid, updatedEntry);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? updatedEntry : e)));
    } catch (err) {
      console.error("Failed to update entry title:", err);
    } finally {
      setEditingTitleId(null);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user?.uid, refreshTrigger]);

  const loadEntries = async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await StorageService.getEntries(user.uid);
      setEntries(data);
    } catch (e) {
      console.error("Failed to load user vault entries:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    if (!window.confirm("Permanently delete this journal entry from your isolated partition?")) {
      return;
    }

    await StorageService.deleteEntry(user.uid, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleDecrypt = async (entry: JournalEntry) => {
    const pass = decryptPassphrases[entry.id];
    if (!pass) {
      setDecryptErrors((prev) => ({ ...prev, [entry.id]: "Enter your passphrase to decrypt." }));
      return;
    }

    if (!entry.encryptedData || !entry.iv || !entry.salt) {
      setDecryptErrors((prev) => ({ ...prev, [entry.id]: "Corrupt encryption metadata." }));
      return;
    }

    try {
      const decryptedPlaintext = await decryptText(
        entry.encryptedData,
        entry.iv,
        entry.salt,
        pass
      );
      const parsed = JSON.parse(decryptedPlaintext);
      setDecryptedMap((prev) => ({ ...prev, [entry.id]: parsed }));
      setDecryptErrors((prev) => ({ ...prev, [entry.id]: "" }));
    } catch (err) {
      setDecryptErrors((prev) => ({
        ...prev,
        [entry.id]: "Incorrect passphrase or authentication tag failure.",
      }));
    }
  };

  const handleToggleActionItem = async (entry: JournalEntry, actionIdx: number) => {
    if (!user) return;
    const currentActions = [...entry.actionItems];
    const currentText = currentActions[actionIdx];
    if (!currentText) return;

    // Toggle checked marker [x]
    if (currentText.startsWith("[x] ")) {
      currentActions[actionIdx] = currentText.replace("[x] ", "");
    } else {
      currentActions[actionIdx] = "[x] " + currentText;
    }

    const updated = { ...entry, actionItems: currentActions };
    await StorageService.updateEntry(user.uid, updated);
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
  };

  const handleExportMarkdown = (entry: JournalEntry) => {
    const isDecrypted = !!decryptedMap[entry.id];
    const content = isDecrypted ? decryptedMap[entry.id] : entry;

    const md = `# ${entry.title}
*Date: ${new Date(entry.createdAt).toLocaleDateString()} | Mood: ${entry.mood} | Partition: ${entry.userId}*

## Executive Summary
${content.summary || entry.summary}

## Key Themes
${entry.keyThemes.map((t) => `- ${t}`).join("\n")}

## Action Items
${(content.actionItems || entry.actionItems).map((a: string) => `- [ ] ${a}`).join("\n")}

## Cognitive Insights
${(content.cognitiveInsights || entry.cognitiveInsights).map((c: string) => `> ${c}`).join("\n\n")}

---
*Exported from Personal Gemini Journal (Zero-Trust Partition)*
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entry.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered list
  const availableMoods = Array.from(new Set(entries.map((e) => e.mood).filter(Boolean)));
  const filteredEntries = entries.filter((entry) => {
    const matchesQuery =
      searchQuery === "" ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.keyThemes.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood = selectedMood === "ALL" || entry.mood === selectedMood;
    return matchesQuery && matchesMood;
  });

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Header & Isolation Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Archived Sessions &amp; Firestore Vault
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              UID: {user?.uid.substring(0, 12)}
            </span>
            {user?.isTrial && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <Compass className="w-3 h-3 mr-1 text-amber-700" />
                Local Trial Partition
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.isTrial
              ? "Guest mode: your notes are securely isolated locally. Log in anytime to sync seamlessly."
              : "Strict user-UID boundary enforcement on all Firestore records. Zero cross-tenant data leakage."}
          </p>
        </div>

        <button
          id="new-brainstorm-btn"
          onClick={onNewBrainstorm}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Reflection Session</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="vault-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, themes, or insights..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Mood filter pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedMood("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              selectedMood === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({entries.length})
          </button>
          {availableMoods.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedMood === mood
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List or Empty State */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Decrypting and loading isolated partition...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchQuery ? "No matching reflections found" : "Your Vault is Empty"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? "Try adjusting your search keywords or mood filter."
              : "Every conversation with Gemini can be synthesized into an executive summary, action checklist, and cognitive insight card stored safely here."}
          </p>
          {!searchQuery && (
            <button
              onClick={onNewBrainstorm}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Brainstorming</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEntries.map((entry) => {
            const isEncrypted = entry.isEncrypted;
            const decryptedData = decryptedMap[entry.id];
            const isDecrypted = !!decryptedData;

            const displaySummary = isDecrypted
              ? decryptedData.summary
              : entry.summary;
            const displayActionItems = isDecrypted
              ? decryptedData.actionItems || []
              : entry.actionItems || [];
            const displayInsights = isDecrypted
              ? decryptedData.cognitiveInsights || []
              : entry.cognitiveInsights || [];

            return (
              <article
                key={entry.id}
                className="bg-white rounded-xl border-l-4 border-l-blue-500 border-y border-r border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      {editingTitleId === entry.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEntryTitle(entry);
                              if (e.key === "Escape") setEditingTitleId(null);
                            }}
                            autoFocus
                            className="text-base font-bold text-slate-800 px-2 py-0.5 rounded border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50/30"
                          />
                          <button
                            onClick={() => handleSaveEntryTitle(entry)}
                            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            title="Save entry title"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTitleId(null)}
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 group">
                          <h2 className="text-base font-bold text-slate-800">
                            {entry.title}
                          </h2>
                          <button
                            onClick={() => handleStartEditTitle(entry)}
                            className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                            title="Rename this journal entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {isEncrypted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {isDecrypted ? (
                            <>
                              <Unlock className="w-3 h-3 mr-1 text-emerald-500" />
                              Decrypted (AES-GCM)
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 mr-1 text-blue-600" />
                              Encrypted (Zero-Knowledge)
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        Mood: {entry.mood}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Export, Delete) */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleExportMarkdown(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Export as Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete entry from partition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Themes Chips */}
                {entry.keyThemes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.keyThemes.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded"
                      >
                        <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Zero-Knowledge Passphrase Decryption Form if locked */}
                {isEncrypted && !isDecrypted ? (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Zero-Knowledge Protected Payload
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      This reflection was encrypted in your browser using AES-GCM 256-bit with PBKDF2 key derivation.
                      Enter your passphrase to decrypt:
                    </p>
                    <div className="flex items-center justify-center space-x-2 max-w-xs mx-auto pt-1">
                      <input
                        type="password"
                        placeholder="Passphrase"
                        value={decryptPassphrases[entry.id] || ""}
                        onChange={(e) =>
                          setDecryptPassphrases({
                            ...decryptPassphrases,
                            [entry.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleDecrypt(entry);
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                      />
                      <button
                        onClick={() => handleDecrypt(entry)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        Decrypt
                      </button>
                    </div>
                    {decryptErrors[entry.id] && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {decryptErrors[entry.id]}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Executive Summary */}
                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {displaySummary}
                    </div>

                    {/* Action Items */}
                    {displayActionItems.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Action Checklist
                        </div>
                        <div className="space-y-1">
                          {displayActionItems.map((action: string, idx: number) => {
                            const isDone = action.startsWith("[x] ");
                            const cleanText = isDone ? action.replace("[x] ", "") : action;

                            return (
                              <button
                                key={idx}
                                onClick={() => handleToggleActionItem(entry, idx)}
                                className="w-full text-left flex items-start space-x-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-xs"
                              >
                                {isDone ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                )}
                                <span
                                  className={
                                    isDone
                                      ? "line-through text-slate-400"
                                      : "text-slate-800 font-medium"
                                  }
                                >
                                  {cleanText}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cognitive Insights */}
                    {displayInsights.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                          <Lightbulb className="w-3 h-3 text-blue-600" />
                          <span>Mindset Reflections</span>
                        </div>
                        <div className="space-y-1">
                          {displayInsights.map((insight: string, idx: number) => (
                            <div
                              key={idx}
                              className="text-[11px] text-slate-700 bg-blue-50/50 border border-blue-200/60 p-2 rounded-lg"
                            >
                              {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
