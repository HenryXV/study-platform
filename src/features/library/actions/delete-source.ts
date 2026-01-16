'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';

export async function deleteContentSource(sourceId: string) {
    const result = CuidSchema.safeParse(sourceId);
    if (!result.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    try {
        await prisma.contentSource.delete({
            where: { id: sourceId }
        });

        revalidatePath('/library');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete source:", error);
        return { success: false, message: "Failed to delete source" };
    }
}
