'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';

export async function deleteContentSource(sourceId: string) {
    const result = CuidSchema.safeParse(sourceId);
    if (!result.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    const userId = await requireUser();

    try {
        const deleted = await prisma.contentSource.deleteMany({
            where: { id: sourceId, userId }
        });

        if (deleted.count === 0) {
            return { success: false, message: 'Source not found or unauthorized' };
        }

        revalidatePath('/library');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete source:", error);
        return { success: false, message: "Failed to delete source" };
    }
}
