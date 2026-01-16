'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';

export async function deleteQuestion(questionId: string) {
    const result = CuidSchema.safeParse(questionId);
    if (!result.success) {
        return { success: false, message: 'Invalid question ID format' };
    }

    const userId = await requireUser();

    try {
        const deleted = await prisma.question.deleteMany({
            where: { id: questionId, userId }
        });

        if (deleted.count === 0) {
            return { success: false, message: 'Question not found or unauthorized' };
        }

        revalidatePath('/library/[id]');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete question:", error);
        return { success: false, message: "Failed to delete question" };
    }
}
