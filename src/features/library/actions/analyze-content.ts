'use server';

import { revalidatePath } from 'next/cache';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { analyzeContent } from '../services/ai-service';
import { commitDraftToLibrary } from '../services/content-service';
import { processSourceEmbeddings } from '../services/ingestion-service';
import {
    ProcessingOptionsSchema,
    ProcessingOptions,
} from '../schemas/processing-options';
import * as CreditService from '../services/credit-service';
import { calculateCost } from '../config/pricing-config';

export async function analyzeAndPersistContent(
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
        // Check sufficient balance (estimated 15CP for analysis)
        const MIN_ESTIMATED_COST = 15;
        const hasBalance = await CreditService.hasSufficientBalance(userId, MIN_ESTIMATED_COST);
        if (!hasBalance) {
            return { success: false, message: "INSUFFICIENT_COMPUTE" };
        }

        // 1. Generate Content
        const result = await analyzeContent(userId, sourceId, optionsResult.data);
        const { output, usage, model } = result;

        // 2. Bill the user
        try {
            const cost = calculateCost(model, usage.promptTokens, usage.completionTokens);
            await CreditService.billUsage(userId, cost, {
                action: 'ANALYZE_CONTENT_PREVIEW', // Keeping action name for analytics consistency or update if needed
                model,
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
                resourceId: sourceId
            });
        } catch (billingError) {
            console.error("Billing Failed:", billingError);
            // We continue even if billing logging fails, but in strict fintech we might want to rollback
        }

        // 3. Persist Immediately
        try {
            // Transform AI output to fit draft structure if needed, 
            // currently analyzeContent output.units matches expectations
            const draftData = {
                suggestedSubject: output.suggestedSubject,
                suggestedTopics: output.suggestedTopics,
                units: output.units.map((u: any) => ({
                    title: u.title,
                    description: u.description,
                    type: u.type as 'TEXT' | 'CODE',
                }))
            };

            await commitDraftToLibrary(userId, sourceId, draftData);

            // 4. Process Embeddings (Background-ish)
            try {
                await processSourceEmbeddings(userId, sourceId);
            } catch (embeddingError) {
                console.error('Embeddings Generation Failed (Partial Success):', embeddingError);
                revalidatePath('/');
                return { success: true, embeddingFailed: true };
            }

            revalidatePath('/');
            return {
                success: true,
                embeddingFailed: false
            };

        } catch (persistError) {
            console.error('Persistence Failed:', persistError);
            return { success: false, message: 'Analysis succeeded but failed to save results.' };
        }

    } catch (error) {
        console.error('AI Processing Failed:', error);
        return { success: false, message: 'Failed to process content' };
    }
}
