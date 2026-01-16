import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { vi } from 'vitest';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should update the value after the specified delay', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 500 },
        });

        rerender({ value: 'updated', delay: 500 });

        // Value should not update immediately
        expect(result.current).toBe('initial');

        // Fast forward time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Value should now be updated
        expect(result.current).toBe('updated');
    });

    it('should cancel previous timer if value changes quickly', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 500 },
        });

        rerender({ value: 'update1', delay: 500 });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        rerender({ value: 'update2', delay: 500 });

        act(() => {
            vi.advanceTimersByTime(300); // Total 550ms from start, but only 300ms from last update
        });

        // Should still be initial because the second update reset the timer
        expect(result.current).toBe('initial');

        act(() => {
            vi.advanceTimersByTime(200); // 500ms since 'update2'
        });

        expect(result.current).toBe('update2');
    });
});
