import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeContent, generateQuestions } from '@/features/library/services/ai-service';
import { generateText } from 'ai';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { ratelimit } from '@/lib/ratelimit';

// Mock AI SDK
vi.mock('ai', () => ({
    generateText: vi.fn(),
    Output: {
        object: (schema: any) => schema,
    }
}));

// Mock Dependencies
vi.mock('@/features/library/repositories/content.repository', () => ({
    ContentRepository: {
        findSourceById: vi.fn(),
        findUnitWithContext: vi.fn(),
    },
}));

vi.mock('@/lib/ratelimit', () => ({
    ratelimit: {
        limit: vi.fn(),
    },
}));

describe('AI Service', () => {
    const userId = 'user-123';
    const sourceId = 'source-123';
    const unitId = 'unit-123';

    beforeEach(() => {
        vi.resetAllMocks();
        // Default Rate Limit Success
        vi.mocked(ratelimit.limit).mockResolvedValue({ success: true } as any);
    });

    describe('analyzeContent', () => {
        it('should generate units from source text', async () => {
            // Arrange
            const mockSource = { bodyText: 'Some content' };
            vi.mocked(ContentRepository.findSourceById).mockResolvedValue(mockSource as any);

            const mockOutput = {
                units: [{ title: 'Unit 1', type: 'TEXT' }]
            };
            vi.mocked(generateText).mockResolvedValue({ output: mockOutput } as any);

            // Act
            const result = await analyzeContent(userId, sourceId);

            // Assert
            expect(result).toEqual(mockOutput);
            expect(generateText).toHaveBeenCalled();
            expect(ratelimit.limit).toHaveBeenCalledWith(userId);
        });

        it('should throw error on rate limit exceeded', async () => {
            vi.mocked(ratelimit.limit).mockResolvedValue({ success: false } as any);

            await expect(analyzeContent(userId, sourceId)).rejects.toThrow("Rate limit exceeded");
            expect(generateText).not.toHaveBeenCalled();
        });

        it('should throw error if source empty', async () => {
            vi.mocked(ContentRepository.findSourceById).mockResolvedValue({ bodyText: '' } as any);

            await expect(analyzeContent(userId, sourceId)).rejects.toThrow("Source not found or empty");
        });
    });

    describe('generateQuestions', () => {
        it('should generate questions for a unit', async () => {
            // Arrange
            const mockUnit = {
                id: unitId,
                content: 'Concept',
                type: 'TEXT',
                source: {
                    userId, // Authorized
                    subject: { name: 'Science' },
                    topics: [{ name: 'Physics' }]
                }
            };
            vi.mocked(ContentRepository.findUnitWithContext).mockResolvedValue(mockUnit as any);

            const mockOutput = {
                questions: [{ question: 'Q1' }]
            };
            vi.mocked(generateText).mockResolvedValue({ output: mockOutput } as any);

            // Act
            const result = await generateQuestions(userId, unitId, 'Concept', 'TEXT');

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].question).toBe('Q1');
            // Topics fallback check
            expect(result[0].topics).toEqual(['Physics']);
        });

        it('should throw Unauthorized if user does not own source', async () => {
            const mockUnit = {
                id: unitId,
                source: { userId: 'other-user' }
            };
            vi.mocked(ContentRepository.findUnitWithContext).mockResolvedValue(mockUnit as any);

            await expect(generateQuestions(userId, unitId, 'C', 'TEXT')).rejects.toThrow("Unauthorized");
        });
    });
});
