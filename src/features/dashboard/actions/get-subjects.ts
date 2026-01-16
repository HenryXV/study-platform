'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

interface SubjectData {
    id: string;
    name: string;
    color: string;
}

export async function getSubjects(): Promise<SubjectData[]> {
    try {
        const userId = await requireUser();

        const subjects = await prisma.subject.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                color: true,
            },
            orderBy: { name: 'asc' },
        });

        return subjects;
    } catch (error) {
        console.error('Failed to fetch subjects:', error);
        return [];
    }
}
