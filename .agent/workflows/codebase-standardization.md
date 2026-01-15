---
description: Audits the codebase for compliance with Next.js 16 Project Structure and Vercel Engineering Performance Guidelines.
---

# Codebase Standardization Audit

This workflow performs a comprehensive health check on the project architecture and performance patterns.

## Phase 1: Structural Audit
@architect.md
**Goal:** Verify compliance with `next-project-structure`.

1.  **Route Groups:** Check `src/app`. Are logical domains grouped (e.g., `(marketing)`, `(app)`)?
2.  **Colocation:** Are Feature components located *inside* their route segments (e.g., `app/dashboard/_components`)?
3.  **Root Hygiene:** Verify that `components/` at the root only contains truly global UI (like the Design System).
4.  **Config Files:** Verify `tailwind.config.ts`, `next.config.ts`, and `tsconfig.json` are in the root.

## Phase 2: Performance Audit
@builder.md
**Goal:** Verify compliance with `vercel-react-best-practices`.

1.  **Waterfall Check:** Scan `src` for nested `await` calls in components. Suggest `Promise.all`.
2.  **Client Boundaries:** Scan for `"use client"`. Are they leaf nodes? Are they minimizing the payload?
3.  **Fetching Strategy:** Ensure *no* data fetching happens in `useEffect`. Suggest Server Components or SWR.
4.  **Suspense:** Ensure all async layouts/pages have a corresponding `loading.tsx` or `<Suspense>` wrapper.

## Phase 3: Reporting
**Goal:** Output a standardized report.

1.  **Generate Report:** Summarize findings in a markdown block.
    *   ✅ Passing Items
    *   ⚠️ Warnings (Non-critical deviations)
    *   🔴 Errors (Violations of strict rules)