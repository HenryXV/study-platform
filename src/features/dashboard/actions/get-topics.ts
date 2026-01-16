'use server';

import { prisma } from '@/lib/prisma';
import { CuidSchema } from '@/lib/validation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';

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

        const where = {
            userId,
            ...(parseResult.data?.length ? { subjectId: { in: parseResult.data } } : {})
        };

        const topics = await prisma.topic.findMany({
            where,
            select: {
                id: true,
                name: true,
                subjectId: true,
            },
            orderBy: { name: 'asc' },
        });

        return topics;
    } catch (error) {
        console.error('Failed to fetch topics:', error);
        return [];
    }
}
