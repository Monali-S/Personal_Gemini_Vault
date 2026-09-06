# Security Constitution & Production Directives

## 1. Threat Modeling & Zero-Trust Architecture
- **STRIDE Threat Modeling**: Every feature must undergo threat modeling covering Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service/Wallet, and Elevation of Privilege.
- **Zero-Trust Client Boundary**: The frontend client is strictly untrusted. All sensitive operations, API key handling, and AI model invocations MUST execute server-side.
- **Identity & Authorization Verification**: All data access must authenticate against verified identities. Never rely on client-supplied user identifiers without validating `request.auth.uid`.

## 2. Secure Coding Standards & OWASP Hardening
- **Prompt Injection Defense**: Guard Gemini prompts against indirect and direct prompt injection. Treat all user inputs as untrusted text; encapsulate with structural boundaries and enforce strict system instructions.
- **Cross-Site Scripting (XSS) Prevention**: Never render unsanitized HTML or bypass framework escapers. Always parse and safely render Markdown with strict component allowances.
- **Denial of Wallet / Resource Exhaustion Guarding**: Impose strict volumetric boundaries (maximum payload size, character limits, rate limiting, and defensive schema validation) on every API endpoint and database write.

## 3. Database Isolation Rules (Firestore ABAC)
- **Zero Cross-User Data Leakage**: All user-authored content, journal logs, and conversational summaries must reside in user-isolated paths (`/users/{userId}/...`).
- **Strict Server-Enforced Security Rules**:
  - Direct rule enforcement: `allow read, write: if request.auth != null && request.auth.uid == userId;`
  - Never allow blanket read or list operations without scoping `resource.data.userId == request.auth.uid`.
  - Immutable ownership: Identity fields (`userId`, `createdAt`) cannot be modified on updates.
  - Server timestamps only: `request.time` must validate temporal fields to prevent client timestamp tampering.

## 4. Secret Management & Key Hygiene
- **Absolute Key Isolation**: API keys (including `GEMINI_API_KEY`, Firebase Admin keys, third-party credentials) must NEVER be exposed to the client bundle or prefixed with `VITE_`.
- **Google Cloud Secret Manager / Secure Runtime Ingestion**: Fetch credentials strictly via server-side environment variables or Secret Manager with lazy initialization and graceful fallback handling.
- **No Hardcoded Secrets**: Zero tolerance for hardcoded tokens, secret fallbacks in source code, or unencrypted local credentials.
