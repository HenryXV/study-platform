'use server';

import { prisma } from '@/lib/prisma';
import { FlashCard, CardType } from '../data/mock-cards'; // Re-using types

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
            orderBy: { createdAt: 'desc' },
        });

        // 3. Map to UI Model
        // We need to parse the JSON 'data' field safely.

        return questions.map(q => {
            const data = q.data as any; // Type assertion since it's Json in DB

            // Map Prisma Type to UI Type
            let uiType: CardType = 'TEXT';
            if (q.type === 'SNIPPET') uiType = 'CODE';

            // Construct FlashCard
            return {
                id: q.id,
                type: uiType,
                question: data.question || "Unknown Question",
                answer: data.answer || "No answer provided",
                codeSnippet: data.codeSnippet,
                expected: data.answer // For code cards comparison
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
