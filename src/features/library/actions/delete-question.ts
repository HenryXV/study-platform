'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';

export async function deleteQuestion(questionId: string) {
    const result = CuidSchema.safeParse(questionId);
    if (!result.success) {
        return { success: false, message: 'Invalid question ID format' };
    }

    try {
        await prisma.question.delete({
            where: { id: questionId }
        });

        revalidatePath('/library/[id]');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete question:", error);
        return { success: false, message: "Failed to delete question" };
    }
}
