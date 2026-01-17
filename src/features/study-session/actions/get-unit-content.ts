'use server';

import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { fetchUnitContent } from '../services/session-service';

export async function getUnitContent(unitId: string) {
    let userId: string;
    try {
        userId = await requireUser();
    } catch {
        return { success: false, error: 'Unauthorized' };
    }

    const idResult = CuidSchema.safeParse(unitId);
    if (!idResult.success) {
        return { success: false, error: 'Invalid unit ID format' };
    }

    try {
        const result = await fetchUnitContent(userId, unitId);
        return {
            success: true,
            content: result.content,
            sourceTitle: result.sourceTitle
        };
    } catch (error) {
        console.error('Failed to fetch unit content:', error);
        // Note: The service throws "Unit not found" or other errors.
        // We catch them here to return the safe object as before.
        if (error instanceof Error && error.message === 'Unit not found') {
            return { success: false, error: 'Unit not found' };
        }
        return { success: false, error: 'Failed to fetch content' };
    }
}
