'use server';

import { Question } from '@/features/library/schemas/question-generator';
import { auth } from '@clerk/nextjs/server';
import { generateQuestions } from '../services/ai-service';
import {
    QuestionGenerationOptionsSchema,
    QuestionGenerationOptions,
} from '../schemas/question-options';
import * as CreditService from '../services/credit-service';
import { calculateCost } from '../config/pricing-config';

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

    // Check sufficient balance (estimated)
    const MIN_ESTIMATED_COST = 10;
    const hasBalance = await CreditService.hasSufficientBalance(userId, MIN_ESTIMATED_COST);
    if (!hasBalance) {
        return { success: false, message: "INSUFFICIENT_COMPUTE" };
    }

    try {
        const result = await generateQuestions(userId, unitId, unitContent, unitType, optionsResult.data);
        const { questions, usage, model } = result;

        // Bill the user
        try {
            const cost = calculateCost(model, usage.promptTokens, usage.completionTokens);
            await CreditService.billUsage(userId, cost, {
                action: 'GENERATE_QUESTIONS_PREVIEW',
                model,
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
                resourceId: unitId
            });
        } catch (billingError) {
            console.error("Billing Failed:", billingError);
        }

        return { success: true, questions };
    } catch (error) {
        console.error("Question Preview Generation Failed:", error);
        return { success: false, message: "AI Error during preview generation" };
    }
}
