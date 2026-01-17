'use server';

import { revalidatePath } from 'next/cache';
import { Question, QuestionSchema } from '@/features/library/schemas/question-generator';
import { z } from 'zod';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { commitQuestions as commitQuestionsService } from '../services/question-service';
import { DomainError } from '@/lib/errors';

export async function commitQuestions(unitId: string, questions: Question[]) {
    // 1. Validate Input
    const idResult = CuidSchema.safeParse(unitId);
    if (!idResult.success) {
        return { success: false, message: 'Invalid unit ID format' };
    }

    const parseResult = z.array(QuestionSchema).safeParse(questions);
    if (!parseResult.success) {
        return { success: false, message: "Validation failed: " + parseResult.error.issues.map(e => e.message).join(", ") };
    }
    const validQuestions = parseResult.data; // Use validated data

    try {
        const userId = await requireUser();
        const count = await commitQuestionsService(userId, unitId, validQuestions);

        revalidatePath('/');
        return { success: true, count };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error("Commit Questions Failed:", error);
        return { success: false, message: "Database Error" };
    }
}
