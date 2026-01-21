# Systemizer
> **The High-Fidelity Study Platform for Engineers.**
> Stop analyzing *how* to study. Just study.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Stack](https://img.shields.io/badge/stack-Next.js_16-black.svg)

## The Problem: "Analysis Paralysis"
Most study tools are too flexible. They ask "What do you want to do?" which triggers decision fatigue. For the "Systemizer" personality type, this leads to:
*   **Hoarding:** Saving 100 PDFs but reading zero.
*   **Review Debt:** Seeing "500 cards due" and quitting immediately.
*   **Imposter Syndrome:** Fearing that "easy" flashcards aren't proving real competence.

## The Solution
**Systemizer** is an opinionated platform that enforces a strict **"Ingest -> Atomize -> Interrogate"** workflow. It uses AI not to summarize (which is passive), but to **chunk** concepts and **test** you on them (active recall).

---

## The 3-Step Flow

### 1. The Warehouse (Ingestion)
*   **Zero-Friction Capture:** Paste code, upload PDFs, or dump raw notes.
*   **"Unprocessed" State:** Content lands in a staging area. You don't need to tag it yet. Just get it out of your browser tabs.

### 2. The Factory (Atomization)
*   **AI-Assisted Chunking:** The "Analyzer Agent" splits large documents into atomic **Study Units**.
*   **Strict Types:** Units are classified as `TEXT` (Theory) or `CODE` (Syntax).
*   **Visual Logic:** The UI separates the "Drafting" phase from the "Studying" phase.

### 3. The Drill (Interrogation)
*   **Active Recall:** We generate 3 types of questions per unit:
    1.  **Multiple Choice:** With plausible distractors.
    2.  **Cloze Deletion:** For memorizing syntax.
    3.  **Code Scenarios:** Execute code in a real Monaco Editor.
*   **Banca Profiles:** Practice with question styles from Brazilian exam boards (FGV, CESPE, VUNESP, FCC, CESGRANRIO).
*   **Deterministic Scheduling:** A custom SM-2 algorithm manages your review intervals.
*   **Export:** Download your study units as JSON, TXT, or CSV for offline use.

---

## Tech Stack (The "Boring" Stack)
We use a Type-Safe, production-grade stack to ensure reliability.

*   **Framework:** Next.js 16 (App Router)
*   **Database:** PostgreSQL + Prisma + pgvector (RAG-enabled)
*   **Auth:** Clerk (Lazy Creation Pattern)
*   **AI:** Gemini (2.0/2.5/3 Flash) + Voyage 3.5 Embeddings
*   **Payments:** Asaas (Brazilian Pix Gateway)
*   **Styling:** Tailwind CSS + shadcn/ui

## Getting Started

### Prerequisites
*   Node.js 20+
*   PostgreSQL Database with pgvector extension (Local or Supabase)
*   Clerk Account (Auth)
*   Google AI API Key (Gemini models)
*   Voyage API Key (Embeddings)
*   Asaas API Key (Payments - optional for dev)

### Installation

1.  Clone the repo:
    ```bash
    git clone https://github.com/yourusername/study-platform.git
    cd study-platform
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    npm ci
    ```

3.  Set up Environment:
    ```bash
    cp .env.example .env
    # Fill in DATABASE_URL, CLERK_KEYS, and AI_KEYS
    ```

4.  Run Database Migrations:
    ```bash
    npx prisma migrate dev
    ```

5.  Start the Development Server:
    ```bash
    npm run dev
    ```

## Architecture
For a deep dive into the engineering principles, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
