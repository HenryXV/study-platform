'use server';

import { prisma } from '@/lib/prisma';
import { FlashCard, CardType, QuestionData } from '../data/flash-cards';
import { LimitSchema, QuestionFiltersSchema } from '@/lib/validation';
import { calculateSystemizerScore } from '@/lib/srs-algorithm';
import { requireUser } from '@/lib/auth';

type StudyMode = 'crisis' | 'deep' | 'maintenance' | 'custom' | 'cram';

interface QuestionFilters {
    subjectIds?: string[];
    topicIds?: string[];
    mode?: StudyMode;
}

export async function getQuestions(
    limit: number = 20,
    filters?: QuestionFilters
): Promise<FlashCard[]> {
    const limitResult = LimitSchema.safeParse(limit);
    const filtersResult = QuestionFiltersSchema.safeParse(filters ?? {});

    if (!limitResult.success || !filtersResult.success) {
        console.error('Invalid parameters:', { limit, filters });
        return [];
    }

    const validatedFilters = filtersResult.data;
    const mode: StudyMode = validatedFilters.mode ?? 'maintenance';

    try {
        const userId = await requireUser();

        const now = new Date();
        const fetchLimit = limitResult.data * 3;

        // Build dynamic where clause based on filters
        const baseWhere: Record<string, unknown> = { userId };

        if (validatedFilters.subjectIds?.length) {
            baseWhere.subjectId = { in: validatedFilters.subjectIds };
        }

        if (validatedFilters.topicIds?.length) {
            baseWhere.topics = { some: { id: { in: validatedFilters.topicIds } } };
        }

        // CRAM MODE: Target specific subjects, sort by due date (Next Review ASC)
        // Intention: "Cram" implies studying what's due or coming up soon for a specific subject.
        if (mode === 'cram') {
            const cramQuestions = await prisma.question.findMany({
                where: baseWhere,
                take: fetchLimit,
                orderBy: { nextReviewDate: 'asc' }, // Prioritize urgent/overdue
                include: {
                    subject: { select: { name: true, color: true } },
                    topics: { select: { name: true } }
                }
            });

            // Map and return directly, no extra scoring needed for cramming
            const sliced = cramQuestions.slice(0, limitResult.data);
            return sliced.map(q => mapQuestionToFlashCard(q, false));
        }

        // CUSTOM MODE: Bypass overdue logic, fetch any matching cards with random shuffle
        if (mode === 'custom') {
            const customQuestions = await prisma.question.findMany({
                where: baseWhere,
                take: fetchLimit,
                include: {
                    subject: { select: { name: true, color: true } },
                    topics: { select: { name: true } }
                }
            });

            // Fisher-Yates shuffle for unbiased randomization
            const shuffled = [...customQuestions];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const sliced = shuffled.slice(0, limitResult.data);

            return sliced.map(q => mapQuestionToFlashCard(q, false));
        }

        // STANDARD MODES: Use overdue prioritization logic
        // 1. Fetch Overdue Items
        const overduePromise = prisma.question.findMany({
            where: { ...baseWhere, nextReviewDate: { lte: now } },
            take: fetchLimit,
            include: {
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } }
            }
        });

        // 2. Fetch New Items (Only if NOT 'crisis')
        let newItemsPromise = Promise.resolve<typeof overduePromise extends Promise<infer T> ? T : never>([]);
        if (mode !== 'crisis') {
            newItemsPromise = prisma.question.findMany({
                where: { ...baseWhere, lastReviewed: null },
                take: fetchLimit,
                include: {
                    subject: { select: { name: true, color: true } },
                    topics: { select: { name: true } }
                }
            });
        }

        const [overdue, newItems] = await Promise.all([overduePromise, newItemsPromise]);
        let allCandidates = [...overdue, ...newItems];

        // 3. Filter for Crisis Mode (Strict)
        if (mode === 'crisis') {
            allCandidates = allCandidates.filter(q => q.interval < 3);
            if (allCandidates.length === 0) return [];
        }

        // 4. Calculate Scores (The Systemizer Score)
        const scoredCandidates = allCandidates.map(q => {
            const score = calculateSystemizerScore({
                nextReviewDate: q.nextReviewDate,
                interval: q.interval,
                type: q.type,
                lastReviewed: q.lastReviewed,
            }, now);
            return { question: q, score };
        });

        // 5. Sort by Score DESC
        scoredCandidates.sort((a, b) => b.score - a.score);

        // 6. Slice and Map
        let finalQuestions = scoredCandidates.slice(0, limitResult.data).map(item => ({ ...item.question, isReviewAhead: false }));

        // 7. Review Ahead Fallback
        if (mode !== 'crisis' && finalQuestions.length < limitResult.data) {
            const needed = limitResult.data - finalQuestions.length;
            const futureQuestions = await prisma.question.findMany({
                where: { ...baseWhere, nextReviewDate: { gt: now } },
                take: needed,
                orderBy: { nextReviewDate: 'asc' },
                include: {
                    subject: { select: { name: true, color: true } },
                    topics: { select: { name: true } }
                }
            });

            const mappedFuture = futureQuestions.map(q => ({ ...q, isReviewAhead: true }));
            finalQuestions = [...finalQuestions, ...mappedFuture];
        }

        return finalQuestions.map(q => mapQuestionToFlashCard(q, q.isReviewAhead));

    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return [];
    }
}

// Helper to map Prisma Question to FlashCard type
function mapQuestionToFlashCard(
    q: {
        id: string;
        type: string;
        data: unknown;
        unitId: string;
        subject?: { name: string; color: string } | null;
        topics: { name: string }[];
    },
    isReviewAhead: boolean
): FlashCard {
    const data = q.data as unknown as QuestionData;

    let uiType: CardType = 'TEXT';
    if (q.type === 'SNIPPET') uiType = 'CODE';
    if (q.type === 'MULTI_CHOICE') uiType = 'MULTI_CHOICE';
    if (q.type === 'OPEN') uiType = 'OPEN';

    const codeSnippet = 'codeSnippet' in data ? data.codeSnippet : undefined;
    const options = 'options' in data ? data.options : undefined;
    const explanation = 'explanation' in data ? (data.explanation as string) : undefined;

    return {
        id: q.id,
        type: uiType,
        question: data.question || "Unknown Question",
        answer: data.answer || "No answer provided",
        codeSnippet: codeSnippet,
        options: options,
        expected: data.answer,
        explanation: explanation,
        subject: q.subject || undefined,
        topics: q.topics || [],
        unitId: q.unitId,
        isReviewAhead: isReviewAhead
    };
}
