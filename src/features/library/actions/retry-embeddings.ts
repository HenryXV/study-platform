'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { processSourceEmbeddings } from '../services/ingestion-service';
import { DomainError } from '@/lib/errors';
import { CuidSchema } from '@/lib/validation';

export async function retryEmbeddings(sourceId: string) {
    const idResult = CuidSchema.safeParse(sourceId);
    if (!idResult.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    try {
        const userId = await requireUser();

        await processSourceEmbeddings(userId, sourceId);

        revalidatePath('/');
        return { success: true };

    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error('Retry Embeddings Failed:', error);
        return { success: false, message: 'Failed to process embeddings.' };
    }
}
