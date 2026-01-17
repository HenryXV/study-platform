'use server';

import { CuidSchema } from '@/lib/validation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { fetchTopics } from '../services/dashboard-service';

interface TopicData {
    id: string;
    name: string;
    subjectId: string;
}

const SubjectIdsSchema = z.array(CuidSchema).optional();

export async function getTopics(subjectIds?: string[]): Promise<TopicData[]> {
    const parseResult = SubjectIdsSchema.safeParse(subjectIds);

    if (!parseResult.success) {
        console.error('Invalid subjectIds:', subjectIds);
        return [];
    }

    try {
        const userId = await requireUser();
        return await fetchTopics(userId, parseResult.data);
    } catch (error) {
        console.error('Failed to fetch topics:', error);
        return [];
    }
}
