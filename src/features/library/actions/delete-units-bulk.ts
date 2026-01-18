'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { deleteUnit } from '../services/content-service';
import { DomainError } from '@/lib/errors';

const BulkDeleteSchema = z.object({
    unitIds: z.array(z.string().cuid()).min(1, 'At least one unit must be selected'),
});

export async function deleteUnitsBulk(unitIds: string[]) {
    const result = BulkDeleteSchema.safeParse({ unitIds });
    if (!result.success) {
        return { success: false, message: 'Invalid unit IDs' };
    }

    try {
        const userId = await requireUser();

        // Delete all units in parallel
        const results = await Promise.allSettled(
            unitIds.map(id => deleteUnit(userId, id))
        );

        const failed = results.filter(r => r.status === 'rejected').length;

        revalidatePath('/');

        if (failed > 0) {
            return {
                success: true,
                count: unitIds.length - failed,
                message: `Deleted ${unitIds.length - failed} units. ${failed} failed.`
            };
        }

        return { success: true, count: unitIds.length };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error("Bulk delete failed:", error);
        return { success: false, message: "Failed to delete units" };
    }
}
