'use server';

import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { updateQuestionReviewStatus } from '../services/review-service';

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

    // 2. Delegate to Domain Service
    const nextReviewDate = await updateQuestionReviewStatus(questionId, rating, userId);

    return nextReviewDate;
}
