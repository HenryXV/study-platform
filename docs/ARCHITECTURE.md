# System Architecture

## 1. System Overview

### 1.1 High-Level Architecture

```mermaid
graph TB
    Client["Web Client (Next.js)"] --> API["Server Actions"]
    API --> Service["Services (Business Logic)"]
    Service --> Repo["Repositories (Data Access)"]
    Repo --> DB[("Postgres / Prisma")]
    DB --> Vector["pgvector (Embeddings)"]
    
    API --> Auth["Clerk Auth"]
    API --> Cache["Upstash Redis (Rate Limiting)"]
    API --> Payment["Asaas (Pix Gateway)"]
    
    subgraph "Features"
        Dashboard
        Library
        StudySession
        PaymentSystem
    end
    
    Client --> Dashboard
    Client --> Library
    Client --> StudySession
    Client --> PaymentSystem
```

### 1.2 The "Systemizer" Map
The application is structured to mirror the user's mental model:
*   **Dashboards** represent "Status" (Am I safe? Am I behind?).
*   **Library** represents "The Warehouse" (Raw Materials).
*   **Study Session** represents "The Factory" (Processing Materials).

> **Philosophy:** "Systemizer" Design
> This architecture is built to withstand high-entropy input (random notes, PDFs, code) and convert it into low-entropy, strictly typed "Study Units." It prioritizes Type Safety, Deterministic Logic, and Zero-Friction Ingestion.

---

## 2. Engineering Principles (The "Anti-Slop" Guarantee)

The codebase assumes the user is in a state of "Analysis Paralysis." Therefore, the engineering must provide absolute certainty. We do not use "Magic" where logic is hidden; we use **Type Safety** and **Deterministic Algorithms**.

### 2.1 Critical Type Safety
We use a "Double-Wall" defense against runtime errors:
1.  **Database Layer (Prisma):** Auto-generated types from the schema ensure that if the DB changes, the build fails immediately.
2.  **API Boundary (Zod):** Every implementation of an AI response or User Input is validated at runtime. We never trust the LLM's JSON output blindly; it must pass a strict Zod Schema (`safeParse`).

### 2.2 Deterministic Study Logic (Custom SM-2)
Many study apps rely on black-box algorithms. We implemented a custom, verifiable Spaced Repetition System (SRS).
*   **The Algorithm:** A modified SM-2 (SuperMemo-2).
*   **The Modifications:**
    *   **Systemizer Score:** We calculate a priority score (`srs-algorithm.ts`) that weights "Code/Snippet" questions higher than generic text, satisfying the user's preference for technical drilling.
    *   **The Floor:** A "Crisis Mode" filter that finds the absolute minimum set of cards (Stability < 3 days) to keep a streak alive without burnout.
*   **Why Custom?** It allows us to unit test the scheduling logic (`npm test`) without mocking a 3rd party library, ensuring the "Next Review Date" is mathematically proven correct.

### 2.3 Performance & UX Patterns
*   **Optimistic UI:** When a user completes a review, the UI updates instantly (via React Query cache invalidation) while the server action runs in the background.
*   **Edge-Ready Rate Limiting:** We protect the "Intelligence Layer" with Redis-backed rate limiting (`10 req / 10 min`) to prevent API cost spirals while allowing bursts of legitimate activity.

---

## 3. The Intelligence Layer

The "Brain" of the application is an **Ingestion-Atomization-Interrogation** pipeline. It is agnostic of the underlying LLM (currently transitioning between Gemini and Claude) but strict about the *structure* of data it produces. All AI inputs are "High Entropy" (raw text) and all outputs are "Strictly Typed JSON" (Zod Schema).

### 3.1 Pipeline Architecture

```mermaid
graph TD
    Raw[Raw Input] -->|Ingest| Chunker[Semantic Chunker]
    Chunker -->|Embed| VectorDB[(pgvector)]
    
    VectorDB -->|RAG Retrieval| Analyzer[Analyzer Agent]
    Analyzer -->|"Zod: { units: [] }"| Preview[Draft Units]
    Preview -->|User Verification| DB_Unit[(StudyUnit DB)]
    
    DB_Unit -->|Context Window| Interrogator[Interrogator Agent]
    Interrogator -->|"Zod: { questions: [] }"| Q_Bank[(QuestionBank DB)]
```

### 3.2 The RAG Pipeline (Ingestion)
*   **Goal:** Convert high-entropy PDF/Text into searchable vector space, enabling Semantic Search.
*   **Implementation:** `features/library/services/ingestion-service.ts`
*   **Strategy:**
    *   **PDF Parsing:** Uses `pdf-parse-fork` with a custom renderer to inject Form Feeds (`\f`) between pages. This allows us to preserve the concept of "Page Numbers" even in a raw text stream.
    *   **High-Fidelity Chunking:** We use `RecursiveCharacterTextSplitter` from LangChain with strict parameters:
        *   **Chunk Size:** 1000 characters (approx 200-300 tokens). Large enough to capture a full concept/paragraph.
        *   **Overlap:** 200 characters. Ensures context isn't severed at the chunk boundary.
    *   **Vector Storage:** Embeddings are generated via Vercel AI SDK (`embedMany`) and stored in Postgres using the `pgvector` extension.

### 3.3 The "Analyzer" (Atomization)
*   **Goal:** Break large documents into atomic concepts without user effort.
*   **Implementation:** `features/library/actions/analyze-content.ts`
*   **Strategy:**
    *   **Prompt Persona:** "Strict Teacher" - instructed to identify concepts, not just summarize.
    *   **Two-Pass Logic:**
        1.  **Macro-Analysis:** Identifies the single best `Subject` (e.g., "Computer Science") and list of `Topics`.
        2.  **Micro-Chunking:** Splits text into `units` with types:
            *   `TEXT`: Theory, definitions, history.
            *   `CODE`: Syntax, implementation detail (triggers specialized Monaco editor).

### 3.4 The "Interrogator" (Active Recall)
*   **Goal:** Prove competence through "Ruthless" testing.
*   **Implementation:** `features/library/actions/generate-questions-preview.ts`
*   **Strategy:**
    *   **Prompt Persona:** "Ruthless Examiner" - instructed to create distractors that are plausible/tricky.
    *   **Context Injection:** Feeds `Subject` + `Topic` tags to the LLM to prevent generic questions.
    *   **Output Schema (`QuestionSchema`):**
        *   `type`: `MULTIPLE_CHOICE | OPEN | CODE`
        *   `correctAnswer`: The source of truth.
        *   `explanation`: Why the answer is correct (for feedback).

### 3.5 Rate Limiting & Cost Control
To prevent API abuse and cost overrun, the Intelligence Layer is protected by a strict sliding window limiter:
*   **Limits:** 10 AI requests per 10 minutes per user.
*   **Storage:** Redis-backed (`@upstash/ratelimit`).
*   **Pattern:** `ratelimit.limit(userId)` wraps every generation action.

---

## 4. The Financial Layer (Credits & Assets)

To make the business model viable, the application uses an internal economy ("Credits") to abstract real money from usage. This allows us to charge for value (generations) without incurring credit card processing fees for every micro-transaction.

### 4.1 Internal Economy
*   **Credits:** stored internally on the `User` model.
*   **Usage Tracking:** Every AI call creates a `UsageLog` entry.
    *   Records `cost`, `tokensIn`, `tokensOut`, and `modelUsed`.
    *   Allows purely auditable history of where credits went.
*   **Bonus System:** New users are granted starting credits (configured in `credits-config.ts`) to allow the "Aha!" moment before a paywall.

### 4.2 Payment Integration (Asaas Pix)
We integrate with **Asaas** for Brazilian instant payments (Pix).
*   **Implementation:** `features/payment/payment-service.ts`
*   **Flow:**
    1.  User selects a package (Starter/Pro/Expert).
    2.  System acts as a "Reseller": Creates an Asaas Customer (if needed) and issues a Pix Charge.
    3.  Frontend displays the QR Code.
    4.  **Webhook:** Asaas hits `/api/webhooks/asaas` when payment is confirmed.
    5.  **Atomic Transaction:** We use `prisma.$transaction` to ensure ensuring data integrity:
        *   Verify Transaction exists.
        *   Update Transaction Status -> `COMPLETED`.
        *   User.credits -> `User.credits + package.credits`.

---

## 5. Data Core (The "Systemizer" Memory)

The database schema is designed to enforce strict ownership and hierarchical processing. We do not use unstructured JSON blobs for core data; everything is relational.

### 5.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ ContentSource : owns
    User ||--o{ StudySession : has
    User ||--o{ Transaction : initiates
    User ||--o{ UsageLog : generates

    Subject ||--o{ ContentSource : categorizes
    Subject ||--o{ Topic : contains

    ContentSource ||--|{ ContentChunk : "split into"
    ContentSource ||--|{ StudyUnit : "atomized into"
    StudyUnit ||--|{ Question : "generates"

    Question }|--|| Topic : "tagged with"

    ContentSource {
        string status "UNPROCESSED | PROCESSED"
        string bodyText "Raw Input"
    }

    ContentChunk {
        string content "Text Segment"
        int pageNumber
        vector embedding "1024 dims"
    }

    StudyUnit {
        string type "TEXT | CODE"
        string content "Atomic Concept"
    }

    Transaction {
        string status "PENDING | COMPLETED"
        float amount "BRL Value"
        int creditsAmount "Internal Currency"
    }

    UsageLog {
        string action "GENERATE_QUESTIONS"
        int cost "Credit Cost"
    }
```

### 5.2 Key Models
| Model | Purpose | "Systemizer" Rationale |
| :--- | :--- | :--- |
| **ContentSource** | The raw material (PDF, Notes, URL). | Immutable "Source of Truth." If the AI hallucinates, we can always trace back to this original text. |
| **ContentChunk** | Semantic vector segment. | Enables RAG. Stores the `vector(1024)` embedding for similarity search. |
| **StudyUnit** | An atomic concept extracted from the source. | Breaks "Big Data" into "Small Data." Solves the "Interrogation" problem by isolating specific facts. |
| **Transaction** | Financial record. | Links the internal Credit economy to the external Banking reality (Asaas). |
| **UsageLog** | Audit trail. | Explains to the user exactly where their credits went (no "vanishing credits" mystery). |


---

## 6. Application Layer (Next.js 16)

We rely on standard Next.js 16 patterns to keep the implementation boring and predictable.

### 6.1 Project Structure
*   `src/app/` **(Routes):** Minimal logic. Responsible for layout and metadata only. Imports feature components.
*   `src/features/` **(Domain Modules):** 
    *   `features/[name]/actions`: Entry points (Validation, Auth, Rate Limiting).
    *   `features/[name]/services`: Business logic (Pure functions, Algorithms).
    *   `features/[name]/repositories`: Data access (Prisma queries, Transactions).
    *   `features/[name]/components`: Feature-specific UI.
    *   `features/[name]/schemas`: Zod contracts.
*   `src/shared/ui/` **(Design System):** "Dumb" UI components (Card, Button, Badge).

### 6.2 Server Actions Pattern (3-Layer Architecture)
We separate concerns to keep business logic testable:

1.  **Action Layer (The Controller):**
    *   Checks Auth (`requireUser`).
    *   Checks Rate Limits.
    *   Validates Input (Zod).
    *   Calls the **Service**.
2.  **Service Layer (The Brain):**
    *   Contains business rules (e.g., "Crisis Mode" filtering, SRS calculations).
    *   Orchestrates multiple repository calls.
    *   **Unit Testable** without mocking DB.
3.  **Repository Layer (The Memory):**
    *   Executes raw Prisma queries.
    *   Handles Transactions.
    *   Returns strict typed objects.

## 7. Security & Access Control

### 7.1 Authentication (Clerk)
We delegate identity management to Clerk to avoid rolling our own crypto.
*   **Lazy Creation:** We use a "Just-in-Time" user creation pattern (`auth.ts`). When a user logs in via Clerk, we check if they exist in our Postgres DB. If not, we create them instantly. This prevents sync issues.

### 7.2 Row Level Security (RLS)
Since we use Prisma (which doesn't have native RLS like Supabase), we enforce "Software RLS" in every query.
*   **Rule:** Every `findMany` or `findFirst` MUST include `where: { userId }`.
*   **Enforcement:** Code reviews and standard patterns.
*   **Mutation Protection:** `delete` actions always check `count({ where: { id, userId } })` before deletion to prevent IDOR attacks.
