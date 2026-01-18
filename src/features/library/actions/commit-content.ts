'use server';

import { revalidatePath } from 'next/cache';
import { ApprovedDraftData } from '../components/DraftSupervisor';
import { CuidSchema } from '@/lib/validation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { commitDraftToLibrary } from '../services/content-service';
import { processSourceEmbeddings } from '../services/ingestion-service';
import { DomainError } from '@/lib/errors';

const DraftUnitSchema = z.object({
    title: z.string().min(1).max(500),
    type: z.enum(['TEXT', 'CODE']),
    description: z.string().optional(),
});

const ApprovedDraftDataSchema = z.object({
    suggestedSubject: z.string().min(1).max(200),
    suggestedTopics: z.array(z.string().min(1).max(100)),
    units: z.array(DraftUnitSchema).min(1),
});

export async function commitContent(sourceId: string, data: ApprovedDraftData) {
    const idResult = CuidSchema.safeParse(sourceId);
    if (!idResult.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    const dataResult = ApprovedDraftDataSchema.safeParse(data);
    if (!dataResult.success) {
        return { success: false, message: 'Invalid data format: ' + dataResult.error.issues[0].message };
    }

    try {
        const userId = await requireUser();
        const count = await commitDraftToLibrary(userId, sourceId, data);

        // Process Embeddings for RAG (Chunking & Vectorization)
        // We do this AFTER saving the units so that the source is fully established
        try {
            await processSourceEmbeddings(userId, sourceId);
        } catch (embeddingError) {
            console.error('Embeddings Generation Failed (Partial Success):', embeddingError);
            // Return success but indicate embedding failure
            revalidatePath('/');
            return { success: true, count, embeddingFailed: true };
        }

        revalidatePath('/');
        return { success: true, count, embeddingFailed: false };

    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error('Commit Failed:', error);
        return { success: false, message: 'Failed to save content to library.' };
    }
}
