'use server';

import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { deleteUnit as deleteUnitService } from '../services/content-service';
import { DomainError } from '@/lib/errors';

export async function deleteUnit(unitId: string) {
    const result = CuidSchema.safeParse(unitId);
    if (!result.success) {
        return { success: false, message: 'Invalid unit ID format' };
    }

    try {
        const userId = await requireUser();
        await deleteUnitService(userId, unitId);

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error("Failed to delete unit:", error);
        return { success: false, message: "Failed to delete" };
    }
}
