import { embed } from "ai";
import { findSimilarChunks } from "@/features/library/repositories/library-repository";
import { AI_MODELS } from "../config/ai-models";

/**
 * Finds content chunks related to the user's query using semantic vector search.
 */
export async function findRelatedChunks(query: string, limit: number = 5, sourceId: string) {
    if (!query.trim()) {
        return [];
    }

    // 1. Generate embedding for the query
    const { embedding } = await embed({
        model: AI_MODELS.EMBEDDING,
        value: query,
    });

    // 2. Perform vector search
    const chunks = await findSimilarChunks(embedding, limit, 0.7, 0.3, query, sourceId);

    return chunks;
}
