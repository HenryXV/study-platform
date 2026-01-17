/**
 * SRS (Spaced Repetition System) Algorithm Utilities
 * 
 * Pure functions for SM-2 spaced repetition algorithm and Systemizer Score calculation.
 * These are extracted from server actions to enable unit testing without database mocking.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SRSRating = 'FORGOT' | 'HARD' | 'EASY';

export interface SRSState {
    interval: number;
    easeFactor: number;
    streak: number;
}

export interface SRSResult extends SRSState {
    nextReviewDate: Date;
}

export interface QuestionForScoring {
    nextReviewDate: Date;
    interval: number;
    type: string;
    lastReviewed: Date | null;
}

// ---------------------------------------------------------------------------
// SM-2 Algorithm
// ---------------------------------------------------------------------------

/**
 * Calculate the next review state based on SM-2 algorithm.
 * 
 * @param rating - User's rating of how well they remembered (FORGOT, HARD, EASY)
 * @param current - Current SRS state (interval, easeFactor, streak)
 * @param now - Current timestamp (defaults to now)
 * @param lastReviewDate - When the card was last reviewed (optional). Used to prevent gaming.
 * @returns New SRS state with calculated nextReviewDate
 * 
 * @example
 * const result = calculateNextReview('EASY', { interval: 1, easeFactor: 2.5, streak: 0 });
 * // { interval: 4, easeFactor: 2.65, streak: 1, nextReviewDate: Date }
 */
export function calculateNextReview(
    rating: SRSRating,
    current: SRSState,
    now: Date = new Date(),
    lastReviewDate?: Date
): SRSResult {
    // GAMING PREVENTION:
    // If the user reviews the same card multiple times on the same day, ignore the result
    // to prevent artificially inflating the interval (e.g., spamming "Easy").
    // We EXCLUDE 'FORGOT' from this check because if you forgot it, you forgot it.
    if (lastReviewDate && rating !== 'FORGOT') {
        const isSameDay =
            now.getUTCFullYear() === lastReviewDate.getUTCFullYear() &&
            now.getUTCMonth() === lastReviewDate.getUTCMonth() &&
            now.getUTCDate() === lastReviewDate.getUTCDate();

        if (isSameDay) {
            // Return current state without changes, effectively ignoring this review.
            // We set nextReviewDate based on the *current* interval so it stays "due" roughly when it was.
            // We use 'now' + interval ensuring that if they review it today (and get ignored), 
            // it's still due in 'interval' days from today.
            const nextReviewDate = new Date(now);
            nextReviewDate.setDate(nextReviewDate.getDate() + current.interval);

            return {
                ...current,
                nextReviewDate
            };
        }
    }

    let { interval, easeFactor, streak } = current;

    if (rating === 'FORGOT') {
        streak = 0;
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 'HARD') {
        streak += 1;
        interval = Math.ceil(interval * 1.2);
    } else if (rating === 'EASY') {
        streak += 1;
        interval = Math.ceil(interval * easeFactor * 1.3);
        easeFactor = easeFactor + 0.15;
    }

    // If the card was new (interval 0) and remains 0 after calc, bump to 1
    if (rating !== 'FORGOT' && interval === 0) {
        interval = 1;
    }

    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        interval,
        easeFactor,
        streak,
        nextReviewDate,
    };
}

// ---------------------------------------------------------------------------
// Systemizer Score
// ---------------------------------------------------------------------------

/**
 * Calculate the Systemizer Score for prioritizing questions.
 * Higher scores = higher priority for review.
 * 
 * @param question - Question data with SRS fields
 * @param now - Current timestamp (defaults to now)
 * @returns Priority score (higher = more urgent)
 * 
 * Scoring factors:
 * - Overdue Penalty: +1 per day overdue
 * - Danger Zone: +50 if interval < 3 (fragile cards)
 * - Interest Bonus: +20 for CODE/SNIPPET questions
 * - New Item Bonus: +10 for never-reviewed cards
 */
export function calculateSystemizerScore(
    question: QuestionForScoring,
    now: Date = new Date()
): number {
    let score = 0;

    // Overdue Penalty: +1 per day overdue
    const dueDate = new Date(question.nextReviewDate);
    const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    score += daysOverdue;

    // Danger Zone: +50 for fragile cards (interval < 3)
    if (question.interval < 3) {
        score += 50;
    }

    // Interest Bonus: +20 for code questions
    if (question.type === 'SNIPPET') {
        score += 20;
    }

    // New Item Bonus: +10 for never-reviewed cards
    if (question.interval === 0 || !question.lastReviewed) {
        score += 10;
    }

    return score;
}
