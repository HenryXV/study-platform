'use server';

import { prisma } from '@/lib/prisma';
import { FlashCard, CardType, QuestionData } from '../data/flash-cards'; // Re-using types

export async function getQuestionsForSession(mode: string): Promise<FlashCard[]> {
    try {
        // 1. Determine Limit
        let limit = 15;
        if (mode === 'crisis') limit = 5;
        if (mode === 'deep') limit = 50;

        // 2. Fetch Questions (Random or Latest)
        // Prisma doesn't support RAND() nativly widely, so we'll take LATEST for now.
        // TODO: Implement SRS or Random Sampling
        const questions = await prisma.question.findMany({
            take: limit,
            orderBy: { nextReviewDate: 'asc' },
            include: {
                subject: {
                    select: { name: true, color: true }
                },
                topics: {
                    select: { name: true }
                }
            }
        });

        // 3. Map to UI Model
        // We need to parse the JSON 'data' field safely.

        return questions.map(q => {
            const data = q.data as unknown as QuestionData; // Safer cast than any

            // Map Prisma Type to UI Type
            let uiType: CardType = 'TEXT';
            if (q.type === 'SNIPPET') uiType = 'CODE';
            if (q.type === 'MULTI_CHOICE') uiType = 'MULTI_CHOICE';
            if (q.type === 'OPEN') uiType = 'OPEN';

            // Safe extraction of codeSnippet
            // We know if type is SNIPPET/CODE, data *should* be QuestionSnippet
            const codeSnippet = 'codeSnippet' in data ? data.codeSnippet : undefined;
            const options = 'options' in data ? data.options : undefined;
            const explanation = 'explanation' in data ? (data.explanation as string) : undefined;

            // Construct FlashCard
            return {
                id: q.id,
                type: uiType,
                question: data.question || "Unknown Question",
                answer: data.answer || "No answer provided",
                codeSnippet: codeSnippet,
                options: options,
                expected: data.answer, // For code cards comparison
                explanation: explanation,
                subject: q.subject || undefined,
                topics: q.topics || []
            };
        }).map(card => ({
            ...card,
            id: card.id
        }));

    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return [];
    }
}
