'use server';

import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { analyzeContent } from '../services/ai-service';

export async function analyzeContentPreview(sourceId: string) {
    let userId: string;
    try {
        userId = await requireUser();
    } catch {
        return { success: false, message: "Unauthorized" };
    }

    const idResult = CuidSchema.safeParse(sourceId);
    if (!idResult.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    try {
        const output = await analyzeContent(userId, sourceId);
        return {
            success: true,
            data: output
        };

    } catch (error) {
        console.error('AI Preview Failed:', error);
        return { success: false, message: 'Failed to generate preview' };
    }
}
