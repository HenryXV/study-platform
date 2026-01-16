/**
 * Streak Calculator Utility
 * 
 * Pure function for calculating consecutive day streaks from activity dates.
 * Extracted from dashboard actions to enable unit testing without database mocking.
 */

import { startOfDay, subDays } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityLog {
    date: Date;
}

// ---------------------------------------------------------------------------
// Streak Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the consecutive day streak from activity logs.
 * 
 * @param logs - Array of activity logs with dates, sorted descending by date
 * @param now - Current timestamp (defaults to now)
 * @returns Number of consecutive days with activity (including today/yesterday)
 * 
 * Rules:
 * - Streak starts from today or yesterday (if today has no activity yet)
 * - Each consecutive previous day with activity extends the streak
 * - A gap of 2+ days breaks the streak
 * - Multiple logs on the same day count as one day
 * 
 * @example
 * // Activity on today, yesterday, and 2 days ago
 * calculateStreak([{ date: today }, { date: yesterday }, { date: twoDaysAgo }]);
 * // Returns 3
 */
export function calculateStreak(
    logs: ActivityLog[],
    now: Date = new Date()
): number {
    if (logs.length === 0) return 0;

    const today = startOfDay(now);
    const yesterday = subDays(today, 1);

    // Check if most recent activity is today or yesterday
    const lastActivity = startOfDay(logs[0].date);
    if (lastActivity < yesterday) {
        return 0; // Streak broken - no activity in last 2 days
    }

    let streak = 0;
    let currentDate = lastActivity;

    for (const log of logs) {
        const logDate = startOfDay(log.date);

        // Skip duplicate log entries for the same day
        if (logDate.getTime() === currentDate.getTime()) {
            continue;
        }

        // Check if this log is exactly 1 day before current
        const expectedPreviousDay = subDays(currentDate, 1);
        if (logDate.getTime() === expectedPreviousDay.getTime()) {
            streak++;
            currentDate = logDate;
        } else {
            break; // Gap found, streak ends
        }
    }

    // Add 1 for the first day (since loop only counts transitions)
    return streak + 1;
}
