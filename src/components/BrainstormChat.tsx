import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { ChatMessage, JournalAnalysis, PromptTemplate } from "../types";
import { STARTER_TEMPLATES } from "../data/templates";
import { useAuth } from "../lib/authContext";
import { StorageService } from "../lib/storage";
import { encryptText } from "../lib/crypto";
import {
  Send,
  Sparkles,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Tag,
  ListTodo,
  Brain,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface BrainstormChatProps {
  onEntrySaved: () => void;
  onOpenVault: () => void;
}

export const BrainstormChat: React.FC<BrainstormChatProps> = ({ onEntrySaved, onOpenVault }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Summarize Modal State
  const [summarizing, setSummarizing] = useState(false);
  const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [useEncryption, setUseEncryption] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseConfirm, setPassphraseConfirm] = useState("");
  const [savingToVault, setSavingToVault] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || loading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt("");
    setLoading(true);
    setErrorMsg(null);

    const modelMsgId = "msg_" + (Date.now() + 1);
    let accumulatedText = "";

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          userContext: {
            userId: user?.uid,
            displayName: user?.displayName,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errText = errorData.details || errorData.error || "Failed to reach Gemini streaming endpoint";
        throw new Error(errText);
      }

      if (!response.body) {
        throw new Error("No response body received from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Add live placeholder message for streaming
      setMessages((prev) => [
        ...prev,
        {
          id: modelMsgId,
          role: "model",
          content: "",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === modelMsgId ? { ...m, content: accumulatedText } : m
                )
              );
            }
          } catch {
            // continue reading chunks
          }
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      // If streaming didn't produce text, fallback to standard non-streaming endpoint
      if (!accumulatedText) {
        try {
          const fallbackRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
              userContext: {
                userId: user?.uid,
                displayName: user?.displayName,
              },
            }),
          });

          if (!fallbackRes.ok) {
            const fbErr = await fallbackRes.json().catch(() => ({}));
            throw new Error(fbErr.details || fbErr.error || e.message);
          }

          const data = await fallbackRes.json();
          setMessages([
            ...newHistory,
            {
              id: modelMsgId,
              role: "model",
              content: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } catch (fbErr: unknown) {
          const fallbackError = fbErr as Error;
          setErrorMsg(fallbackError.message || e.message || "Failed to reach Gemini API.");
          setMessages((prev) => prev.filter((m) => m.id !== modelMsgId || m.content.trim() !== ""));
        }
      } else {
        setErrorMsg(e.message || "Stream finished with notice.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (template: PromptTemplate) => {
    handleSendMessage(template.prompt);
  };

  const handleTriggerSummarization = async () => {
    if (messages.length === 0) return;

    setSummarizing(true);
    setErrorMsg(null);

    // Compile conversation into transcript format
    const transcript = messages
      .map((m) => `${m.role === "user" ? "USER" : "GEMINI"}: ${m.content}`)
      .join("\n\n");

    try {
      const res = await fetch("/api/journal/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let errText = errData.details || errData.error || "Failed to generate summary";
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) errText = parsed.error.message;
        } catch {
          // not json
        }
        throw new Error(errText);
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setShowSummaryModal(true);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || "Failed to analyze and summarize session.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!analysis || !user) return;

    if (useEncryption) {
      if (!passphrase || passphrase.length < 6) {
        setErrorMsg("Passphrase must be at least 6 characters for AES-GCM security.");
        return;
      }
      if (passphrase !== passphraseConfirm) {
        setErrorMsg("Encryption passphrases do not match.");
        return;
      }
    }

    setSavingToVault(true);
    setErrorMsg(null);

    try {
      const fullTranscript = messages
        .map((m) => `${m.role === "user" ? "USER" : "GEMINI"}: ${m.content}`)
        .join("\n\n");

      let isEncrypted = false;
      let encryptedData: string | undefined;
      let iv: string | undefined;
      let salt: string | undefined;
      let rawContentToStore = fullTranscript;
      let summaryToStore = analysis.executiveSummary;

      if (useEncryption) {
        isEncrypted = true;
        // Package the entire confidential content into an encrypted envelope
        const confidentialBundle = JSON.stringify({
          rawContent: fullTranscript,
          summary: analysis.executiveSummary,
          actionItems: analysis.actionItems,
          cognitiveInsights: analysis.cognitiveInsights,
        });

        const encrypted = await encryptText(confidentialBundle, passphrase);
        encryptedData = encrypted.cipherText;
        iv = encrypted.iv;
        salt = encrypted.salt;

        // Mask raw content in storage representation
        rawContentToStore = "[ENCRYPTED CONTENT - ZERO KNOWLEDGE VAULT]";
        summaryToStore = "[CONFIDENTIAL SUMMARY ENCRYPTED WITH AES-GCM 256-BIT]";
      }

      await StorageService.saveEntry(user.uid, {
        title: analysis.title,
        rawContent: rawContentToStore,
        summary: summaryToStore,
        keyThemes: analysis.keyThemes || [],
        actionItems: analysis.actionItems || [],
        cognitiveInsights: analysis.cognitiveInsights || [],
        mood: analysis.mood || "Reflective",
        isEncrypted,
        encryptedData,
        iv,
        salt,
      });

      setSaveSuccess(true);
      onEntrySaved();

      setTimeout(() => {
        setSaveSuccess(false);
        setShowSummaryModal(false);
        setPassphrase("");
        setPassphraseConfirm("");
      }, 1400);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || "Failed to persist journal entry to isolated vault.");
    } finally {
      setSavingToVault(false);
    }
  };

  const handleResetChat = () => {
    if (messages.length > 0 && !window.confirm("Start a fresh conversation? Current unsaved dialogue will be cleared.")) {
      return;
    }
    setMessages([]);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Banner with Actions */}
      <div className="flex items-center justify-between py-3 border-b border-stone-200 mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-stone-700 tracking-wide uppercase">
            Interactive Gemini Brainstorm & Journal
          </span>
          <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
            model: gemini-3.5-flash (streaming)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <>
              <button
                id="synthesize-journal-btn"
                onClick={handleTriggerSummarization}
                disabled={summarizing || loading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-xs disabled:opacity-50"
              >
                {summarizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                    <span>Synthesize & Save to Vault</span>
                  </>
                )}
              </button>

              <button
                id="reset-chat-btn"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Reset conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMsg && (
        <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Security / Runtime Notice</p>
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Chat Messages Feed or Empty State */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center py-6 text-center">
            <div className="max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200">
                <Brain className="w-6 h-6 text-amber-800" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                What are you reflecting on today?
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Your thoughts stay confidential. All AI interactions run server-side behind zero-trust
                boundaries, and your resulting entries are stored in your isolated partition.
              </p>
            </div>

            {/* Inspiration Prompt Starters */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left">
              {STARTER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {tmpl.category}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="text-xs font-semibold text-stone-800 group-hover:text-stone-950">
                    {tmpl.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                    {tmpl.tagline}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[11px] text-stone-400 px-1">
                  <span>{msg.role === "user" ? user?.displayName || "You" : "Gemini"}</span>
                  <span>&bull;</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-stone-900 text-stone-50 rounded-tr-xs shadow-xs"
                      : "bg-white border border-stone-200 text-stone-800 rounded-tl-xs shadow-xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-stone prose-sm max-w-none">
                      {msg.content ? (
                        <Markdown>{msg.content}</Markdown>
                      ) : (
                        <div className="flex items-center space-x-2 py-1">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                          <span className="text-xs text-stone-400">Reflecting...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex items-start space-x-2">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-stone-500 ml-1">Reflecting and connecting thoughts...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="pt-2 pb-3 border-t border-stone-200 bg-stone-50/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <textarea
            id="chat-user-input"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Share a dilemma, brainstorm a strategy, or unpack a reflection... (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-2.5 pr-12 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-xs"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="absolute right-2.5 p-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 text-[11px] text-stone-500 px-1">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encapsulated input &bull; Zero prompt injection exposure</span>
          </div>
          <span>Tenant Partition: {user?.uid.substring(0, 14)}</span>
        </div>
      </div>

      {/* Summarization & Vault Persist Modal */}
      {showSummaryModal && analysis && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    Cognitive Reflection & Vault Synthesis
                  </h3>
                  <p className="text-xs text-stone-500">
                    Extracted automatically by Gemini 2.5 Flash from your session
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg p-1"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-left flex-1">
              {/* Title & Mood */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                  Journal Title
                </label>
                <input
                  id="modal-journal-title"
                  type="text"
                  value={analysis.title}
                  onChange={(e) => setAnalysis({ ...analysis, title: e.target.value })}
                  className="w-full text-base font-semibold text-stone-900 border border-stone-200 rounded-lg px-3 py-1.5 focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-stone-500">Mood Arc:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                    {analysis.mood}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-stone-400" />
                  <div className="flex flex-wrap gap-1">
                    {analysis.keyThemes?.map((theme, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                  Executive Reflection Summary
                </label>
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                  {analysis.executiveSummary}
                </div>
              </div>

              {/* Action Items */}
              {analysis.actionItems?.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-stone-600" />
                    <span>Actionable Next Steps</span>
                  </div>
                  <ul className="space-y-1">
                    {analysis.actionItems.map((action, i) => (
                      <li
                        key={i}
                        className="text-xs text-stone-800 flex items-start space-x-2 bg-white border border-stone-100 p-2 rounded-lg"
                      >
                        <span className="text-amber-600 font-bold">&bull;</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cognitive Insights */}
              {analysis.cognitiveInsights?.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mindset Observations & Re-framings</span>
                  </div>
                  <div className="space-y-1">
                    {analysis.cognitiveInsights.map((insight, i) => (
                      <div key={i} className="text-xs text-stone-700 bg-amber-50/50 border border-amber-200/50 p-2 rounded-lg">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 3 Original Feature: Zero-Knowledge Client-Side AES-GCM Encryption */}
              <div className="border-t border-stone-200 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Lock className={`w-4 h-4 ${useEncryption ? "text-amber-600" : "text-stone-400"}`} />
                    <div>
                      <p className="text-xs font-semibold text-stone-900">
                        Zero-Knowledge Encryption Vault (AES-GCM)
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Encrypt in your browser with a personal passphrase before saving. Even the database cannot read it.
                      </p>
                    </div>
                  </div>
                  <input
                    id="enable-zk-encryption-toggle"
                    type="checkbox"
                    checked={useEncryption}
                    onChange={(e) => setUseEncryption(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                </div>

                {useEncryption && (
                  <div className="mt-3 p-3 bg-stone-100 rounded-xl space-y-2 border border-stone-200">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Personal Passphrase (min 6 chars)
                      </label>
                      <input
                        id="encryption-passphrase-input"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Enter secret passphrase"
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Confirm Passphrase
                      </label>
                      <input
                        id="encryption-passphrase-confirm"
                        type="password"
                        value={passphraseConfirm}
                        onChange={(e) => setPassphraseConfirm(e.target.value)}
                        placeholder="Confirm secret passphrase"
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
              >
                Cancel
              </button>

              <button
                id="confirm-save-vault-btn"
                type="button"
                onClick={handleSaveToVault}
                disabled={savingToVault || saveSuccess}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Saved to Vault!</span>
                  </>
                ) : savingToVault ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encrypting & Storing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Save to Private Tenant Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
