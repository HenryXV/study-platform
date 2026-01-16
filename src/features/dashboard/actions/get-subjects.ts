'use server';

import { prisma } from '@/lib/prisma';

interface SubjectData {
    id: string;
    name: string;
    color: string;
}

export async function getSubjects(): Promise<SubjectData[]> {
    try {
        const subjects = await prisma.subject.findMany({
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
