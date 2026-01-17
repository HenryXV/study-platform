'use server';

import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logStudyActivity as logActivityService } from '../services/dashboard-service';
import { DomainError } from '@/lib/errors';

const ItemsCountSchema = z.number().int().positive().max(1000);

export async function logStudyActivity(itemsCount: number) {
    const countResult = ItemsCountSchema.safeParse(itemsCount);
    if (!countResult.success) {
        return { success: false, message: 'Invalid items count' };
    }

    try {
        const user = await getCurrentUser();
        await logActivityService(user.id, countResult.data);

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error('Failed to log activity:', error);
        return { success: false };
    }
}
