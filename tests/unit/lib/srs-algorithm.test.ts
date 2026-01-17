import { describe, it, expect } from 'vitest';
import {
    calculateNextReview,
    calculateSystemizerScore,
    type SRSState,
    type QuestionForScoring,
} from '@/lib/srs-algorithm';

describe('calculateNextReview (SM-2 Algorithm)', () => {
    const baseState: SRSState = {
        interval: 3,
        easeFactor: 2.5,
        streak: 2,
    };

    const fixedNow = new Date('2026-01-15T12:00:00Z');

    describe('FORGOT rating', () => {
        it('resets interval to 1', () => {
            const result = calculateNextReview('FORGOT', baseState, fixedNow);
            expect(result.interval).toBe(1);
        });

        it('decreases easeFactor by 0.2', () => {
            const result = calculateNextReview('FORGOT', baseState, fixedNow);
            expect(result.easeFactor).toBe(2.3);
        });

        it('respects minimum easeFactor of 1.3', () => {
            const lowEaseState = { ...baseState, easeFactor: 1.4 };
            const result = calculateNextReview('FORGOT', lowEaseState, fixedNow);
            expect(result.easeFactor).toBe(1.3);
        });

        it('resets streak to 0', () => {
            const result = calculateNextReview('FORGOT', baseState, fixedNow);
            expect(result.streak).toBe(0);
        });

        it('sets nextReviewDate to tomorrow', () => {
            const result = calculateNextReview('FORGOT', baseState, fixedNow);
            const expectedDate = new Date('2026-01-16T12:00:00Z');
            expect(result.nextReviewDate.toISOString()).toBe(expectedDate.toISOString());
        });
    });

    describe('HARD rating', () => {
        it('increases interval by 1.2x (rounded up)', () => {
            const result = calculateNextReview('HARD', baseState, fixedNow);
            // 3 * 1.2 = 3.6, ceil = 4
            expect(result.interval).toBe(4);
        });

        it('keeps easeFactor unchanged', () => {
            const result = calculateNextReview('HARD', baseState, fixedNow);
            expect(result.easeFactor).toBe(2.5);
        });

        it('increments streak', () => {
            const result = calculateNextReview('HARD', baseState, fixedNow);
            expect(result.streak).toBe(3);
        });

        it('sets nextReviewDate to interval days from now', () => {
            const result = calculateNextReview('HARD', baseState, fixedNow);
            const expectedDate = new Date('2026-01-19T12:00:00Z'); // +4 days
            expect(result.nextReviewDate.toISOString()).toBe(expectedDate.toISOString());
        });
    });

    describe('EASY rating', () => {
        it('increases interval by easeFactor * 1.3 (rounded up)', () => {
            const result = calculateNextReview('EASY', baseState, fixedNow);
            // 3 * 2.5 * 1.3 = 9.75, ceil = 10
            expect(result.interval).toBe(10);
        });

        it('increases easeFactor by 0.15', () => {
            const result = calculateNextReview('EASY', baseState, fixedNow);
            expect(result.easeFactor).toBe(2.65);
        });

        it('increments streak', () => {
            const result = calculateNextReview('EASY', baseState, fixedNow);
            expect(result.streak).toBe(3);
        });

        it('sets nextReviewDate to interval days from now', () => {
            const result = calculateNextReview('EASY', baseState, fixedNow);
            const expectedDate = new Date('2026-01-25T12:00:00Z'); // +10 days
            expect(result.nextReviewDate.toISOString()).toBe(expectedDate.toISOString());
        });
    });

    describe('Edge cases', () => {
        it('bumps interval from 0 to 1 for new cards with HARD', () => {
            const newCardState: SRSState = { interval: 0, easeFactor: 2.5, streak: 0 };
            const result = calculateNextReview('HARD', newCardState, fixedNow);
            expect(result.interval).toBe(1);
        });

        it('bumps interval from 0 to 1 for new cards with EASY', () => {
            const newCardState: SRSState = { interval: 0, easeFactor: 2.5, streak: 0 };
            const result = calculateNextReview('EASY', newCardState, fixedNow);
            expect(result.interval).toBe(1);
        });

        it('FORGOT on new card still sets interval to 1', () => {
            const newCardState: SRSState = { interval: 0, easeFactor: 2.5, streak: 0 };
            const result = calculateNextReview('FORGOT', newCardState, fixedNow);
            expect(result.interval).toBe(1);
        });
    });

    describe('Gaming Prevention (Throttling)', () => {
        // baseState: interval: 3, easeFactor: 2.5, streak: 2
        // fixedNow: 2026-01-15T12:00:00Z

        it('ignores reviews if last review was on the SAME day', () => {
            // 4 hours ago on the same day (15th)
            const lastReviewed = new Date('2026-01-15T08:00:00Z');
            const result = calculateNextReview('EASY', baseState, fixedNow, lastReviewed);

            // Should NOT change state
            expect(result.interval).toBe(3);
            expect(result.easeFactor).toBe(2.5);
            expect(result.streak).toBe(2);

            // Should set next review relative to existing interval (15th + 3 days = 18th)
            // Note: Since we use 'now' + interval in the fix, if now is 15th and interval is 3, it should be 18th.
            const expectedDate = new Date('2026-01-18T12:00:00Z');
            expect(result.nextReviewDate.toISOString()).toBe(expectedDate.toISOString());
        });

        it('processes review normally if last review was on a DIFFERENT day', () => {
            // Yesterday (14th)
            const lastReviewed = new Date('2026-01-14T23:59:59Z');
            const result = calculateNextReview('EASY', baseState, fixedNow, lastReviewed);

            // standard EASY update: interval 10, ease 2.65, streak 3
            expect(result.interval).toBe(10);
            expect(result.easeFactor).toBe(2.65);
            expect(result.streak).toBe(3);
        });

        it('always processes FORGOT even if same day (honesty override)', () => {
            // Same day
            const lastReviewed = new Date('2026-01-15T10:00:00Z');
            const result = calculateNextReview('FORGOT', baseState, fixedNow, lastReviewed);

            // Should process the FORGOT
            expect(result.interval).toBe(1);
            expect(result.streak).toBe(0);
        });
    });
});

describe('calculateSystemizerScore', () => {
    const fixedNow = new Date('2026-01-15T12:00:00Z');

    it('returns 0 for non-overdue, stable, non-new question', () => {
        const question: QuestionForScoring = {
            nextReviewDate: new Date('2026-01-20T12:00:00Z'), // Future
            interval: 5,
            type: 'MULTI_CHOICE',
            lastReviewed: new Date('2026-01-10T12:00:00Z'),
        };
        const score = calculateSystemizerScore(question, fixedNow);
        expect(score).toBe(0);
    });

    describe('Overdue Penalty', () => {
        it('adds 1 point per day overdue', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-12T12:00:00Z'), // 3 days ago
                interval: 5,
                type: 'MULTI_CHOICE',
                lastReviewed: new Date('2026-01-07T12:00:00Z'),
            };
            const score = calculateSystemizerScore(question, fixedNow);
            expect(score).toBe(3); // 3 days overdue
        });

        it('does not add penalty for future due date', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-20T12:00:00Z'),
                interval: 5,
                type: 'MULTI_CHOICE',
                lastReviewed: new Date('2026-01-10T12:00:00Z'),
            };
            const score = calculateSystemizerScore(question, fixedNow);
            expect(score).toBe(0);
        });
    });

    describe('Danger Zone Bonus', () => {
        it('adds 50 points for interval < 3', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-20T12:00:00Z'),
                interval: 2,
                type: 'MULTI_CHOICE',
                lastReviewed: new Date('2026-01-14T12:00:00Z'),
            };
            const score = calculateSystemizerScore(question, fixedNow);
            expect(score).toBe(50);
        });

        it('does not add bonus for interval >= 3', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-20T12:00:00Z'),
                interval: 3,
                type: 'MULTI_CHOICE',
                lastReviewed: new Date('2026-01-12T12:00:00Z'),
            };
            const score = calculateSystemizerScore(question, fixedNow);
            expect(score).toBe(0);
        });
    });

    describe('Code Question Bonus', () => {
        it('adds 20 points for SNIPPET type', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-20T12:00:00Z'),
                interval: 5,
                type: 'SNIPPET',
                lastReviewed: new Date('2026-01-10T12:00:00Z'),
            };
            const score = calculateSystemizerScore(question, fixedNow);
            expect(score).toBe(20);
        });

        it('does not add bonus for other types', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-20T12:00:00Z'),
                interval: 5,
                type: 'OPEN',
                lastReviewed: new Date('2026-01-10T12:00:00Z'),
            };
            const score = calculateSystemizerScore(question, fixedNow);
            expect(score).toBe(0);
        });
    });

    describe('New Item Bonus', () => {
        it('adds 10 points for interval = 0', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-15T12:00:00Z'),
                interval: 0,
                type: 'MULTI_CHOICE',
                lastReviewed: null,
            };
            const score = calculateSystemizerScore(question, fixedNow);
            // New item (interval 0) = 10, danger zone (interval < 3) = 50
            expect(score).toBe(60);
        });

        it('adds 10 points for null lastReviewed', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-20T12:00:00Z'),
                interval: 5,
                type: 'MULTI_CHOICE',
                lastReviewed: null,
            };
            const score = calculateSystemizerScore(question, fixedNow);
            expect(score).toBe(10);
        });
    });

    describe('Combined scoring', () => {
        it('combines all bonuses correctly', () => {
            const question: QuestionForScoring = {
                nextReviewDate: new Date('2026-01-10T12:00:00Z'), // 5 days overdue
                interval: 1, // Danger zone
                type: 'SNIPPET', // Code bonus
                lastReviewed: null, // New item
            };
            const score = calculateSystemizerScore(question, fixedNow);
            // 5 (overdue) + 50 (danger) + 20 (code) + 10 (new) = 85
            expect(score).toBe(85);
        });
    });
});
