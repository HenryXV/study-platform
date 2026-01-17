import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateQuestionReviewStatus } from '@/features/study-session/services/review-service';
import { QuestionRepository } from '@/features/library/repositories/question.repository';
import { calculateNextReview } from '@/lib/srs-algorithm';
import { DomainError, NotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/features/library/repositories/question.repository', () => ({
    QuestionRepository: {
        findById: vi.fn(),
        update: vi.fn(),
    },
}));

vi.mock('@/lib/srs-algorithm', () => ({
    calculateNextReview: vi.fn(),
}));

describe('Review Service', () => {
    const userId = 'user-123';
    const questionId = 'q-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateQuestionReviewStatus', () => {
        it('should update question review status correctly', async () => {
            // Arrange
            const mockQuestion = {
                id: questionId,
                interval: 1,
                easeFactor: 2.5,
                streak: 0,
                lastReviewed: null,
            };

            const mockNextReview = {
                interval: 1,
                easeFactor: 2.6,
                streak: 1,
                nextReviewDate: new Date('2024-01-02'),
            };

            vi.mocked(QuestionRepository.findById).mockResolvedValue(mockQuestion as any);
            vi.mocked(calculateNextReview).mockReturnValue(mockNextReview);
            vi.mocked(QuestionRepository.update).mockResolvedValue({
                ...mockQuestion,
                ...mockNextReview,
                lastReviewed: new Date(),
            } as any);

            // Act
            const nextReviewDate = await updateQuestionReviewStatus(questionId, 'EASY', userId);

            // Assert
            expect(QuestionRepository.findById).toHaveBeenCalledWith(userId, questionId);
            expect(calculateNextReview).toHaveBeenCalledWith(
                'EASY',
                expect.objectContaining({
                    interval: 1,
                    easeFactor: 2.5,
                    streak: 0,
                }),
                expect.any(Date),
                undefined
            );
            expect(QuestionRepository.update).toHaveBeenCalledWith(userId, questionId, expect.objectContaining({
                interval: 1,
                easeFactor: 2.6,
                streak: 1,
                nextReviewDate: mockNextReview.nextReviewDate,
            }));
            expect(nextReviewDate).toEqual(mockNextReview.nextReviewDate);
        });

        it('should throw NotFoundError if question not found', async () => {
            vi.mocked(QuestionRepository.findById).mockResolvedValue(null);

            await expect(
                updateQuestionReviewStatus(questionId, 'EASY', userId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw DomainError if update fails to return nextReviewDate', async () => {
            const mockQuestion = {
                id: questionId,
                interval: 1,
                easeFactor: 2.5,
                streak: 0,
                lastReviewed: null,
            };

            vi.mocked(QuestionRepository.findById).mockResolvedValue(mockQuestion as any);
            vi.mocked(calculateNextReview).mockReturnValue({
                interval: 1,
                easeFactor: 2.6,
                streak: 1,
                nextReviewDate: new Date()
            });
            // Mock update returning null/undefined (failed update simulation) OR missing nextReviewDate
            vi.mocked(QuestionRepository.update).mockResolvedValue({
                ...mockQuestion,
                nextReviewDate: undefined // simulate missing field
            } as any);

            await expect(
                updateQuestionReviewStatus(questionId, 'EASY', userId)
            ).rejects.toThrow(DomainError);
        });

        it('should throw NotFoundError if update returns null (unauthorized/deleted during process)', async () => {
            const mockQuestion = {
                id: questionId,
                interval: 1,
                easeFactor: 2.5,
                streak: 0,
                lastReviewed: null,
            };

            vi.mocked(QuestionRepository.findById).mockResolvedValue(mockQuestion as any);
            vi.mocked(calculateNextReview).mockReturnValue({
                interval: 1,
                easeFactor: 2.6,
                streak: 1,
                nextReviewDate: new Date()
            });

            vi.mocked(QuestionRepository.update).mockResolvedValue(null);

            await expect(
                updateQuestionReviewStatus(questionId, 'EASY', userId)
            ).rejects.toThrow(NotFoundError);
        });
    });
});
