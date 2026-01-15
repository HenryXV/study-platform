# Verification Suite

## 1. Package Scripts
Add these to `package.json` immediately:

```json
{
  "scripts": {
    "db:test": "tsx scripts/test-database.ts",
    "db:studio": "prisma studio"
  }
}

```

## 2. Connection Test Script

Create `scripts/test-database.ts`.
**Requirement:** Must import `dotenv/config`.

```typescript
import "dotenv/config"
import prisma from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres...")
  try {
    const user = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com` }
    })
    console.log("✅ Connection Success. Created:", user.id)
    
    const count = await prisma.user.count()
    console.log("✅ User Count:", count)
  } catch (error) {
    console.error("❌ Fatal Error:", error)
    process.exit(1)
  }
}

testDatabase()

```

## 3. The "Definition of Done"

No database task is complete until the user runs:

1. `npx prisma generate`
2. `npx prisma db push`
3. `npm run db:test` (Must output "Connection Success")

```