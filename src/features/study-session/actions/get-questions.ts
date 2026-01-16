'use server';

import { prisma } from '@/lib/prisma';
import { FlashCard, CardType, QuestionData } from '../data/flash-cards'; // Re-using types
import { LimitSchema, StudyModeSchema } from '@/lib/validation';

export async function getQuestions(
    limit: number,
    mode: 'crisis' | 'deep' | 'maintenance' = 'maintenance'
): Promise<FlashCard[]> {
    const limitResult = LimitSchema.safeParse(limit);
    const modeResult = StudyModeSchema.safeParse(mode);

    if (!limitResult.success || !modeResult.success) {
        console.error('Invalid parameters:', { limit, mode });
        return [];
    }

    try {
        const now = new Date();
        const fetchLimit = limitResult.data * 3; // Buffer for sorting

        // 1. Fetch Overdue Items
        const overduePromise = prisma.question.findMany({
            where: { nextReviewDate: { lte: now } },
            take: fetchLimit,
            include: {
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } }
            }
        });

        // 2. Fetch New Items (Only if NOT 'crisis')
        let newItemsPromise = Promise.resolve([]);
        if (modeResult.data !== 'crisis') {
            newItemsPromise = prisma.question.findMany({
                where: { lastReviewed: null },
                take: fetchLimit,
                include: {
                    subject: { select: { name: true, color: true } },
                    topics: { select: { name: true } }
                }
            }) as any; // Cast to avoid TS issues if types mismatch slightly, though they shouldn't
        }

        const [overdue, newItems] = await Promise.all([overduePromise, newItemsPromise]);
        let allCandidates = [...overdue, ...newItems];

        // 3. Filter for Crisis Mode (Strict)
        if (modeResult.data === 'crisis') {
            allCandidates = allCandidates.filter(q => q.interval < 3);
            if (allCandidates.length === 0) return [];
        }

        // 4. Calculate Scores (The Systemizer Score)
        const scoredCandidates = allCandidates.map(q => {
            let score = 0;

            // Overdue Penalty: +1 per day overdue
            const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(q.nextReviewDate).getTime()) / (1000 * 60 * 60 * 24)));
            score += daysOverdue;

            // Danger Zone: +50 checks
            if (q.interval < 3) score += 50;

            // Interest Bonus: +20 for CODE
            if (q.type === 'SNIPPET') score += 20;

            // New Item Bonus: +10
            if (q.interval === 0 || !q.lastReviewed) score += 10;

            return { question: q, score };
        });

        // 5. Sort by Score DESC
        scoredCandidates.sort((a, b) => b.score - a.score);

        // 6. Slice and Map
        let finalQuestions = scoredCandidates.slice(0, limitResult.data).map(item => ({ ...item.question, isReviewAhead: false }));

        // 7. Review Ahead Fallback
        if (modeResult.data !== 'crisis' && finalQuestions.length < limitResult.data) {
            const needed = limitResult.data - finalQuestions.length;
            const futureQuestions = await prisma.question.findMany({
                where: { nextReviewDate: { gt: now } },
                take: needed,
                orderBy: { nextReviewDate: 'asc' }, // Soonest first
                include: {
                    subject: { select: { name: true, color: true } },
                    topics: { select: { name: true } }
                }
            });

            const mappedFuture = futureQuestions.map(q => ({ ...q, isReviewAhead: true }));
            finalQuestions = [...finalQuestions, ...mappedFuture];
        }

        return finalQuestions.map(q => {
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
                isReviewAhead: q.isReviewAhead
            };
        });

    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return [];
    }
}
