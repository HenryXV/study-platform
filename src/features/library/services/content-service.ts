import { ContentRepository, DraftData } from '@/features/library/repositories/content.repository';
import { DomainError, NotFoundError } from '@/lib/errors';
// We import ApprovedDraftData just for type compatibility or cast it, 
// strictly we should use the type from Repository or a shared types file.
// For now, I will use the type from Repository in the function signature 
// to decouple from UI component.

export type LibraryItem = {
    id: string;
    title: string;
    status: 'UNPROCESSED' | 'PROCESSED';
    createdAt: Date;
    subject: { name: string; color: string } | null;
    topics: { name: string }[];
    _count: {
        units: number;
    };
};

/**
 * Service to handle Content Source CRUD and Draft Operations.
 */

export async function createContentSource(userId: string, text: string): Promise<void> {
    try {
        // Auto-generate title first 30 chars or fallback to timestamp
        const title = text.trim().slice(0, 30) + (text.length > 30 ? '...' : '') || `Quick Note: ${new Date().toLocaleString()}`;

        await ContentRepository.createSource(userId, title, text);
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to create content source");
    }
}

export async function fetchContentSources(userId: string, query?: string, limit?: number): Promise<LibraryItem[]> {
    try {
        // Repository returns the exact shape we need due to 'select'
        return await ContentRepository.findAllSources(userId, query, limit);
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch library content");
    }
}

export async function fetchContentSource(userId: string, sourceId: string) {
    try {
        const source = await ContentRepository.findSourceById(sourceId, userId);
        if (!source) throw new NotFoundError("Content source not found");
        return source;
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch content source");
    }
}

export async function deleteContentSource(userId: string, sourceId: string) {
    try {
        const deleted = await ContentRepository.deleteSource(userId, sourceId);

        if (deleted.count === 0) {
            throw new NotFoundError('Source not found or unauthorized');
        }
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to delete content source");
    }
}

// Accepts DraftData structure (compatible with ApprovedDraftData)
export async function commitDraftToLibrary(userId: string, sourceId: string, data: DraftData) {
    try {
        const count = await ContentRepository.executeCommitDraftTransaction(userId, sourceId, data);
        return count;
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to commit draft to library");
    }
}

export async function deleteUnit(userId: string, unitId: string) {
    try {
        const deleted = await ContentRepository.deleteUnit(userId, unitId);

        if (deleted.count === 0) {
            throw new NotFoundError('Unit not found or unauthorized');
        }
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to delete unit");
    }
}
