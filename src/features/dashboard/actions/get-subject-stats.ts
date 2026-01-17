'use server';

import { requireUser } from '@/lib/auth';
import { fetchSubjectStats } from '../services/dashboard-service';

export interface SubjectStat {
    subjectId: string;
    subject: string;
    mastery: number;
    total: number;
}

export async function getSubjectStats(): Promise<SubjectStat[]> {
    const userId = await requireUser().catch(() => null);
    if (!userId) return [];

    try {
        return await fetchSubjectStats(userId);
    } catch (error) {
        console.error('Failed to fetch subject stats:', error);
        return [];
    }
}
