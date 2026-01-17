'use server';

import { requireUser } from '@/lib/auth';
import { fetchSubjects } from '../services/dashboard-service';

export interface SubjectData {
    id: string;
    name: string;
    color: string;
}

export async function getSubjects(): Promise<SubjectData[]> {
    try {
        const userId = await requireUser();
        return await fetchSubjects(userId);
    } catch (error) {
        console.error('Failed to fetch subjects:', error);
        return [];
    }
}
