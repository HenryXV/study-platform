'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteQuestion(questionId: string) {
    if (!questionId) return { success: false, message: "No ID provided" };

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
