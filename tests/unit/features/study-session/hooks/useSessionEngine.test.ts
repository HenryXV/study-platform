import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSessionEngine } from '@/features/study-session/hooks/useSessionEngine';
import { FlashCard } from '@/features/study-session/data/flash-cards';
import { submitReview } from '@/features/study-session/actions/submit-review';
import { getOvertimeQuestions } from '@/features/library/actions/get-overtime-questions';

// Mock dependencies
// Mock dependencies
vi.mock('@/features/study-session/actions/submit-review', () => ({
    submitReview: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('@/features/library/actions/get-overtime-questions', () => ({
    getOvertimeQuestions: vi.fn()
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn()
    }
}));

const mockCards: FlashCard[] = [
    {
        id: '1',
        question: 'Q1',
        answer: 'A1',
        type: 'STANDARD',
        unitId: 'u1',
        subject: { name: 'S1', color: 'blue' }
    } as any,
    {
        id: '2',
        question: 'Q2',
        answer: 'A2',
        type: 'STANDARD',
        unitId: 'u1'
    } as any
];

describe('useSessionEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes correctly', () => {
        const { result } = renderHook(() => useSessionEngine(mockCards));

        expect(result.current.currentCard).toEqual(mockCards[0]);
        expect(result.current.isFinished).toBe(false);
        expect(result.current.progress).toEqual({ current: 1, total: 2 });
    });

    it('advances on submitAnswer', async () => {
        const { result } = renderHook(() => useSessionEngine(mockCards));

        await act(async () => {
            await result.current.submitAnswer('EASY');
        });

        expect(submitReview).toHaveBeenCalledWith('1', 'EASY');
        expect(result.current.currentCard).toEqual(mockCards[1]);
        expect(result.current.progress.current).toBe(2);
    });

    it('handles completion', async () => {
        const { result } = renderHook(() => useSessionEngine(mockCards));

        // Answer card 1
        await act(async () => {
            await result.current.submitAnswer('EASY');
        });

        // Answer card 2
        await act(async () => {
            await result.current.submitAnswer('HARD');
        });

        expect(result.current.isFinished).toBe(true);
        expect(result.current.currentCard).toBeUndefined();
    });

    it('optimistically updates even if submitReview fails', async () => {
        (submitReview as any).mockRejectedValueOnce(new Error('Network error'));
        const { result } = renderHook(() => useSessionEngine(mockCards));

        await act(async () => {
            await result.current.submitAnswer('EASY');
        });

        // Should still advance despite error (optimistic UI)
        expect(result.current.currentCard).toEqual(mockCards[1]);
    });

    it('extends session correctly', async () => {
        const newCards: FlashCard[] = [{ id: '3', question: 'Q3' } as any];
        (getOvertimeQuestions as any).mockResolvedValue({
            success: true,
            questions: newCards
        });

        const { result } = renderHook(() => useSessionEngine(mockCards));

        await act(async () => {
            await result.current.extendSession();
        });

        expect(result.current.progress.total).toBe(3);
    });

    it('handles empty extension', async () => {
        (getOvertimeQuestions as any).mockResolvedValue({
            success: true,
            questions: []
        });

        const { result } = renderHook(() => useSessionEngine(mockCards));
        const initialTotal = result.current.progress.total;

        await act(async () => {
            await result.current.extendSession();
        });

        expect(result.current.progress.total).toBe(initialTotal);
    });
});
