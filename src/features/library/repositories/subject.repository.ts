import { prisma } from '@/lib/prisma';

export const SubjectRepository = {
    async findAllForUser(userId: string) {
        return prisma.subject.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                color: true,
            },
            orderBy: { name: 'asc' },
        });
    },

    async findWithQuestionStats(userId: string) {
        return prisma.subject.findMany({
            where: { userId },
            include: {
                questions: {
                    select: {
                        easeFactor: true,
                    },
                },
            },
        });
    }
};
