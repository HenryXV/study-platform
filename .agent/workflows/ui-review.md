---
description: Audits the UI for compliance with Vercel Design Guidelines, Accessibility (A11y), and Mobile Responsiveness.
---

# UI Design & Accessibility Review

This workflow performs a comprehensive audit of the visual and interactive layer.

## Phase 1: Interaction & A11y
@designer.md
**Goal:** Ensure the app is usable by everyone. Verify compliance with `web-design-guidelines`

1.  **Keyboard Nav:** Can you `Tab` through all interactive elements? Are focus rings visible?
2.  **Semantic HTML:** Are buttons `<button>`? Are links `<a>`? Are headings `h1-h6` in order?
3.  **A11y Labels:** Do icons have `aria-label`? Do images have `alt` text?
4.  **Touch Targets:** Are clickable areas at least 44x44px on mobile?

## Phase 2: Visual Polish
@designer.md
**Goal:** Achieve the "Premium" Developer Experience aesthetic.

1.  **Typography:** Is `Inter` (or the configured font) used consistently? Are we using standard weights (400, 500, 600)?
2.  **Spacing:** Are we using standard Tailwind spacing (4, 6, 8, 12)? No magic pixel values.
3.  **Contrast:** Is text strictly `zinc-50` to `zinc-500`? Avoid low-contrast combinations.
4.  **Responsiveness:** Does the layout stack correctly on mobile (`sm`)? Checked `flex-col` vs `flex-row`.

## Phase 3: Motion & Feedback
@designer.md
**Goal:** Make the interface feel alive.

1.  **States:** Do all buttons/inputs have `hover:`, `active:`, `focus-visible:` styles?
2.  **Loading:** Are skeletons used instead of spinners for initial load?
3.  **Transitions:** Are state changes smooth? (usage of `transition-all duration-200`).
4.  **Reduced Motion:** Is `motion-reduce` respected for large animations?

## Phase 4: Reporting
**Goal:** Output a standardized Design QA report.

1.  **Generate Report:** Summarize findings.
    *   ✅ Passing Items
    *   ⚠️ Visual Bugs (Spacing, Polish)
    *   🔴 A11y Violations (Critical fixes)