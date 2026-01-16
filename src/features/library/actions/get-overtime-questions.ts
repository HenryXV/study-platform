'use server';

import { prisma } from '@/lib/prisma';
import { FlashCard, CardType } from '@/features/study-session/data/flash-cards';
import { QuestionType } from '@/app/generated/prisma/enums';
import { requireUser } from '@/lib/auth';

interface OvertimeQuestionResponse {
    success: boolean;
    questions?: FlashCard[];
    message?: string;
}

function mapQuestionType(type: QuestionType): CardType {
    switch (type) {
        case 'SNIPPET':
            return 'CODE';
        case 'MULTI_CHOICE':
            return 'MULTI_CHOICE';
        case 'OPEN':
            return 'OPEN';
        case 'CLOZE':
        default:
            return 'TEXT';
    }
}

export async function getOvertimeQuestions(
    excludeIds: string[] = [],
    limit: number = 10
): Promise<OvertimeQuestionResponse> {
    try {
        const userId = await requireUser();

        const now = new Date();

        // 1. Priority: Due Reviews
        // nextReviewDate <= now AND lastReviewed != null
        const dueQuestions = await prisma.question.findMany({
            where: {
                userId,
                id: { notIn: excludeIds },
                lastReviewed: { not: null },
                nextReviewDate: { lte: now },
            },
            include: {
                subject: true,
                topics: true,
            },
            orderBy: {
                nextReviewDate: 'asc',
            },
            take: limit,
        });

        let questions = [...dueQuestions];

        // 2. Fallback: New Cards
        // Filter out IDs we just fetched to be safe (though logic shouldn't overlap)
        const currentIds = new Set([...excludeIds, ...dueQuestions.map(q => q.id)]);
        const remainingLimit = limit - questions.length;

        if (remainingLimit > 0) {
            const newQuestions = await prisma.question.findMany({
                where: {
                    userId,
                    id: { notIn: Array.from(currentIds) },
                    lastReviewed: null,
                },
                include: {
                    subject: true,
                    topics: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
                take: remainingLimit,
            });
            questions = [...questions, ...newQuestions];
        }

        // Map to FlashCard interface
        const mappedQuestions: FlashCard[] = questions.map((q) => {
            const data = q.data as Record<string, unknown>;

            return {
                id: q.id,
                type: mapQuestionType(q.type),
                question: String(data.question || "No Question Text"),
                answer: String(data.answer || "No Answer Text"),
                options: data.options as string[] | undefined,
                codeSnippet: data.codeSnippet as string | undefined,
                expected: data.expected as string | undefined,
                explanation: data.explanation as string | undefined,
                subject: q.subject ? {
                    name: q.subject.name,
                    color: q.subject.color
                } : undefined,
                topics: q.topics.map(t => ({ name: t.name })),
            };
        });

        return {
            success: true,
            questions: mappedQuestions,
        };

    } catch (error) {
        console.error("Failed to fetch overtime questions:", error);
        return {
            success: false,
            message: "Failed to load study cards."
        };
    }
}
