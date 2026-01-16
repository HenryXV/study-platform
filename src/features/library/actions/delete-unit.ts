'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';

export async function deleteUnit(unitId: string) {
    const result = CuidSchema.safeParse(unitId);
    if (!result.success) {
        return { success: false, message: 'Invalid unit ID format' };
    }

    try {
        await prisma.studyUnit.delete({
            where: { id: unitId }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete unit:", error);
        return { success: false, message: "Failed to delete" };
    }
}
