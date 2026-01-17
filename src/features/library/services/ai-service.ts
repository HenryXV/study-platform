import { generateText, Output } from 'ai';
import { z } from 'zod';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { ResultSchema, Question } from '@/features/library/schemas/question-generator';
import { ratelimit } from '@/lib/ratelimit';

/**
 * Service to handle AI generation tasks.
 */

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

    // 2. Call AI SDK
    const { output } = await generateText({
        model: 'gemini-2.0-flash-lite',
        output: Output.object({
            schema: z.object({
                suggestedSubject: z.string().describe("The single best broad category (e.g. 'Computer Science', 'History')"),
                suggestedTopics: z.array(z.string()).describe("Specific topics or tags (e.g. 'React', 'Hooks')"),
                units: z.array(z.object({
                    title: z.string().describe("The concept title"),
                    type: z.enum(['TEXT', 'CODE']).describe("CODE if it involves programming syntax, TEXT for theory"),
                }))
            }),
        }),
        prompt: `
    You are a strict teacher. Analyze the following text. 
    Determine the single best Subject Category and a list of specific Topics.
    Then, split it into atomic study concepts (flashcards).
    
    Rules:
    - If you see code examples, create a CODE unit.
    - If you see theory/definitions, create a TEXT unit.
    - EXTREMELY IMPORTANT: Do NOT generate questions, answers, or content. Only titles and types.
    
    Text:
    ${source.bodyText}
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

    const subjectName = unit.source.subject?.name || "General Knowledge";
    const topicNames = unit.source.topics.map(t => t.name).join(", ");

    const { output } = await generateText({
        model: 'gemini-2.0-flash-lite',
        output: Output.object({ schema: ResultSchema }),
        prompt: `
    You are a ruthless examiner. Generate 3 distinct questions for this concept.
    
    Context:
    - Domain: ${subjectName}
    - Topics: ${topicNames}
    - Concept: "${unit.content}"
    - Type: ${unit.type}
    
    Instructions:
    1. 1 Multiple Choice (with tricky distractors)
    2. 1 Open Ended (Short Answer)
    3. 1 Code Scenario (if the content involves code) or another Application question.
    
    Use the Domain and Topics context to ensure the questions are relevant and use correct terminology.
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
