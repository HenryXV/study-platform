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
            // 1. Extract all unique topics across all questions
            const allTopics = Array.from(new Set(
                questions.flatMap(q => q.topics || [])
            ));

            // 2. Ensure all topics exist (upsert them all first)
            // This prevents race conditions better than connectOrCreate for batch operations
            if (subjectId && allTopics.length > 0) {
                await Promise.all(allTopics.map(topicName =>
                    tx.topic.upsert({
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
                        },
                        update: {} // No-op if exists
                    })
                ));
            }

            // 3. Create all questions in parallel, connecting to the now-guaranteed topics
            const createPromises = questions.map(q => {
                // CRITICAL: Deduplicate topics per question to prevent "Expected X, found Y" errors
                const uniqueTopics = [...new Set(q.topics || [])];

                return tx.question.create({
                    data: {
                        userId,
                        unitId,
                        type: mapType(q.type),
                        subjectId: subjectId,
                        topics: (subjectId && uniqueTopics.length > 0) ? {
                            connect: uniqueTopics.map(topicName => ({
                                name_subjectId_userId: {
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
            });
            return Promise.all(createPromises);
        }, {
            timeout: 20000 // Increase timeout to 20s for large batches
        });
    },

    async updateBatch(userId: string, questions: EditableQuestion[]) {
        return prisma.$transaction(async (tx) => {
            // Filter out questions without IDs
            const validQuestions = questions.filter(q => q.id);

            // Fetch all ownership/context data in parallel
            const contextPromises = validQuestions.map(q =>
                tx.question.findFirst({
                    where: { id: q.id!, userId },
                    select: { id: true, subjectId: true }
                })
            );
            const contexts = await Promise.all(contextPromises);

            // Pre-process topics for update
            // We need to know which subjectId applies to which topic
            const topicOperations: { name: string, subjectId: string }[] = [];
            validQuestions.forEach((q, i) => {
                const context = contexts[i];
                if (context && context.subjectId && q.topics) {
                    q.topics.forEach(t => {
                        topicOperations.push({ name: t, subjectId: context.subjectId! });
                    });
                }
            });

            // unique topic+subject combinations
            const uniqueTopicOps = Array.from(new Set(topicOperations.map(op => `${op.name}|${op.subjectId}`)))
                .map(s => {
                    const [name, subjectId] = s.split('|');
                    return { name, subjectId };
                });

            // Upsert all needed topics first
            if (uniqueTopicOps.length > 0) {
                await Promise.all(uniqueTopicOps.map(op =>
                    tx.topic.upsert({
                        where: {
                            name_subjectId_userId: {
                                name: op.name,
                                subjectId: op.subjectId,
                                userId
                            }
                        },
                        create: {
                            name: op.name,
                            subjectId: op.subjectId,
                            userId
                        },
                        update: {}
                    })
                ));
            }

            // Build update promises only for questions that exist and user owns
            const updatePromises = validQuestions
                .map((q, i) => ({ question: q, context: contexts[i] }))
                .filter(({ context }) => context !== null)
                .map(({ question: q, context }) =>
                    tx.question.update({
                        where: { id: q.id! },
                        data: {
                            type: mapType(q.type),
                            data: {
                                question: q.questionText,
                                answer: q.correctAnswer,
                                options: q.options || [],
                                explanation: q.explanation || ''
                            },
                            topics: (context!.subjectId && q.topics) ? {
                                set: [], // Clear existing relations
                                connect: q.topics.map(t => ({
                                    name_subjectId_userId: {
                                        name: t,
                                        subjectId: context!.subjectId!,
                                        userId
                                    }
                                }))
                            } : undefined
                        }
                    })
                );

            return Promise.all(updatePromises);
        });
    }
};

function mapType(type: 'MULTIPLE_CHOICE' | 'OPEN' | 'CODE'): PrismaQuestionType {
    if (type === 'CODE') return 'SNIPPET';
    if (type === 'MULTIPLE_CHOICE') return 'MULTI_CHOICE';
    return 'OPEN'; // CLOZE not in generator schema
}
