'use server';

import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { deleteContentSource as deleteSourceService } from '../services/content-service';
import { DomainError } from '@/lib/errors';

export async function deleteContentSource(sourceId: string) {
    const result = CuidSchema.safeParse(sourceId);
    if (!result.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    try {
        const userId = await requireUser();
        await deleteSourceService(userId, sourceId);

        revalidatePath('/library');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error("Failed to delete source:", error);
        return { success: false, message: "Failed to delete source" };
    }
}
