import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    commitQuestions,
    deleteQuestion,
    updateQuestions
} from '@/features/library/services/question-service';
import { QuestionRepository } from '@/features/library/repositories/question.repository';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { NotFoundError } from '@/lib/errors';

// Mock Repositories
vi.mock('@/features/library/repositories/question.repository', () => ({
    QuestionRepository: {
        deleteMany: vi.fn(),
        createBatch: vi.fn(),
        updateBatch: vi.fn(),
    },
}));

vi.mock('@/features/library/repositories/content.repository', () => ({
    ContentRepository: {
        findUnitById: vi.fn(),
    },
}));

describe('Question Service', () => {
    const userId = 'user-123';
    const unitId = 'unit-123';
    const questionId = 'q-123';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('commitQuestions', () => {
        it('should verify unit exists and commit questions', async () => {
            // Arrange
            const mockUnit = { id: unitId, source: { subjectId: 'sub-1' } };
            vi.mocked(ContentRepository.findUnitById).mockResolvedValue(mockUnit as any);
            vi.mocked(QuestionRepository.createBatch).mockResolvedValue([1, 2, 3] as any); // 3 items created

            const questions = [{ question: 'Q1', answer: 'A1' }];

            // Act
            const count = await commitQuestions(userId, unitId, questions as any);

            // Assert
            expect(ContentRepository.findUnitById).toHaveBeenCalledWith(unitId);
            expect(QuestionRepository.createBatch).toHaveBeenCalledWith(
                userId, unitId, 'sub-1', questions
            );
            expect(count).toBe(3);
        });

        it('should throw NotFoundError if unit missing', async () => {
            vi.mocked(ContentRepository.findUnitById).mockResolvedValue(null);

            await expect(commitQuestions(userId, unitId, [])).rejects.toThrow(NotFoundError);
            expect(QuestionRepository.createBatch).not.toHaveBeenCalled();
        });
    });

    describe('deleteQuestion', () => {
        it('should delete question successfully', async () => {
            vi.mocked(QuestionRepository.deleteMany).mockResolvedValue({ count: 1 });

            await deleteQuestion(userId, questionId);

            expect(QuestionRepository.deleteMany).toHaveBeenCalledWith(userId, [questionId]);
        });

        it('should throw NotFoundError if nothing deleted', async () => {
            vi.mocked(QuestionRepository.deleteMany).mockResolvedValue({ count: 0 });

            await expect(deleteQuestion(userId, questionId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateQuestions', () => {
        it('should perform batch updates and deletions', async () => {
            // Arrange
            const updates = [{ id: 'q1', question: 'Updated' }];
            const deletedIds = ['q99'];

            // Act
            await updateQuestions(userId, updates as any, deletedIds);

            // Assert
            expect(QuestionRepository.deleteMany).toHaveBeenCalledWith(userId, deletedIds);
            expect(QuestionRepository.updateBatch).toHaveBeenCalledWith(userId, updates);
        });

        it('should do nothing if inputs empty', async () => {
            await updateQuestions(userId, [], []);

            expect(QuestionRepository.deleteMany).not.toHaveBeenCalled();
            expect(QuestionRepository.updateBatch).not.toHaveBeenCalled();
        });
    });
});
