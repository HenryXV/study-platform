'use server';

import { QuestionSchema, EditableQuestion } from '@/features/library/schemas/question-generator';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { updateQuestions as updateQuestionsService } from '../services/question-service';
import { DomainError } from '@/lib/errors';

const DeletedIdsSchema = z.array(CuidSchema);

export async function updateQuestions(unitId: string, questions: EditableQuestion[], deletedIds: string[] = []) {
    const parseResult = z.array(QuestionSchema.extend({ id: z.string().optional() })).safeParse(questions);
    const deletedIdsResult = DeletedIdsSchema.safeParse(deletedIds);

    if (!parseResult.success) {
        return { success: false, message: "Validation failed: " + parseResult.error.issues.map(e => e.message).join(", ") };
    }

    if (!deletedIdsResult.success) {
        return { success: false, message: "Invalid deleted IDs format" };
    }

    const existingQuestions = parseResult.data.filter(q => q.id);
    const newQuestions = parseResult.data.filter(q => !q.id);

    // Check if there is anything to do
    if (existingQuestions.length === 0 && newQuestions.length === 0 && deletedIds.length === 0) {
        return { success: false, message: "No questions to update or delete" };
    }

    try {
        const userId = await requireUser();
        // Cast parseResult.data to EditableQuestion[] because validated inputs are safe
        await updateQuestionsService(userId, unitId, parseResult.data as EditableQuestion[], deletedIds);

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error("Update failed:", error);
        return { success: false, message: "Update operation failed" };
    }
}
