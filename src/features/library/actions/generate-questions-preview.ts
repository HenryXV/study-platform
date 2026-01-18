'use server';

import { Question } from '@/features/library/schemas/question-generator';
import { auth } from '@clerk/nextjs/server';
import { generateQuestions } from '../services/ai-service';
import {
    QuestionGenerationOptionsSchema,
    QuestionGenerationOptions,
} from '../schemas/question-options';

export async function generateQuestionsPreview(
    unitId: string,
    unitContent: string,
    unitType: 'TEXT' | 'CODE',
    options?: QuestionGenerationOptions
): Promise<{ success: boolean; questions?: Question[]; message?: string }> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, message: "Unauthorized" };
    }

    // Validate and apply defaults
    const optionsResult = QuestionGenerationOptionsSchema.safeParse(options ?? {});
    if (!optionsResult.success) {
        return { success: false, message: 'Invalid question options' };
    }

    try {
        const questions = await generateQuestions(userId, unitId, unitContent, unitType, optionsResult.data);
        return { success: true, questions };
    } catch (error) {
        console.error("Question Preview Generation Failed:", error);
        return { success: false, message: "AI Error during preview generation" };
    }
}
