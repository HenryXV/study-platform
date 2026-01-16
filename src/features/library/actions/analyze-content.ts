'use server';

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { CuidSchema } from '@/lib/validation';
import { ratelimit } from '@/lib/ratelimit';
import { requireUser } from '@/lib/auth';

export async function analyzeContentPreview(sourceId: string) {
    let userId: string;
    try {
        userId = await requireUser();
    } catch {
        return { success: false, message: "Unauthorized" };
    }

    const { success } = await ratelimit.limit(userId);
    if (!success) {
        throw new Error("Rate limit exceeded. Try again later.");
    }

    const idResult = CuidSchema.safeParse(sourceId);
    if (!idResult.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    try {
        // 1. Fetch the raw content
        const source = await prisma.contentSource.findFirst({
            where: {
                id: sourceId,
                userId
            },
        });

        if (!source || !source.bodyText) {
            return { success: false, message: 'Source not found or empty' };
        }

        // 2. Call AI SDK with generateText
        // Using the same schema as process-content.ts
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

        // 3. Return Raw Data (No DB saves)
        return {
            success: true,
            data: output
        };

    } catch (error) {
        console.error('AI Preview Failed:', error);
        return { success: false, message: 'Failed to generate preview' };
    }
}
