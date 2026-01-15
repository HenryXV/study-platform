'use server';

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function processContent(sourceId: string) {
    try {
        // 1. Fetch the raw content
        const source = await prisma.contentSource.findUnique({
            where: { id: sourceId },
        });

        if (!source || !source.bodyText) {
            return { success: false, message: 'Source not found or empty' };
        }

        // 2. Call AI SDK with generateText (new API)
        const { output } = await generateText({
            model: 'google/gemini-2.0-flash-lite',
            output: Output.object({
                schema: z.object({
                    units: z.array(z.object({
                        title: z.string().describe("The concept title"),
                        type: z.enum(['TEXT', 'CODE']).describe("CODE if it involves programming syntax, TEXT for theory"),
                        content: z.string().describe("The main explanation (front of card)"),
                        codeSnippet: z.string().optional().describe("The code block if type is CODE"),
                        answer: z.string().describe("The expected answer or resolution (back of card)"),
                    }))
                }),
            }),
            prompt: `
        You are a strict teacher. Analyze the following text. 
        Split it into atomic study concepts (flashcards).
        
        Rules:
        - If you see code examples, create a CODE unit with the snippet.
        - If you see theory/definitions, create a TEXT unit.
        - 'content' is the Question/Prompt.
        - 'answer' is the Solution/Explanation.
        - Ignore generic intros/outros.
        
        Text:
        ${source.bodyText}
      `,
        });

        // 3. Save to Database (Transaction)
        // The output object now matches the schema directly
        if (!output?.units) {
            throw new Error('AI failed to generate valid units');
        }

        const count = await prisma.$transaction(async (tx) => {
            let createdCount = 0;

            for (const unit of output.units) {
                // Create the Study Unit
                const studyUnit = await tx.studyUnit.create({
                    data: {
                        sourceId: source.id,
                        type: unit.type,
                        content: unit.title, // Using title as the main identifier for the Unit list
                    },
                });

                // Create the Question (Flashcard) for this unit
                await tx.question.create({
                    data: {
                        unitId: studyUnit.id,
                        type: unit.type === 'CODE' ? 'SNIPPET' : 'MULTI_CHOICE', // Defaulting for now
                        data: {
                            question: unit.content,
                            answer: unit.answer,
                            codeSnippet: unit.codeSnippet,
                        },
                    },
                });

                createdCount++;
            }

            // Mark source as processed
            await tx.contentSource.update({
                where: { id: source.id },
                data: { status: 'PROCESSED' },
            });

            return createdCount;
        });

        revalidatePath('/');
        return { success: true, count };

    } catch (error) {
        console.error('AI Processing Failed:', error);
        return { success: false, message: 'Failed to process content' };
    }
}
