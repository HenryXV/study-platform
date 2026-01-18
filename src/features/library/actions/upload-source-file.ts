'use server';

interface UploadResult {
    success: boolean;
    message: string;
}

import { auth } from '@clerk/nextjs/server';
import { saveRawSource } from '@/features/library/services/ingestion-service';
import { revalidatePath } from 'next/cache';

export async function uploadSourceFile(formData: FormData): Promise<UploadResult> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, message: 'Unauthorized' };
    }

    const file = formData.get('file') as File | null;

    if (!file) {
        return { success: false, message: 'No file provided' };
    }

    if (file.type !== 'application/pdf') {
        return { success: false, message: 'Only PDF files are currently supported' };
    }

    try {
        await saveRawSource(userId, file, file.name);
        revalidatePath('/dashboard');
        return {
            success: true,
            message: `File "${file.name}" uploaded successfully. Processing will start shortly.`
        };
    } catch (error) {
        console.error('Ingestion failed:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to process file'
        };
    }
}
