---
description: Phase 1 of Feature Sprint. The Architect defines the blueprint.
---

@architect.md - Calls the Architect Persona to create the blueprint.

# Phase 1: The Blueprint
**Goal:** Define the data shape, security boundaries, and file structure.

1. **Analyze Request:** Understand the user's intent.
2. **Schema Design:** Define **Prisma** models (if needed) and **Zod** validation schemas.
3. **API Contracts:** Define Server Action signatures (Input/Output).
4. **File Structure:** Propose the exact file paths (following `feature-sliced` or `next-project-structure`).
5. **Execution Plan:** Explicitly state which next phases are required:
    - **Visuals Needed?** (Yes/No) -> If Yes, trigger Phase 2.
    - **Wiring Needed?** (Yes/No) -> If Yes, trigger Phase 3.
6. **Approval:** Stop and ask the User to approve the plan.