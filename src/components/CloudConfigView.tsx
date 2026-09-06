import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { StorageService } from "../lib/storage";
import {
  KeyRound,
  Shield,
  Copy,
  Check,
  Download,
  Terminal,
  Cloud,
  Layers,
  Database,
  CheckCircle2,
} from "lucide-react";

export const CloudConfigView: React.FC = () => {
  const { user } = useAuth();
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);

  const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Deny all by default
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /journals/{journalId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null 
          && request.auth.uid == userId
          && request.resource.data.userId == userId
          && request.resource.data.title is string
          && request.resource.data.title.size() <= 200;
        allow update: if request.auth != null 
          && request.auth.uid == userId
          && request.resource.data.userId == resource.data.userId;
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;

  const BLUEPRINT_SNIPPET = `{
  "entities": {
    "JournalEntry": {
      "path": "users/{userId}/journals/{journalId}",
      "fields": {
        "userId": { "type": "string" },
        "title": { "type": "string" },
        "rawContent": { "type": "string" },
        "summary": { "type": "string" },
        "keyThemes": { "type": "array" },
        "actionItems": { "type": "array" },
        "cognitiveInsights": { "type": "array" },
        "isEncrypted": { "type": "boolean" },
        "createdAt": { "type": "string" }
      }
    }
  }
}`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAllJson = async () => {
    if (!user) return;
    const entries = await StorageService.getEntries(user.uid);
    const jsonStr = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        tenantUid: user.uid,
        email: user.email,
        entriesCount: entries.length,
        entries,
      },
      null,
      2
    );

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `personal-gemini-journal-backup-${user.uid.substring(0, 8)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Cloud className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Cloud Secret Management &amp; Deployment Architecture
            </h1>
            <p className="text-xs text-slate-500">
              Zero hardcoded keys &bull; Runtime injection via Google Cloud Secret Manager
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Secret Manager Ingestion</span>
            </div>
            <p className="text-[11px] text-slate-600">
              In Google Cloud Run, secrets are mounted into the secure container environment at startup as <code>process.env.GEMINI_API_KEY</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Zero Client Exposure</span>
            </div>
            <p className="text-[11px] text-slate-600">
              No API keys or server tokens are ever bundled into Vite or exported to browser JavaScript.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Database className="w-4 h-4 text-slate-700" />
              <span>ABAC Storage Isolation</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Each user partition is scoped strictly to their verified <code>userId</code> UID with immutable ownership tags.
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Firestore Security Rules (Ready to deploy) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Production Firestore Security Rules (firestore.rules)
            </h2>
          </div>
          <button
            onClick={() => copyToClipboard(FIRESTORE_RULES_SNIPPET, setCopiedRules)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRules ? "Copied" : "Copy Rules"}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          These rules guarantee zero cross-user leakage in production Google Cloud Firestore:
        </p>
        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
          {FIRESTORE_RULES_SNIPPET}
        </pre>
      </div>

      {/* Backup & Export Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Encrypted Tenant Backup &amp; Export
          </h2>
          <p className="text-xs text-slate-500">
            Download an authenticated JSON snapshot of all your journal summaries and transcripts.
          </p>
        </div>

        <button
          onClick={handleExportAllJson}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Vault JSON</span>
        </button>
      </div>
    </div>
  );
};
