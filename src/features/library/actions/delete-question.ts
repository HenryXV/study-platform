'use server';

import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { deleteQuestion as deleteQuestionService } from '../services/question-service';
import { DomainError } from '@/lib/errors';

export async function deleteQuestion(questionId: string) {
    const result = CuidSchema.safeParse(questionId);
    if (!result.success) {
        return { success: false, message: 'Invalid question ID format' };
    }

    try {
        const userId = await requireUser();
        await deleteQuestionService(userId, questionId);

        revalidatePath('/library/[id]');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error("Failed to delete question:", error);
        return { success: false, message: "Failed to delete question" };
    }
}
