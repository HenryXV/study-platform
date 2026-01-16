'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ItemsCountSchema = z.number().int().positive().max(1000);

export async function logStudyActivity(itemsCount: number) {
    const countResult = ItemsCountSchema.safeParse(itemsCount);
    if (!countResult.success) {
        return { success: false, message: 'Invalid items count' };
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const user = await getCurrentUser();
        // Upsert logic: simple check if exists for today or create new
        // Check for existing log for TODAY
        const existingLog = await prisma.studyLog.findFirst({
            where: {
                date: today,
                userId: user.id
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
                    userId: user.id,
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
