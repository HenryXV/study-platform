import { embed } from "ai";
import { findSimilarChunks } from "@/features/library/repositories/library-repository";

/**
 * Finds content chunks related to the user's query using semantic vector search.
 */
export async function findRelatedChunks(query: string, limit: number = 5, sourceId: string) {
    if (!query.trim()) {
        return [];
    }

    // 1. Generate embedding for the query
    const { embedding } = await embed({
        model: "google/text-multilingual-embedding-002",
        value: query,
    });

    // 2. Perform vector search
    const chunks = await findSimilarChunks(embedding, limit, 0.3, 0.7, query, sourceId);

    return chunks;
}
