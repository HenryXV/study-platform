## 1. Global Singleton (`lib/prisma.ts`)
**Requirement:** Must use `@prisma/adapter-pg`.

```typescript
import { PrismaClient } from "../app/generated/prisma/client" // ✅ Note the /client
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

```

## 2. API Route Handler (`app/api/users/route.ts`)

**Requirement:** Wrap in `try/catch`. Use singleton.

```typescript
import { NextRequest, NextResponse } from "next/server"
import prisma from "../../../lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await prisma.user.create({
      data: { email: body.email }
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

```

## 3. Server Component (`app/page.tsx`)

**Requirement:** Robust error handling for UI.

```typescript
import prisma from "@/lib/prisma"

export default async function Page() {
  try {
    const users = await prisma.user.findMany()
    return <ul>{users.map(u => <li key={u.id}>{u.email}</li>)}</ul>
  } catch (e) {
    return <div className="text-red-500">Database Error</div>
  }
}

```