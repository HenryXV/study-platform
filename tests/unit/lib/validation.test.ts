import { describe, it, expect } from 'vitest';
import {
    ContentInputSchema,
    StudyModeSchema,
    LimitSchema,
    QuestionFiltersSchema,
    CuidSchema,
} from '@/lib/validation';

describe('ContentInputSchema', () => {
    it('accepts valid content', () => {
        const result = ContentInputSchema.safeParse({ text: 'Valid content here' });
        expect(result.success).toBe(true);
    });

    it('rejects empty content', () => {
        const result = ContentInputSchema.safeParse({ text: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Content cannot be empty');
        }
    });

    it('rejects content exceeding max length', () => {
        const longContent = 'a'.repeat(50001);
        const result = ContentInputSchema.safeParse({ text: longContent });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Content too long');
        }
    });
});

describe('StudyModeSchema', () => {
    it('accepts valid study modes', () => {
        expect(StudyModeSchema.safeParse('crisis').success).toBe(true);
        expect(StudyModeSchema.safeParse('deep').success).toBe(true);
        expect(StudyModeSchema.safeParse('maintenance').success).toBe(true);
        expect(StudyModeSchema.safeParse('custom').success).toBe(true);
    });

    it('rejects invalid study mode', () => {
        const result = StudyModeSchema.safeParse('invalid');
        expect(result.success).toBe(false);
    });
});

describe('LimitSchema', () => {
    it('accepts valid limits', () => {
        expect(LimitSchema.safeParse(1).success).toBe(true);
        expect(LimitSchema.safeParse(50).success).toBe(true);
        expect(LimitSchema.safeParse(100).success).toBe(true);
    });

    it('rejects limits outside bounds', () => {
        expect(LimitSchema.safeParse(0).success).toBe(false);
        expect(LimitSchema.safeParse(101).success).toBe(false);
    });

    it('rejects non-integer limits', () => {
        expect(LimitSchema.safeParse(1.5).success).toBe(false);
    });
});

describe('QuestionFiltersSchema', () => {
    it('accepts empty object', () => {
        const result = QuestionFiltersSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('accepts valid filters', () => {
        const result = QuestionFiltersSchema.safeParse({
            subjectIds: ['abc123', 'def456'],
            topicIds: ['topic1'],
            mode: 'crisis',
        });
        expect(result.success).toBe(true);
    });

    it('accepts partial filters', () => {
        const result = QuestionFiltersSchema.safeParse({
            mode: 'deep',
        });
        expect(result.success).toBe(true);
    });
});
