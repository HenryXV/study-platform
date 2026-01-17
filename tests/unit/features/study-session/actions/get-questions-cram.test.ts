// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuestions } from '@/features/study-session/actions/get-questions';
import { fetchQuestions } from '@/features/study-session/services/session-service';
import { requireUser } from '@/lib/auth';

// Mock Dependencies
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    requireUser: vi.fn(),
}));

vi.mock('@/features/study-session/services/session-service', () => ({
    fetchQuestions: vi.fn(),
}));

describe('getQuestions - Cram Mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should delegate to fetchQuestions with cram mode', async () => {
        // Arrange
        vi.mocked(requireUser).mockResolvedValue('user_123');
        const mockQuestions = [{ id: 'q1', isReviewAhead: false }];
        vi.mocked(fetchQuestions).mockResolvedValue(mockQuestions as any);

        // Act
        const result = await getQuestions(10, {
            mode: 'cram',
            subjectIds: ['sub1'],
        });

        // Assert
        expect(requireUser).toHaveBeenCalled();
        expect(fetchQuestions).toHaveBeenCalledWith(
            'user_123',
            'cram',
            10,
            'sub1',
            undefined
        );
        expect(result).toEqual(mockQuestions);
    });

    it('should handle validation errors gracefully', async () => {
        // Act
        const result = await getQuestions(-5); // Invalid limit

        // Assert
        expect(result).toEqual([]);
        expect(fetchQuestions).not.toHaveBeenCalled();
    });
});
