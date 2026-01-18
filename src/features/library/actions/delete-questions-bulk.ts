'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { deleteQuestions } from '../services/question-service';
import { DomainError } from '@/lib/errors';

const BulkDeleteSchema = z.object({
    questionIds: z.array(z.string().cuid()).min(1, 'At least one question must be selected'),
});

export async function deleteQuestionsBulk(questionIds: string[]) {
    const result = BulkDeleteSchema.safeParse({ questionIds });
    if (!result.success) {
        return { success: false, message: 'Invalid question IDs' };
    }

    try {
        const userId = await requireUser();

        // Delete all questions in bulk
        const result = await deleteQuestions(userId, questionIds);

        revalidatePath('/library/[id]');
        revalidatePath('/');

        return { success: true, count: result.count };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error("Bulk delete failed:", error);
        return { success: false, message: "Failed to delete questions" };
    }
}
