import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma/client'; // Correct custom output path

let connectionString = process.env.POSTGRES_PRISMA_URL;

if (process.env.NODE_ENV === 'development') {
    connectionString = process.env.DEV_DATABASE_URL;
}

if (!connectionString) {
    throw new Error('POSTGRES_PRISMA_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
