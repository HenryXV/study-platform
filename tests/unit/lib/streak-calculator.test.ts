import { describe, it, expect } from 'vitest';
import { calculateStreak, type ActivityLog } from '@/lib/streak-calculator';
import { subDays, startOfDay } from 'date-fns';

describe('calculateStreak', () => {
    // Use a fixed "now" for deterministic tests
    const fixedNow = new Date('2026-01-15T12:00:00Z');
    const today = startOfDay(fixedNow);
    const yesterday = subDays(today, 1);

    it('returns 0 for empty logs', () => {
        const streak = calculateStreak([], fixedNow);
        expect(streak).toBe(0);
    });

    it('returns 1 for activity only today', () => {
        const logs: ActivityLog[] = [{ date: today }];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(1);
    });

    it('returns 1 for activity only yesterday', () => {
        const logs: ActivityLog[] = [{ date: yesterday }];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(1);
    });

    it('returns 0 if last activity was 2+ days ago', () => {
        const twoDaysAgo = subDays(today, 2);
        const logs: ActivityLog[] = [{ date: twoDaysAgo }];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(0);
    });

    it('counts consecutive days correctly', () => {
        // Activity on today, yesterday, and 2 days ago
        const logs: ActivityLog[] = [
            { date: today },
            { date: yesterday },
            { date: subDays(today, 2) },
        ];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(3);
    });

    it('handles multiple logs on the same day', () => {
        // Two logs on today, one on yesterday
        const logs: ActivityLog[] = [
            { date: today },
            { date: today }, // Duplicate
            { date: yesterday },
        ];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(2);
    });

    it('stops counting at a gap', () => {
        // Activity today, yesterday, then a gap, then 4 days ago
        const logs: ActivityLog[] = [
            { date: today },
            { date: yesterday },
            // Gap on day -2
            { date: subDays(today, 3) },
            { date: subDays(today, 4) },
        ];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(2); // Only today and yesterday
    });

    it('handles week-long streak', () => {
        const logs: ActivityLog[] = [
            { date: today },
            { date: subDays(today, 1) },
            { date: subDays(today, 2) },
            { date: subDays(today, 3) },
            { date: subDays(today, 4) },
            { date: subDays(today, 5) },
            { date: subDays(today, 6) },
        ];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(7);
    });

    it('works when streak starts from yesterday', () => {
        // No activity today, but yesterday and day before
        const logs: ActivityLog[] = [
            { date: yesterday },
            { date: subDays(today, 2) },
            { date: subDays(today, 3) },
        ];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(3);
    });

    it('handles timestamps within the same day correctly', () => {
        // Multiple activities at different times on the same day
        const morningActivity = new Date(today);
        morningActivity.setHours(9, 0, 0, 0);

        const eveningActivity = new Date(today);
        eveningActivity.setHours(21, 0, 0, 0);

        const logs: ActivityLog[] = [
            { date: eveningActivity },
            { date: morningActivity },
            { date: yesterday },
        ];
        const streak = calculateStreak(logs, fixedNow);
        expect(streak).toBe(2);
    });
});
