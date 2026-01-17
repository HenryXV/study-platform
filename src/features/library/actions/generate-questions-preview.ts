'use server';

import { Question } from '@/features/library/schemas/question-generator';
import { auth } from '@clerk/nextjs/server';
import { generateQuestions } from '../services/ai-service';

export async function generateQuestionsPreview(
    unitId: string,
    unitContent: string,
    unitType: 'TEXT' | 'CODE'
): Promise<{ success: boolean; questions?: Question[]; message?: string }> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const questions = await generateQuestions(userId, unitId, unitContent, unitType);
        return { success: true, questions };
    } catch (error) {
        console.error("Question Preview Generation Failed:", error);
        return { success: false, message: "AI Error during preview generation" };
    }
}
