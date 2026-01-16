
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuestions } from '@/features/study-session/actions/get-questions';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        question: {
            findMany: vi.fn(),
        },
    },
}));

describe('getQuestions - Cram Mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch questions for specific subject sorted by due date in cram mode', async () => {
        const mockQuestions = [
            {
                id: 'q1',
                type: 'TEXT',
                data: { question: 'Q1', answer: 'A1' },
                unitId: 'u1',
                subjectId: 'sub1',
                nextReviewDate: new Date('2023-01-01'), // Overdue
                subject: { name: 'Math', color: 'red' },
                topics: [{ name: 'Algebra' }],
            },
            {
                id: 'q2',
                type: 'TEXT',
                data: { question: 'Q2', answer: 'A2' },
                unitId: 'u1',
                subjectId: 'sub1',
                nextReviewDate: new Date('2025-01-01'), // Future
                subject: { name: 'Math', color: 'red' },
                topics: [{ name: 'Algebra' }],
            },
        ];

        (prisma.question.findMany as any).mockResolvedValue(mockQuestions);

        const result = await getQuestions(10, {
            mode: 'cram',
            subjectIds: ['sub1'],
        });

        // Verify Prisma Call
        expect(prisma.question.findMany).toHaveBeenCalledWith({
            where: {
                subjectId: { in: ['sub1'] },
            },
            take: 30, // limit * 3
            orderBy: { nextReviewDate: 'asc' },
            include: {
                subject: { select: { name: true, color: true } },
                topics: { select: { name: true } },
            },
        });

        // Verify Result
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('q1');
        expect(result[1].id).toBe('q2');
        expect(result[0].isReviewAhead).toBe(false);
    });

    it('should ignore other subjects in cram mode', async () => {
        (prisma.question.findMany as any).mockResolvedValue([]);

        await getQuestions(10, {
            mode: 'cram',
            subjectIds: ['sub1'],
        });

        expect(prisma.question.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    subjectId: { in: ['sub1'] },
                }),
            })
        );
    });
});
