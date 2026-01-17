import { prisma } from '@/lib/prisma';

export const TopicRepository = {
    async findAllForUser(userId: string, subjectIds?: string[]) {
        const where = {
            userId,
            ...(subjectIds?.length ? { subjectId: { in: subjectIds } } : {})
        };

        return prisma.topic.findMany({
            where,
            select: {
                id: true,
                name: true,
                subjectId: true,
            },
            orderBy: { name: 'asc' },
        });
    }
};
