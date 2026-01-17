'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

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

export async function getSources(query?: string, limit?: number): Promise<LibraryItem[]> {
    try {
        const userId = await requireUser();

        const sources = await prisma.contentSource.findMany({
            where: {
                userId,
                ...(query
                    ? {
                        OR: [
                            { title: { contains: query, mode: 'insensitive' } },
                            { bodyText: { contains: query, mode: 'insensitive' } },
                            {
                                subject: {
                                    name: { contains: query, mode: 'insensitive' },
                                },
                            },
                        ],
                    }
                    : {}
                )
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                subject: {
                    select: { name: true, color: true },
                },
                topics: {
                    select: { name: true },
                },
                _count: {
                    select: { units: true },
                },
            },
        });

        return sources;
    } catch (error) {
        console.error('Failed to fetch sources:', error);
        return [];
    }
}
