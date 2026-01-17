'use server';

import { revalidatePath } from 'next/cache';
import { ContentInputSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { createContentSource } from '../services/content-service';
import { DomainError } from '@/lib/errors';

export async function saveRawContent(text: string) {
    const result = ContentInputSchema.safeParse({ text });
    if (!result.success) {
        return { success: false, message: result.error.issues[0].message };
    }
    const validatedText = result.data.text;

    try {
        const userId = await requireUser();
        await createContentSource(userId, validatedText);

        revalidatePath('/');
        return { success: true, message: 'Saved successfully' };
    } catch (error) {
        if (error instanceof DomainError) {
            return { success: false, message: error.message };
        }
        console.error('Failed to save content:', error);
        return { success: false, message: 'Failed to save to database' };
    }
}
