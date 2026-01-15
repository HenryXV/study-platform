'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logStudyActivity(itemsCount: number) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Upsert logic: simple check if exists for today or create new
        // Since we don't have user auth yet, we'll assume a single 'demo-user' or purely date-based for now.
        // If we want to support multiple sessions per day, we should probably update the existing record or create multiple and sum them.
        // Let's UPDATE if exists, CREATE if not.

        // Check for existing log for TODAY
        const existingLog = await prisma.studyLog.findFirst({
            where: {
                date: today,
                userId: 'demo-user' // Hardcoded for single-user MVP
            }
        });

        if (existingLog) {
            await prisma.studyLog.update({
                where: { id: existingLog.id },
                data: { itemsReviewed: { increment: itemsCount } }
            });
        } else {
            await prisma.studyLog.create({
                data: {
                    userId: 'demo-user',
                    date: today,
                    itemsReviewed: itemsCount
                }
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to log activity:', error);
        return { success: false };
    }
}
