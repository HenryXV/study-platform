'use server';

import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { analyzeContent } from '../services/ai-service';
import {
    ProcessingOptionsSchema,
    ProcessingOptions,
} from '../schemas/processing-options';

export async function analyzeContentPreview(
    sourceId: string,
    options?: ProcessingOptions
) {
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

    // Validate and apply defaults
    const optionsResult = ProcessingOptionsSchema.safeParse(options ?? {});
    if (!optionsResult.success) {
        return { success: false, message: 'Invalid processing options' };
    }

    try {
        const output = await analyzeContent(userId, sourceId, optionsResult.data);
        return {
            success: true,
            data: output
        };

    } catch (error) {
        console.error('AI Preview Failed:', error);
        return { success: false, message: 'Failed to generate preview' };
    }
}
