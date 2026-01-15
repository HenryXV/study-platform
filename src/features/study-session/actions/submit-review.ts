'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitReviewSchema = z.object({
    questionId: z.string(),
    rating: z.enum(['FORGOT', 'HARD', 'EASY']),
});

export async function submitReview(questionId: string, rating: 'FORGOT' | 'HARD' | 'EASY') {
    // 1. Validation
    const result = submitReviewSchema.safeParse({ questionId, rating });
    if (!result.success) {
        throw new Error('Invalid input');
    }

    // 2. Fetch current question state
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: {
            interval: true,
            easeFactor: true,
            streak: true,
        },
    });

    if (!question) {
        throw new Error('Question not found');
    }

    // 3. Simplified SM-2 Algorithm
    let { interval, easeFactor, streak } = question;

    if (rating === 'FORGOT') {
        streak = 0;
        // Requirements: interval = 1 (day)
        interval = 1;
        // Requirements: easeFactor decreases slightly
        easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 'HARD') {
        streak += 1;
        // Requirements: interval * 1.2
        interval = Math.ceil(interval * 1.2);
        // Requirements: easeFactor stays same
    } else if (rating === 'EASY') {
        streak += 1;
        // Requirements: interval * easeFactor * 1.3
        interval = Math.ceil(interval * easeFactor * 1.3);
        // User Feedback: Increase ease factor
        easeFactor = easeFactor + 0.15;
    }

    // Correction: If the card was new (interval 0) and remains 0 after calc, bump to 1.
    if (rating !== 'FORGOT' && interval === 0) {
        interval = 1;
    }

    // 4. Calculate New Date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // 5. Update Database
    const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
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
