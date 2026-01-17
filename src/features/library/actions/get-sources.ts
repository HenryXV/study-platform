'use server';

import { requireUser } from '@/lib/auth';
import { fetchContentSources } from '../services/content-service';

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
        return await fetchContentSources(userId, query, limit);
    } catch (error) {
        console.error('Failed to fetch sources:', error);
        return [];
    }
}
