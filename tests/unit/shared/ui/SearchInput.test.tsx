import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchInput } from '@/shared/ui/SearchInput';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock correct useRouter export from next/navigation
const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn(() => new URLSearchParams());
const mockMsgInfo = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: mockReplace,
    }),
    useSearchParams: () => mockUseSearchParams(),
    usePathname: () => '/library',
}));

describe('SearchInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders search input correctly', () => {
        render(<SearchInput />);
        expect(screen.getByPlaceholderText('Search library...')).toBeInTheDocument();
    });

    it('updates URL with query after debounce', async () => {
        render(<SearchInput />);
        const input = screen.getByPlaceholderText('Search library...');

        fireEvent.change(input, { target: { value: 'react' } });

        // Fast forward debounce timer (default 300ms in component)
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(mockReplace).toHaveBeenCalledWith('/library?query=react');
    });

    it('clears query from URL when input is cleared', () => {
        // Mock initial state
        mockUseSearchParams.mockReturnValue(new URLSearchParams('query=react'));

        render(<SearchInput />);

        const clearButton = screen.getByRole('button');
        fireEvent.click(clearButton);

        // Fast forward debounce
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(mockReplace).toHaveBeenCalledWith('/library?');
    });

    it('does not redundant replace if query has not changed', () => {
        // Mock initial state
        mockUseSearchParams.mockReturnValue(new URLSearchParams('query=react'));

        render(<SearchInput />);

        // Trigger debounce without changing value
        act(() => {
            vi.advanceTimersByTime(300);
        });

        // Should NOT have called replace new URL
        // Note: It might call with same URL on mount dependent on debounce initial run, 
        // but our fix prevents redundant calls. 
        // Let's verify our specific fix logic:
        // Initial mount -> debouncedTerm is 'react' -> currentQuery is 'react' -> Return.
        expect(mockReplace).not.toHaveBeenCalled();
    });
});
