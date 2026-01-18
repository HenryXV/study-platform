// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { findRelatedChunks } from "@/features/library/services/retrieval-service";

// Mock dependencies
vi.mock("@/features/library/repositories/library-repository", () => ({
    findSimilarChunks: vi.fn(),
}));

vi.mock("ai", () => ({
    embed: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
    google: {
        textEmbeddingModel: vi.fn(),
    },
}));

import { findSimilarChunks } from "@/features/library/repositories/library-repository";
import { embed } from "ai";

describe("Retrieval Service", () => {
    describe("findRelatedChunks", () => {
        it("should return empty array for empty query", async () => {
            const result = await findRelatedChunks("", 5, "source-123");
            expect(result).toEqual([]);
            expect(embed).not.toHaveBeenCalled();
        });

        it("should generate embedding and search for chunks", async () => {
            const query = "test query";
            const mockEmbedding = [0.1, 0.2, 0.3];
            const mockChunks = [
                { id: "1", content: "chunk 1", pageNumber: 1, similarity: 0.9 },
                { id: "2", content: "chunk 2", pageNumber: 2, similarity: 0.8 },
            ];

            (embed as any).mockResolvedValue({ embedding: mockEmbedding });
            (findSimilarChunks as any).mockResolvedValue(mockChunks);

            const result = await findRelatedChunks(query, 3, "source-123");

            expect(embed).toHaveBeenCalledWith(expect.objectContaining({
                value: query,
            }));
            expect(findSimilarChunks).toHaveBeenCalledWith(mockEmbedding, 3, 0.3, "source-123");
            expect(result).toEqual(mockChunks);
        });
    });
});
