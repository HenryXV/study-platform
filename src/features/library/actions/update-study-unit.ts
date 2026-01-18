'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { ContentRepository } from '../repositories/content.repository';
import { CuidSchema } from '@/lib/validation';

const UpdateUnitSchema = z.object({
    unitId: CuidSchema,
    content: z.string().min(1).max(500),
    description: z.string().optional(),
});

export async function updateStudyUnit(unitId: string, content: string, description?: string) {
    const check = UpdateUnitSchema.safeParse({ unitId, content, description });
    if (!check.success) {
        return { success: false, message: check.error.issues[0].message };
    }

    try {
        const userId = await requireUser();
        const updated = await ContentRepository.updateUnit(userId, unitId, {
            content,
            description
        });

        if (!updated) {
            return { success: false, message: 'Unit not found or unauthorized' };
        }

        revalidatePath('/library');
        return { success: true, unit: updated };
    } catch (error) {
        console.error('Update Unit Failed:', error);
        return { success: false, message: 'Failed to update study unit' };
    }
}
