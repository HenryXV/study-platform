'use server';

import { prisma } from '@/lib/prisma';

export type LibraryItem = {
    id: string;
    title: string;
    status: 'UNPROCESSED' | 'PROCESSED';
    createdAt: Date;
    subject: { name: string; color: string } | null;
    topics: { name: string }[];
    _count: {
        units: number;
    };
};

export async function getSources(): Promise<LibraryItem[]> {
    try {
        const sources = await prisma.contentSource.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                subject: {
                    select: { name: true, color: true }
                },
                topics: {
                    select: { name: true }
                },
                _count: {
                    select: { units: true }
                }
            }
        });

        return sources;
    } catch (error) {
        console.error("Failed to fetch sources:", error);
        return [];
    }
}
