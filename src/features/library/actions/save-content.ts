'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveRawContent(text: string) {
    if (!text || text.trim().length === 0) {
        return { success: false, message: 'Content cannot be empty' };
    }

    try {
        // Auto-generate title first 30 chars or fallback to timestamp
        const title = text.trim().slice(0, 30) + (text.length > 30 ? '...' : '') || `Quick Note: ${new Date().toLocaleString()}`;

        await prisma.contentSource.create({
            data: {
                title,
                bodyText: text,
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
