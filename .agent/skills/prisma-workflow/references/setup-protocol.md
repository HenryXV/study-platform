### 3. The Initialization Sequence

This captures the specific, interactive nature of the setup process.

```markdown
# Setup Protocol

## Step 1: Dependencies
Install the specific versions required for Prisma 7.

```bash
# Dev Dependencies
npm install prisma tsx --save-dev

# Production Dependencies
npm install @prisma/adapter-pg @prisma/client dotenv

```

## Step 2: Interactive Initialization

**CRITICAL:** Do not attempt to run this. Instruct the user:

> "Please run the following command in your terminal. It is interactive. Select your Region and Project Name when prompted."

```bash
npx prisma init --db --output ../app/generated/prisma

```

## Step 3: Post-Init Verification

After the user confirms completion, verify the artifacts:

1. **Check `.env`:** Ensure `DATABASE_URL` starts with `postgres://`.
2. **Check `prisma.config.ts`:**
```typescript
import "dotenv/config" // ✅ MANDATORY
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") } // ✅ URL lives here now
})

```