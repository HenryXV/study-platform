'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteUnit(unitId: string) {
    if (!unitId) return { success: false, message: "No ID provided" };

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
