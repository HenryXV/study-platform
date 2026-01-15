'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteContentSource(sourceId: string) {
    if (!sourceId) return { success: false, message: "No ID provided" };

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
