export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous?: boolean;
  isTrial?: boolean;
  tier?: "trial" | "standard" | "enterprise";
  role?: "admin" | "author";
  isAdmin?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  rawContent: string;
  summary: string;
  keyThemes: string[];
  actionItems: string[];
  cognitiveInsights: string[];
  mood: string;
  isEncrypted: boolean;
  encryptedData?: string; // base64 payload if encrypted
  iv?: string; // base64 initialization vector
  salt?: string; // base64 PBKDF2 salt
  createdAt: string;
  updatedAt: string;
}

export interface JournalAnalysis {
  title: string;
  executiveSummary: string;
  keyThemes: string[];
  actionItems: string[];
  cognitiveInsights: string[];
  mood: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  tagline: string;
  category: "Reflection" | "Strategy" | "Clarity" | "Creativity";
  prompt: string;
}

export interface SecurityConstitutionRule {
  id: string;
  name: string;
  status: "PASSED" | "KEY_NEEDED" | "ACTIVE" | "WARNING";
  details: string;
}

export interface SecurityAuditReport {
  evaluatedAt: string;
  overallStatus: string;
  constitutionRules: SecurityConstitutionRule[];
}

export type ActiveTab = "brainstorm" | "vault" | "security" | "settings";
