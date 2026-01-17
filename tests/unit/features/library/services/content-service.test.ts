import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createContentSource,
    fetchContentSources,
    fetchContentSource,
    deleteContentSource,
    deleteUnit,
    commitDraftToLibrary
} from '@/features/library/services/content-service';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { DomainError, NotFoundError } from '@/lib/errors';

// Mock Repository
vi.mock('@/features/library/repositories/content.repository', () => ({
    ContentRepository: {
        createSource: vi.fn(),
        findAllSources: vi.fn(),
        findSourceById: vi.fn(),
        deleteSource: vi.fn(),
        deleteUnit: vi.fn(),
        executeCommitDraftTransaction: vi.fn(),
    },
}));

describe('Content Service', () => {
    const userId = 'user-123';
    const sourceId = 'source-123';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('createContentSource', () => {
        it('should create valid source with auto-generated title', async () => {
            const text = "This is a sample text for testing source creation.";

            await createContentSource(userId, text);

            expect(ContentRepository.createSource).toHaveBeenCalledWith(
                userId,
                expect.stringContaining("This is a sample text for"), // Title check
                text
            );
        });

        it('should handle large text with truncation', async () => {
            const text = "A".repeat(100);

            await createContentSource(userId, text);

            expect(ContentRepository.createSource).toHaveBeenCalledWith(
                userId,
                expect.stringContaining("..."), // Ellipsis check
                text
            );
        });

        it('should rethrow DomainError', async () => {
            vi.mocked(ContentRepository.createSource).mockRejectedValue(new DomainError("Fail"));
            await expect(createContentSource(userId, "test")).rejects.toThrow(DomainError);
        });
    });

    describe('fetchContentSources', () => {
        it('should return sources from repository', async () => {
            const mockSources = [{ id: 's1', title: 'Source 1' }];
            vi.mocked(ContentRepository.findAllSources).mockResolvedValue(mockSources as any);

            const result = await fetchContentSources(userId);

            expect(result).toEqual(mockSources);
            expect(ContentRepository.findAllSources).toHaveBeenCalledWith(userId, undefined, undefined);
        });
    });

    describe('fetchContentSource', () => {
        it('should return source if found', async () => {
            const mockSource = { id: sourceId, title: 'Found' };
            vi.mocked(ContentRepository.findSourceById).mockResolvedValue(mockSource as any);

            const result = await fetchContentSource(userId, sourceId);

            expect(result).toEqual(mockSource);
        });

        it('should throw NotFoundError if call returns null', async () => {
            vi.mocked(ContentRepository.findSourceById).mockResolvedValue(null);

            await expect(fetchContentSource(userId, sourceId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteContentSource', () => {
        it('should delete source successfully', async () => {
            vi.mocked(ContentRepository.deleteSource).mockResolvedValue({ count: 1 });

            await deleteContentSource(userId, sourceId);

            expect(ContentRepository.deleteSource).toHaveBeenCalledWith(userId, sourceId);
        });

        it('should throw NotFoundError if nothing deleted', async () => {
            vi.mocked(ContentRepository.deleteSource).mockResolvedValue({ count: 0 });

            await expect(deleteContentSource(userId, sourceId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteUnit', () => {
        const unitId = 'unit-123';

        it('should delete unit successfully', async () => {
            vi.mocked(ContentRepository.deleteUnit).mockResolvedValue({ count: 1 });

            await deleteUnit(userId, unitId);

            expect(ContentRepository.deleteUnit).toHaveBeenCalledWith(userId, unitId);
        });

        it('should throw NotFoundError if nothing deleted', async () => {
            vi.mocked(ContentRepository.deleteUnit).mockResolvedValue({ count: 0 });

            await expect(deleteUnit(userId, unitId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('commitDraftToLibrary', () => {
        it('should commit draft via transaction', async () => {
            const mockData = {
                suggestedSubject: 'Math',
                suggestedTopics: ['Algebra'],
                units: []
            };
            vi.mocked(ContentRepository.executeCommitDraftTransaction).mockResolvedValue(1); // 1 unit

            const count = await commitDraftToLibrary(userId, sourceId, mockData as any);

            expect(ContentRepository.executeCommitDraftTransaction).toHaveBeenCalledWith(userId, sourceId, mockData);
            expect(count).toBe(1);
        });
    });
});
