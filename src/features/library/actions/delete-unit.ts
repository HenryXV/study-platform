'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';

export async function deleteUnit(unitId: string) {
    const result = CuidSchema.safeParse(unitId);
    if (!result.success) {
        return { success: false, message: 'Invalid unit ID format' };
    }

    const userId = await requireUser();

    try {
        // StudyUnit doesn't have userId directly, so check via source relationship
        const deleted = await prisma.studyUnit.deleteMany({
            where: {
                id: unitId,
                source: { userId }
            }
        });

        if (deleted.count === 0) {
            return { success: false, message: 'Unit not found or unauthorized' };
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete unit:", error);
        return { success: false, message: "Failed to delete" };
    }
}
