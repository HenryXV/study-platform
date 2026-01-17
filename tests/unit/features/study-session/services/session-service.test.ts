import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchQuestions, fetchOvertimeQuestions, fetchUnitContent } from '@/features/study-session/services/session-service';
import { QuestionRepository } from '@/features/library/repositories/question.repository';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { DomainError, NotFoundError, AuthorizationError } from '@/lib/errors';

// Mock QuestionRepository
vi.mock('@/features/library/repositories/question.repository', () => ({
    QuestionRepository: {
        findDue: vi.fn(),
        findNew: vi.fn(),
        findReviewAhead: vi.fn(),
        findFuture: vi.fn(),
    },
}));

vi.mock('@/features/library/repositories/content.repository', () => ({
    ContentRepository: {
        findUnitById: vi.fn(),
    },
}));

describe('Session Service', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('fetchQuestions - Cram Mode', () => {
        it('should fetch due items first, then new items, then future items', async () => {
            // Arrange
            // 1. Due (returns 2 items)
            vi.mocked(QuestionRepository.findDue).mockResolvedValue([
                { id: 'due1', data: {}, topics: [] },
                { id: 'due2', data: {}, topics: [] }
            ] as any);

            // 2. New (returns 1 item)
            vi.mocked(QuestionRepository.findNew).mockResolvedValue([
                { id: 'new1', data: {}, topics: [] }
            ] as any);

            // 3. Future (returns 2 items)
            vi.mocked(QuestionRepository.findFuture).mockResolvedValue([
                { id: 'future1', data: {}, topics: [] },
                { id: 'future2', data: {}, topics: [] }
            ] as any);

            // Limit 5
            const limit = 5;

            // Act
            const result = await fetchQuestions(userId, 'cram', limit);

            // Assert
            expect(result).toHaveLength(5);
            expect(result.map(q => q.id)).toEqual(['due1', 'due2', 'new1', 'future1', 'future2']);

            // Verify Logic Flow
            // 1. Called findDue
            expect(QuestionRepository.findDue).toHaveBeenCalledWith(userId, limit, expect.any(Date), expect.any(Object));

            // 2. Called findNew with remaining needed (5 - 2 = 3)
            expect(QuestionRepository.findNew).toHaveBeenCalledWith(userId, 3, 'desc', expect.any(Object));

            // 3. SKIPPED findReviewAhead (since not smart mode)
            expect(QuestionRepository.findReviewAhead).not.toHaveBeenCalled();

            // 4. Called findFuture with remaining needed (5 - 3 = 2) and exclude list
            expect(QuestionRepository.findFuture).toHaveBeenCalledWith(
                userId,
                2,
                expect.any(Date),
                ['due1', 'due2', 'new1'],
                expect.any(Object)
            );
        });
    });

    describe('fetchQuestions - Smart Mode', () => {
        it('should use review ahead if enabled', async () => {
            // Arrange
            vi.mocked(QuestionRepository.findDue).mockResolvedValue([]);
            vi.mocked(QuestionRepository.findNew).mockResolvedValue([]);
            vi.mocked(QuestionRepository.findReviewAhead).mockResolvedValue([
                { id: 'ahead1', data: {}, topics: [] }
            ] as any);
            vi.mocked(QuestionRepository.findFuture).mockResolvedValue([]);

            // Act
            const result = await fetchQuestions(userId, 'smart', 5);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].isReviewAhead).toBe(true);
            expect(QuestionRepository.findReviewAhead).toHaveBeenCalled();
        });
    });

    describe('fetchQuestions - Error Handling', () => {
        it('should rethrow DomainError', async () => {
            vi.mocked(QuestionRepository.findDue).mockRejectedValue(new DomainError("DB Fail"));

            await expect(fetchQuestions(userId, 'smart', 5)).rejects.toThrow(DomainError);
        });
    });

    describe('fetchOvertimeQuestions', () => {
        it('should return due questions excluding specific IDs', async () => {
            // Arrange
            vi.mocked(QuestionRepository.findDue).mockResolvedValue([
                { id: 'q1', data: {}, topics: [] },
                { id: 'q2', data: {}, topics: [] },
                { id: 'q3', data: {}, topics: [] },
            ] as any);

            // Act
            // Request 2, exclude q1. Should return q2, q3.
            const result = await fetchOvertimeQuestions(userId, ['q1'], 2);

            // Assert
            expect(result).toHaveLength(2);
            expect(result.map(q => q.id)).toEqual(['q2', 'q3']);
            // Verify we asked for more to account for exclusions (limit + exclude length)
            expect(QuestionRepository.findDue).toHaveBeenCalledWith(userId, 3);
        });

        it('should fall back to new questions if due questions are insufficient', async () => {
            // Arrange
            vi.mocked(QuestionRepository.findDue).mockResolvedValue([
                { id: 'q1', data: {}, topics: [] }
            ] as any);

            vi.mocked(QuestionRepository.findNew).mockResolvedValue([
                { id: 'new1', data: {}, topics: [] },
                { id: 'new2', data: {}, topics: [] }
            ] as any);

            // Act
            const result = await fetchOvertimeQuestions(userId, [], 3);

            // Assert
            expect(result).toHaveLength(3);
            expect(result.map(q => q.id)).toEqual(['q1', 'new1', 'new2']);
            expect(QuestionRepository.findNew).toHaveBeenCalled();
        });
    });

    describe('fetchUnitContent', () => {
        it('should return content for owned unit', async () => {
            // Arrange
            const mockUnit = {
                id: 'unit-1',
                content: 'Some content',
                type: 'TEXT',
                source: {
                    id: 'source-1',
                    title: 'Source Title',
                    userId: userId // Matches
                }
            };
            vi.mocked(ContentRepository.findUnitById).mockResolvedValue(mockUnit as any);

            // Act
            const result = await fetchUnitContent(userId, 'unit-1');

            // Assert
            expect(result.content).toBe('Some content');
            expect(result.sourceTitle).toBe('Source Title');
        });

        it('should throw NotFoundError if unit does not exist', async () => {
            vi.mocked(ContentRepository.findUnitById).mockResolvedValue(null);

            await expect(fetchUnitContent(userId, 'missing-unit'))
                .rejects.toThrow(NotFoundError);
        });

        it('should throw AuthorizationError if user does not own unit', async () => {
            // Arrange
            const mockUnit = {
                id: 'unit-1',
                source: {
                    userId: 'other-user' // Mismatch
                }
            };
            vi.mocked(ContentRepository.findUnitById).mockResolvedValue(mockUnit as any);

            await expect(fetchUnitContent(userId, 'unit-1'))
                .rejects.toThrow(AuthorizationError);
        });
    });
});
