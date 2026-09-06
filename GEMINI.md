# Gemini & Enterprise Security Directives

## Server-Side AI Operations
- All calls to `@google/genai` must occur inside Express server routes (`/api/*`). The client must never import `@google/genai` or hold the Gemini API key.
- SDK initialization must use `process.env.GEMINI_API_KEY` with HTTP header telemetry `User-Agent: 'aistudio-build'`.
- Model outputs must be validated and structured. Enforce defensive schemas and sanitize responses before persisting or rendering.

## Cloud Firestore Isolation
- Every document must strictly belong to the authenticated user.
- Enforce Attribute-Based Access Control (ABAC) in `firestore.rules` preventing unauthorized reads, batch leakage, or cross-tenant visibility.
- Apply JSON-schema backed validation (`firebase-blueprint.json`) to all document structures.
