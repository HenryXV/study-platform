import { prisma } from '@/lib/prisma';
import { Prisma, QuestionType as PrismaQuestionType } from '@/app/generated/prisma/client';
import { Question as GeneratorQuestion, EditableQuestion } from '@/features/library/schemas/question-generator';

// Helper types for Filters
interface QuestionFilter {
    subjectId?: string;
    topicIds?: string[]; // The service passes filtering logic, handled here
}

export const QuestionRepository = {
    async findById(userId: string, id: string) {
        return prisma.question.findFirst({
            where: { id, userId },
            select: {
                id: true,
                interval: true,
                easeFactor: true,
                streak: true,
                lastReviewed: true,
                data: true,
                type: true,
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } }
            },
        });
    },

    async findDue(userId: string, limit: number, now: Date = new Date(), filter?: QuestionFilter) {
        const where: Prisma.QuestionWhereInput = {
            userId,
            nextReviewDate: { lte: now },
            lastReviewed: { not: null },
            ...(filter?.subjectId ? { subjectId: filter.subjectId } : {}),
            ...(filter?.topicIds ? { topics: { some: { id: { in: filter.topicIds } } } } : {})
        };

        return prisma.question.findMany({
            where,
            orderBy: { nextReviewDate: 'asc' },
            take: limit,
            include: {
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } }
            }
        });
    },

    async findNew(userId: string, limit: number, sortDir: 'asc' | 'desc' = 'desc', filter?: QuestionFilter, excludeIds: string[] = []) {
        const where: Prisma.QuestionWhereInput = {
            userId,
            lastReviewed: null,
            ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
            ...(filter?.subjectId ? { subjectId: filter.subjectId } : {}),
            ...(filter?.topicIds ? { topics: { some: { id: { in: filter.topicIds } } } } : {})
        };

        return prisma.question.findMany({
            where,
            orderBy: { createdAt: sortDir },
            take: limit,
            include: {
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } }
            }
        });
    },

    async findReviewAhead(userId: string, limit: number, now: Date, maxDate: Date, filter?: QuestionFilter) {
        const where: Prisma.QuestionWhereInput = {
            userId,
            nextReviewDate: { gt: now, lte: maxDate },
            lastReviewed: { not: null },
            ...(filter?.subjectId ? { subjectId: filter.subjectId } : {}),
            ...(filter?.topicIds ? { topics: { some: { id: { in: filter.topicIds } } } } : {})
        };

        return prisma.question.findMany({
            where,
            orderBy: { nextReviewDate: 'asc' },
            take: limit,
            include: {
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } }
            }
        });
    },

    async findFuture(userId: string, limit: number, now: Date, excludeIds: string[], filter?: QuestionFilter) {
        const where: Prisma.QuestionWhereInput = {
            userId,
            nextReviewDate: { gt: now },
            id: { notIn: excludeIds },
            ...(filter?.subjectId ? { subjectId: filter.subjectId } : {}),
            ...(filter?.topicIds ? { topics: { some: { id: { in: filter.topicIds } } } } : {})
        };

        return prisma.question.findMany({
            where,
            orderBy: { nextReviewDate: 'asc' },
            take: limit,
            include: {
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } }
            }
        });
    },

    async update(userId: string, id: string, data: Prisma.QuestionUpdateInput) {
        // Use updateMany to enforce ownership via userId in where clause
        const result = await prisma.question.updateMany({
            where: { id, userId },
            data: data as Prisma.QuestionUpdateManyMutationInput
        });

        if (result.count === 0) return null;

        // Fetch updated record to return nextReviewDate
        return prisma.question.findUnique({
            where: { id },
            select: { nextReviewDate: true }
        });
    },

    async deleteMany(userId: string, ids: string[]) {
        return prisma.question.deleteMany({
            where: { id: { in: ids }, userId }
        });
    },

    async createBatch(userId: string, unitId: string, subjectId: string | null, questions: GeneratorQuestion[]) {
        return prisma.$transaction(async (tx) => {
            const results = [];
            for (const q of questions) {
                const created = await tx.question.create({
                    data: {
                        userId,
                        unitId,
                        type: mapType(q.type),
                        subjectId: subjectId,
                        topics: (subjectId && q.topics?.length) ? {
                            connectOrCreate: q.topics.map(topicName => ({
                                where: {
                                    name_subjectId_userId: {
                                        name: topicName,
                                        subjectId: subjectId,
                                        userId
                                    }
                                },
                                create: {
                                    name: topicName,
                                    subjectId: subjectId,
                                    userId
                                }
                            }))
                        } : undefined,
                        data: {
                            question: q.questionText,
                            answer: q.correctAnswer,
                            options: q.options || [],
                            explanation: q.explanation || ''
                        }
                    }
                });
                results.push(created);
            }
            return results;
        });
    },

    async updateBatch(userId: string, questions: EditableQuestion[]) {
        return prisma.$transaction(async (tx) => {
            for (const q of questions) {
                if (!q.id) continue;

                // Fetch context for ownership and subjectId
                const current = await tx.question.findFirst({
                    where: { id: q.id, userId },
                    select: { subjectId: true }
                });

                if (!current) continue;

                await tx.question.update({
                    where: { id: q.id },
                    data: {
                        type: mapType(q.type),
                        data: {
                            question: q.questionText,
                            answer: q.correctAnswer,
                            options: q.options || [],
                            explanation: q.explanation || ''
                        },
                        topics: (current.subjectId && q.topics) ? {
                            set: [],
                            connectOrCreate: q.topics.map(t => ({
                                where: {
                                    name_subjectId_userId: {
                                        name: t,
                                        subjectId: current.subjectId!,
                                        userId
                                    }
                                },
                                create: {
                                    name: t,
                                    subjectId: current.subjectId!,
                                    userId
                                }
                            }))
                        } : undefined
                    }
                });
            }
        });
    }
};

function mapType(type: 'MULTIPLE_CHOICE' | 'OPEN' | 'CODE'): PrismaQuestionType {
    if (type === 'CODE') return 'SNIPPET';
    if (type === 'MULTIPLE_CHOICE') return 'MULTI_CHOICE';
    return 'OPEN'; // CLOZE not in generator schema
}
