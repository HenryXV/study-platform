'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ContentInputSchema } from '@/lib/validation';

export async function saveRawContent(text: string) {
    const result = ContentInputSchema.safeParse({ text });
    if (!result.success) {
        return { success: false, message: result.error.issues[0].message };
    }
    const validatedText = result.data.text;

    try {
        // Auto-generate title first 30 chars or fallback to timestamp
        const title = validatedText.trim().slice(0, 30) + (validatedText.length > 30 ? '...' : '') || `Quick Note: ${new Date().toLocaleString()}`;

        await prisma.contentSource.create({
            data: {
                title,
                bodyText: validatedText,
                status: 'UNPROCESSED',
            },
        });

        revalidatePath('/'); // Revalidate relevant paths if needed
        return { success: true, message: 'Saved successfully' };
    } catch (error) {
        console.error('Failed to save content:', error);
        return { success: false, message: 'Failed to save to database' };
    }
}
