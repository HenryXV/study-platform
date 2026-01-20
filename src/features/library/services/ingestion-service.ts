import { ContentRepository } from '@/features/library/repositories/content.repository';
import { put } from '@vercel/blob';
import { embedMany } from "ai";
// @ts-ignore
import pdf from 'pdf-parse-fork';
import { addChunksToSource } from "@/features/library/repositories/library-repository";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Custom renderer to ensure we get a "Form Feed" (\f) delimiter between pages.
 * Without this, pdf-parse joins everything with \n and we lose page numbers.
 */
function render_page(pageData: any) {
    // Standard PDF text extraction logic
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    }

    return pageData.getTextContent(render_options)
        .then(function (textContent: any) {
            let lastY, text = '';
            for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY) {
                    text += item.str;
                }
                else {
                    text += '\n' + item.str;
                }
                lastY = item.transform[5];
            }
            // CRITICAL: Append Form Feed (\f) to mark end of page
            return text + '\f';
        });
}

/**
 * Helper to parse PDF buffer and extract text.
 */
export async function parsePdf(buffer: Buffer): Promise<{ text: string; numpages: number }> {
    const options = {
        pagerender: render_page
    }

    const data = await pdf(buffer, options);
    return {
        text: data.text,
        numpages: data.numpages,
    };
}

interface Chunk {
    content: string;
    pageNumber: number;
}

/**
 * High-Fidelity Chunker using LangChain
 * Strategy: Split by Page (\f) first -> Then Smart Split each page.
 */
export async function chunkText(text: string): Promise<Chunk[]> {
    const optimizedChunks: Chunk[] = [];

    // 1. Configure the Smart Splitter
    // - chunkSize: 1000 chars (approx 200-300 tokens) - Good for precision RAG
    // - chunkOverlap: 200 chars - Ensures context isn't lost at the cut
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", " ", ""], // Try paragraphs, then lines, then words
    });

    // 2. Split the raw PDF text into Pages using the Form Feed marker (\f)
    // pdf-parse injects \f between pages.
    const rawPages = text.split(/\f/);

    // 3. Process each page individually to preserve citation metadata
    for (let i = 0; i < rawPages.length; i++) {
        const pageContent = rawPages[i];
        const pageNumber = i + 1; // Pages are 1-indexed

        if (!pageContent.trim()) continue;

        // Use LangChain to split THIS page into semantic chunks
        const splitTexts = await splitter.splitText(pageContent);

        // Map the results back to our schema
        for (const chunkText of splitTexts) {
            const isTocChunk = (content: string) => {
                // If > 30% of lines look like "...... 5", it's a ToC chunk
                const lines = content.split('\n');
                const tocLines = lines.filter(l => /\.{3,}\s*\d+$/.test(l));
                return tocLines.length > (lines.length * 0.3);
            }

            if (isTocChunk(chunkText)) {
                continue; // Skip indexing this chunk entirely!
            }

            optimizedChunks.push({
                content: chunkText,
                pageNumber: pageNumber
            });
        }
    }

    return optimizedChunks;
}

/**
 * Helper to run promises with a concurrency limit.
 */
async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    const iterator = items.entries();

    const workers = new Array(Math.min(concurrency, items.length))
        .fill(iterator)
        .map(async (iter) => {
            for (const [index, item] of iter) {
                results[index] = await fn(item);
            }
        });

    await Promise.all(workers);
    return results;
}

/**
 * Helper to generate embeddings in parallel batches with concurrency limit.
 */
async function generateEmbeddingsBatched(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 100;
    const CONCURRENCY_LIMIT = 10;
    const batches: string[][] = [];

    // Prepare batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        batches.push(texts.slice(i, i + BATCH_SIZE));
    }

    // Process batches with concurrency limit
    const batchResults = await mapWithConcurrency(
        batches,
        CONCURRENCY_LIMIT,
        async (batch) => {
            const { embeddings } = await embedMany({
                model: "voyage/voyage-3.5",
                values: batch,
            });
            return embeddings;
        }
    );

    const allEmbeddings = batchResults.flat();

    if (allEmbeddings.length !== texts.length) {
        throw new Error(`Integrity check failed: Expected ${texts.length} embeddings, got ${allEmbeddings.length}`);
    }

    return allEmbeddings;
}



export async function saveRawSource(
    userId: string,
    file: File,
    title: string
) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse PDF to extract text (for RAG/embeddings)
    const { text } = await parsePdf(buffer);

    // 2. Upload PDF to Vercel Blob
    const blob = await put(`sources/${userId}/${Date.now()}-${file.name}`, file, {
        access: 'public',
        contentType: 'application/pdf',
        token: process.env.SYSTEMIZER_READ_WRITE_TOKEN,
    });

    // 3. Save to database with both text and blob URL
    return await ContentRepository.createSource(userId, title, text, blob.url);
}

export async function processSourceEmbeddings(
    userId: string,
    sourceId: string
) {
    // 1. Fetch Source
    const source = await ContentRepository.findSourceById(sourceId, userId);
    if (!source || !source.bodyText) {
        throw new Error("Source not found or empty");
    }

    // 2. Chunk Text
    const chunks = await chunkText(source.bodyText);
    if (chunks.length === 0) {
        throw new Error("No text content found to process");
    }

    // 3. Generate Embeddings (Batch)
    const embeddings = await generateEmbeddingsBatched(chunks.map(c => c.content));

    // 4. Save via Repository
    const chunksWithEmbeddings = chunks.map((chunk, i) => ({
        ...chunk,
        embedding: embeddings[i],
    }));



    return await addChunksToSource(sourceId, chunksWithEmbeddings);
}
