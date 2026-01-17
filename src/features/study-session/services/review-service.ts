import { calculateNextReview, type SRSRating } from '@/lib/srs-algorithm';
import { QuestionRepository } from '@/features/library/repositories/question.repository';
import { DomainError, NotFoundError } from '@/lib/errors';

/**
 * Updates a question's review status based on the user's rating.
 * Encapsulates the business logic for calculating the next review date
 * and updating the database.
 * 
 * @param questionId - The ID of the question to update
 * @param rating - The user's rating (FORGOT, HARD, EASY)
 * @param userId - The ID of the authenticated user (for ownership check)
 * @returns The calculated next review date
 */
export async function updateQuestionReviewStatus(
    questionId: string,
    rating: SRSRating,
    userId: string
): Promise<Date> {
    // 1. Fetch current question state with ownership check via Repository
    const question = await QuestionRepository.findById(userId, questionId);

    if (!question) {
        throw new NotFoundError('Question not found or unauthorized');
    }

    // 2. Calculate next review using SM-2 algorithm
    const { interval, easeFactor, streak, nextReviewDate } = calculateNextReview(
        rating,
        {
            interval: question.interval,
            easeFactor: question.easeFactor,
            streak: question.streak,
        },
        new Date(),
        question.lastReviewed || undefined
    );

    // 3. Update Database via Repository
    const updatedQuestion = await QuestionRepository.update(userId, questionId, {
        interval,
        easeFactor,
        streak,
        lastReviewed: new Date(),
        nextReviewDate,
    });

    if (!updatedQuestion) {
        throw new NotFoundError('Question not found or unauthorized');
    }

    if (!updatedQuestion.nextReviewDate) {
        throw new DomainError("Failed to retrieve next review date after update");
    }

    return updatedQuestion.nextReviewDate;
}
