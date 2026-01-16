import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStudySession } from '@/features/study-session/hooks/useStudySession';
import type { FlashCard } from '@/features/study-session/data/flash-cards';

// Mock the server actions
vi.mock('@/features/study-session/actions/submit-review', () => ({
    submitReview: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('@/features/library/actions/get-overtime-questions', () => ({
    getOvertimeQuestions: vi.fn(() =>
        Promise.resolve({ success: true, questions: [] })
    ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('useStudySession', () => {
    const mockCards: FlashCard[] = [
        {
            id: 'card-1',
            type: 'TEXT',
            question: 'What is React?',
            answer: 'A JavaScript library for building UIs',
        },
        {
            id: 'card-2',
            type: 'TEXT',
            question: 'What is TypeScript?',
            answer: 'A typed superset of JavaScript',
        },
        {
            id: 'card-3',
            type: 'CODE',
            question: 'What does this return?',
            answer: 'undefined',
            codeSnippet: 'function foo() {}',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with first card as current', () => {
        const { result } = renderHook(() => useStudySession(mockCards));

        expect(result.current.currentCard).toEqual(mockCards[0]);
        expect(result.current.isComplete).toBe(false);
        expect(result.current.isFlipped).toBe(false);
    });

    it('returns correct progress', () => {
        const { result } = renderHook(() => useStudySession(mockCards));

        expect(result.current.progress).toEqual({
            current: 1,
            total: 3,
        });
    });

    it('flips the card', () => {
        const { result } = renderHook(() => useStudySession(mockCards));

        expect(result.current.isFlipped).toBe(false);

        act(() => {
            result.current.handleFlip();
        });

        expect(result.current.isFlipped).toBe(true);
    });

    it('advances to next card on handleNext', async () => {
        const { result } = renderHook(() => useStudySession(mockCards));

        expect(result.current.currentCard?.id).toBe('card-1');

        act(() => {
            result.current.handleNext('EASY');
        });

        expect(result.current.currentCard?.id).toBe('card-2');
        expect(result.current.progress.current).toBe(2);
    });

    it('resets flip state when advancing', () => {
        const { result } = renderHook(() => useStudySession(mockCards));

        act(() => {
            result.current.handleFlip();
        });
        expect(result.current.isFlipped).toBe(true);

        act(() => {
            result.current.handleNext('HARD');
        });

        expect(result.current.isFlipped).toBe(false);
    });

    it('marks session as complete after last card', () => {
        const { result } = renderHook(() => useStudySession(mockCards));

        // Go through all cards
        act(() => {
            result.current.handleNext('EASY');
        });
        act(() => {
            result.current.handleNext('EASY');
        });
        act(() => {
            result.current.handleNext('EASY');
        });

        expect(result.current.isComplete).toBe(true);
        expect(result.current.currentCard).toBeUndefined();
    });

    it('handles empty initial cards', () => {
        const { result } = renderHook(() => useStudySession([]));

        expect(result.current.currentCard).toBeUndefined();
        expect(result.current.isComplete).toBe(true);
        expect(result.current.progress.total).toBe(0);
    });

    it('does nothing on handleNext when no current card', () => {
        const { result } = renderHook(() => useStudySession([]));

        // Should not throw
        act(() => {
            result.current.handleNext('FORGOT');
        });

        expect(result.current.isComplete).toBe(true);
    });
});
