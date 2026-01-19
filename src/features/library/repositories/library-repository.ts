import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * Creates a ContentSource and its associated ContentChunks in a single transaction.
 * Uses batch SQL insert for optimal performance.
 */
export async function createSourceWithChunks(
  userId: string,
  title: string,
  bodyText: string,
  chunks: { content: string; pageNumber: number; embedding: number[] }[]
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // A. Create ContentSource
    const source = await tx.contentSource.create({
      data: {
        title,
        bodyText,
        status: "PROCESSED",
        userId,
      },
    });

    // B. Insert Chunks with Vectors - batch insert for performance
    if (chunks.length > 0) {
      const values = chunks.map(chunk => {
        const id = crypto.randomUUID();
        const vectorString = `[${chunk.embedding.join(",")}]`;
        return `('${id}', '${chunk.content.replace(/'/g, "''")}', ${chunk.pageNumber}, '${vectorString}'::vector, '${source.id}')`;
      }).join(',');

      await tx.$executeRawUnsafe(`
        INSERT INTO "ContentChunk" ("id", "content", "pageNumber", "embedding", "sourceId")
        VALUES ${values}
      `);
    }

    return source;
  });
}

/**
 * Finds chunks similar to the given embedding using pgvector.
 */
export async function findSimilarChunks(
  embedding: number[],
  limit: number = 5,
  vectorWeight: number = 0.7,
  keywordWeight: number = 0.3,
  queryText: string,
  sourceId: string
) {
  // 1. Format text for Postgres Full Text Search (Replaces spaces with & for AND logic)
  const vectorString = `[${embedding.join(",")}]`;

  const cleanText = queryText.trim();

  // 2. The Hybrid Query
  // We normalize both scores to a 0-1 scale and sum them (Simple Fusion
  return await prisma.$queryRaw<Array<{ id: string; content: string; pageNumber: number; score: number }>>`
    WITH vector_results AS (
      SELECT id, 1 - (embedding <=> ${vectorString}::vector) as semantic_score
      FROM "ContentChunk"
      WHERE "sourceId" = ${sourceId}
      ORDER BY semantic_score DESC
      LIMIT ${limit} * 2 -- Fetch extra for re-ranking
    ),
    keyword_results AS (
      SELECT id, ts_rank_cd(to_tsvector('portuguese', content), websearch_to_tsquery('portuguese', ${cleanText})) as keyword_score
      FROM "ContentChunk"
      WHERE "sourceId" = ${sourceId}
      AND to_tsvector('portuguese', content) @@ websearch_to_tsquery('portuguese', ${cleanText})
      ORDER BY keyword_score DESC
      LIMIT ${limit} * 2
    )
    SELECT 
      COALESCE(v.id, k.id) as id,
      c.content,
      c."pageNumber",
      (COALESCE(v.semantic_score, 0) * ${vectorWeight}) + (COALESCE(k.keyword_score, 0) * ${keywordWeight}) as total_score
    FROM vector_results v
    FULL OUTER JOIN keyword_results k ON v.id = k.id
    JOIN "ContentChunk" c ON c.id = COALESCE(v.id, k.id)
    ORDER BY total_score DESC
    LIMIT ${limit};
  `;

}

/**
 * Adds chunks to an existing Source.
 * Uses batch SQL insert for optimal performance.
 */
export async function addChunksToSource(
  sourceId: string,
  chunks: { content: string; pageNumber: number; embedding: number[] }[]
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // A. Insert Chunks with Vectors - batch insert for performance
    if (chunks.length > 0) {
      const values = chunks.map(chunk => {
        const id = crypto.randomUUID();
        const vectorString = `[${chunk.embedding.join(",")}]`;
        return `('${id}', '${chunk.content.replace(/'/g, "''")}', ${chunk.pageNumber}, '${vectorString}'::vector, '${sourceId}')`;
      }).join(',');

      await tx.$executeRawUnsafe(`
        INSERT INTO "ContentChunk" ("id", "content", "pageNumber", "embedding", "sourceId")
        VALUES ${values}
      `);
    }

    // B. Update Source Status
    await tx.contentSource.update({
      where: { id: sourceId },
      data: { status: "PROCESSED" },
    });
  });
}
