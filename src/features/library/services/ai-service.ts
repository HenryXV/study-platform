import { generateText, Output } from 'ai';
import { z } from 'zod';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { ResultSchema, Question } from '@/features/library/schemas/question-generator';
import { ratelimit } from '@/lib/ratelimit';
import { findRelatedChunks } from '@/features/library/services/retrieval-service';

/**
 * Service to handle AI generation tasks.
 */

/**
 * Heuristic to remove Table of Contents lines.
 * Detects patterns like: "Title ............ 12" or "Title       12"
 */
function cleanTableOfContents(text: string): string {
    return text
        .split('\n')
        .filter(line => {
            // Reject lines ending in multiple dots and a number (Standard PDF ToC)
            // e.g. "Capítulo 1 ................... 5"
            if (/\.{3,}\s*\d+$/.test(line)) return false;

            // Reject lines that are just labeled "Sumário" or "Índice"
            if (/^(sumário|índice|table of contents)$/i.test(line.trim())) return false;

            // Reject lines that are mostly dots
            if ((line.match(/\./g) || []).length > 10) return false;

            return true;
        })
        .join('\n');
}

export async function analyzeContent(userId: string, sourceId: string) {
    const { success } = await ratelimit.limit(userId);
    if (!success) {
        throw new Error("Rate limit exceeded. Try again later.");
    }

    // 1. Fetch the raw content via Repository
    const source = await ContentRepository.findSourceById(sourceId, userId);

    if (!source || !source.bodyText) {
        throw new Error('Source not found or empty');
    }

    const cleanText = cleanTableOfContents(source.bodyText);

    // 2. Call AI SDK
    const { output } = await generateText({
        model: 'gemini-2.5-flash-lite',
        output: Output.object({
            schema: z.object({
                suggestedSubject: z.string().describe("The single overarching subject (e.g. 'Constitutional Law', 'React Architecture')"),
                suggestedTopics: z.array(z.string()).describe("5-10 high-level tags"),
                units: z.array(z.object({
                    title: z.string().describe("The Study Session Title (e.g. 'Fundamental Rights', 'Server Components')"),
                    description: z.string().describe("A 20-word summary of the specific topics and rules covered in this unit. Used for vector search context."),
                    type: z.enum(['TEXT', 'CODE']),
                    // Optional: You can add 'pageStart' or 'citation' if you want to be fancy later
                }))
            }),
        }),
        prompt: `
            You are a Strategic Learning Architect.
            Your goal is to convert this raw document into a **Structured Study Plan** consisting of 4-12 "Study Sessions" (Units).

            CRITICAL INSTRUCTION: AVOID "INDEX SYNDROME"
            - The beginning of documents often contains Tables of Contents, Indices, or short Definitions. **Do not create separate units for these.**
            - instead, **CLUSTER** these small pieces into larger thematic groups.
            
            STRATEGY: "SEMANTIC CLUSTERING"
            1. **Scan the whole text** to understand the "Major Arcs".
            2. **Group by Theme:**
            - **Law:** Don't list "Art 1", "Art 2". Group them into "Principles of State (Arts 1-4)".
            - **Code:** Don't list "Button.tsx", "Input.tsx". Group them into "UI Component Library".
            - **History:** Don't list "1914", "1915". Group them into "The Early War Years (1914-1916)".
            3. **Ignore Metadata:** Ignore preambles, copyright notices, or table of contents pages unless they contain study material.

            OUTPUT RULES:
            - **Title:** Descriptive and Professional. (If Law, include the Article Range: "Topic (Arts. X-Y)").
            - **Description (CRITICAL):** Write a dense, keyword-rich summary of what this unit covers. 
              *Bad:* "This unit talks about Article 5."
              *Good:* "Covers individual rights, habeas corpus, property rights, and the inviolability of the home."
            - **Granularity:** Each unit should represent roughly 15-30 minutes of study.
            - **Quantity:** Aim for 5 to 20 units total. If the text is huge, broad strokes are better than 100 tiny units.

            TEXT TO ANALYZE:
            ${cleanText}
        `,
    });

    if (!output?.units) {
        throw new Error('AI failed to generate valid units');
    }

    return output;
}

export async function generateQuestions(
    userId: string,
    unitId: string,
    unitContent: string,
    unitType: 'TEXT' | 'CODE'
): Promise<Question[]> {
    const { success } = await ratelimit.limit(userId);
    if (!success) {
        throw new Error("Rate limit exceeded. Try again later.");
    }

    // Fetch Unit Context from Repository
    const unit = await ContentRepository.findUnitWithContext(unitId);

    if (!unit) {
        throw new Error("Unit not found");
    }

    // Since findUnitWithContext doesn't check owner (Repo layer constraint), we could check it here if needed.
    // However, generateQuestions usually follows authorized usage. 
    // To be strict, we really should assume the caller has rights or check unit.source.userId.
    if (unit.source.userId !== userId) {
        throw new Error("Unauthorized");
    }

    const searchQuery = `${unit.content}: ${unit.description || ''}`;

    const relatedChunks = await findRelatedChunks(searchQuery, 10, unit.sourceId);

    // Format the context for the Prompt
    const evidenceBlock = relatedChunks.map((chunk, i) => `
    [CITATION REF: ${chunk.pageNumber}]
    "${chunk.content}"
    `).join('\n\n');

    const subjectName = unit.source.subject?.name || "General Knowledge";
    const topicNames = unit.source.topics.map(t => t.name).join(", ");

    const { output } = await generateText({
        model: 'gemini-2.0-flash',
        output: Output.object({ schema: ResultSchema }),
        prompt: `
            You are a ruthless examiner for a "Concurso Público" (Public Exam).
            Generate 3 distinct questions for the concept: "${unit.content}".

            SOURCE MATERIAL (The Truth):
            Use ONLY the following text to verify your questions.
            ${evidenceBlock}

            CRITICAL INSTRUCTION - CITATIONS:
            - **Primary:** If the text mentions a Law/Article (e.g., "Art. 5º", "Inciso II"), cite THAT. It is more valuable than the page number.
              Example: (Ref: Art. 6º, Caput)
            - **Secondary:** If no specific Article is mentioned, use the Page Number provided in [SOURCE_REF].
              Example: (Ref: Page 12)

            CRITICAL INSTRUCTION - VARIETY:
            - Do NOT focus on a single Article (e.g., do not make 3 questions about Art. 6).
            - Scan the provided chunks for *different* rules or sub-topics and spread your questions out.

            Instructions:
            1. **Strict Adherence:** If the text mentions a specific law, rule, or exception, your question MUST test that detail.
            2. **Citations:** In the 'explanation' field, you MUST explicitly cite the page number using the format: (Ref: Page X).
            3. **Distractors:** For Multiple Choice, create 'pegadinhas' (tricky wrong answers) that sound plausible but are contradicted by the text.

            Question Types:
            1. 1 Multiple Choice (with tricky distractors)
            2. 1 Open Ended (Short Answer)
            3. 1 Application/Scenario
        `,
    });

    if (!output?.questions) {
        throw new Error("Failed to generate structure");
    }

    // Return questions with default topics mapped to their names if not generated
    const questionsWithTopics = output.questions.map(q => ({
        ...q,
        topics: q.topics && q.topics.length > 0 ? q.topics : unit.source.topics.map(t => t.name)
    }));

    return questionsWithTopics;
}
