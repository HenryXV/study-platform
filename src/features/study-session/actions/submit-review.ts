'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateNextReview } from '@/lib/srs-algorithm';
import { requireUser } from '@/lib/auth';

const submitReviewSchema = z.object({
    questionId: z.string().cuid(),
    rating: z.enum(['FORGOT', 'HARD', 'EASY']),
});

export async function submitReview(questionId: string, rating: 'FORGOT' | 'HARD' | 'EASY') {
    // 1. Validation
    const result = submitReviewSchema.safeParse({ questionId, rating });
    if (!result.success) {
        throw new Error('Invalid input');
    }

    const userId = await requireUser();

    // 2. Fetch current question state with ownership check
    const question = await prisma.question.findFirst({
        where: { id: questionId, userId },
        select: {
            interval: true,
            easeFactor: true,
            streak: true,
        },
    });

    if (!question) {
        throw new Error('Question not found or unauthorized');
    }

    // 3. Calculate next review using SM-2 algorithm
    const { interval, easeFactor, streak, nextReviewDate } = calculateNextReview(
        rating,
        {
            interval: question.interval,
            easeFactor: question.easeFactor,
            streak: question.streak,
        }
    );

    // 4. Update Database with ownership check
    const updatedQuestion = await prisma.question.update({
        where: { id: questionId, userId },
        data: {
            interval,
            easeFactor,
            streak,
            lastReviewed: new Date(),
            nextReviewDate,
        },
        select: {
            nextReviewDate: true,
        },
    });

    return updatedQuestion.nextReviewDate;
}
