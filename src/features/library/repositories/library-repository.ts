import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * Creates a ContentSource and its associated ContentChunks in a single transaction.
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

    // B. Insert Chunks with Vectors
    for (const chunk of chunks) {
      const id = crypto.randomUUID();
      const vectorString = `[${chunk.embedding.join(",")}]`;

      await tx.$executeRaw`
          INSERT INTO "ContentChunk" ("id", "content", "pageNumber", "embedding", "sourceId")
          VALUES (${id}, ${chunk.content}, ${chunk.pageNumber}, ${vectorString}::vector, ${source.id})
        `;
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
  similarityThreshold: number = 0.9,
  sourceId: string
) {
  const vectorString = `[${embedding.join(",")}]`;

  return await prisma.$queryRaw<
    Array<{ id: string; content: string; pageNumber: number; similarity: number }>
  >`
        SELECT 
          id, 
          content, 
          "pageNumber", 
          1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM "ContentChunk"
        WHERE 1 - (embedding <=> ${vectorString}::vector) > ${similarityThreshold}
        AND "sourceId" = ${sourceId}
        ORDER BY similarity DESC
        LIMIT ${limit};
      `;

}

/**
 * Adds chunks to an existing Source.
 */
export async function addChunksToSource(
  sourceId: string,
  chunks: { content: string; pageNumber: number; embedding: number[] }[]
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // A. Insert Chunks with Vectors
    for (const chunk of chunks) {
      const id = crypto.randomUUID();
      const vectorString = `[${chunk.embedding.join(",")}]`;

      await tx.$executeRaw`
          INSERT INTO "ContentChunk" ("id", "content", "pageNumber", "embedding", "sourceId")
          VALUES (${id}, ${chunk.content}, ${chunk.pageNumber}, ${vectorString}::vector, ${sourceId})
        `;
    }

    // B. Update Source Status
    await tx.contentSource.update({
      where: { id: sourceId },
      data: { status: "PROCESSED" },
    });
  });
}
